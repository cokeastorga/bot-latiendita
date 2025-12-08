// src/routes/api/webhook/+server.ts
import { getGlobalSettings } from '$lib/settings.server';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import {
  processMessage,
  type BotContext,
  type Channel
} from '$lib/chatbot/engine';
import { logConversationEvent } from '$lib/chatbot/store';
import { db } from '$lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

type HistoryItem = {
  from: 'user' | 'bot';
  text: string;
  ts: number;
};

type ConversationDoc = {
  state?: string | null;
  metadata?: Record<string, unknown>;
  history?: HistoryItem[];
  channel?: Channel;
  userId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastMessageAt?: any;
};

// GET: Verificación del webhook
export const GET: RequestHandler = async ({ url }) => {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const settings = await getGlobalSettings();
  const VERIFY_TOKEN = settings.whatsapp.verifyToken || 'mi_token_seguro';

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    console.log('✅ WEBHOOK_VERIFIED (WhatsApp)');
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
};

// POST: Procesar mensajes entrantes
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);

  if (!body) return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });

  // Validación básica de evento WhatsApp
  if (body.object !== 'whatsapp_business_account') {
    return json({ ok: true, skip: 'Not a WhatsApp event' });
  }

  const settings = await getGlobalSettings();
  const whatsappCfg = settings.whatsapp;

  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages ?? [];

    if (!messages.length) {
      return json({ ok: true, skip: 'No messages' });
    }

    const msg = messages[0];
    const fromPhone: string = msg.from;
    
    // 🟢 LÓGICA UNIFICADA DE TEXTO Y BOTONES
    let text = '';

    if (msg.type === 'text') {
      text = msg.text?.body ?? '';
    } else if (msg.type === 'interactive') {
      // Si el usuario hizo clic en un botón, extraemos el título para el motor
      const type = msg.interactive.type;
      if (type === 'button_reply') {
        text = msg.interactive.button_reply.title;
      } else if (type === 'list_reply') {
        text = msg.interactive.list_reply.title;
      }
    } else {
      console.log('ℹ️ Tipo de mensaje ignorado:', msg.type);
      return json({ ok: true, ignored: true });
    }

    if (!text.trim()) {
      return json({ ok: true, ignored: 'Empty text' });
    }

    // 1. Gestión de Conversación en Firestore
    const channel: Channel = 'whatsapp';
    const conversationId = `wa:${fromPhone}`;
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);

    let convData: ConversationDoc;

    if (!convSnap.exists()) {
      convData = {
        state: null,
        metadata: {},
        history: [],
        channel,
        userId: fromPhone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(convRef, convData);
    } else {
      convData = (convSnap.data() as ConversationDoc) || {};
    }

    // 2. Lógica Timeout (5 Minutos)
    const TIMEOUT_MS = 5 * 60 * 1000;
    const now = Date.now();
    const lastMsgTime = convData.lastMessageAt?.toMillis 
      ? convData.lastMessageAt.toMillis() 
      : (convData.updatedAt?.toMillis ? convData.updatedAt.toMillis() : now);

    let previousState = convData.state ?? null;
    let previousMetadata = convData.metadata ?? {};
    
    if (now - lastMsgTime > TIMEOUT_MS) {
      console.log(`⏱️ Sesión expirada para ${conversationId}.`);
      previousState = null;
      previousMetadata = {
        ...previousMetadata,
        orderDraft: null,
        aiSlots: null,
        aiGeneratedReply: null
      };
    }

    const history: HistoryItem[] = (convData.history ?? []).slice(-40);

    // 3. Llamada al Motor (Engine + IA)
    const ctx: BotContext = {
      conversationId,
      userId: fromPhone,
      channel,
      text,
      locale: 'es',
      previousState,
      metadata: {
        ...previousMetadata,
        history,
        settings // Pasamos la configuración global
      }
    };

    const botResponse = await processMessage(ctx);

    // 4. Actualización de Estado
    const newHistory: HistoryItem[] = [
      ...history,
      { from: 'user', text, ts: Date.now() },
      { from: 'bot', text: botResponse.reply, ts: Date.now() }
    ].slice(-40);

    const newMetadata: Record<string, unknown> = {
      ...previousMetadata,
      ...(botResponse.meta ?? {})
    };

    let nextStateToSave = botResponse.nextState ?? previousState ?? null;

    if (botResponse.shouldClearMemory) {
      delete newMetadata.orderDraft;
      delete newMetadata.aiSlots;
      delete newMetadata.aiGeneratedReply;
      nextStateToSave = null;
    }

    await updateDoc(convRef, {
      state: nextStateToSave,
      metadata: newMetadata,
      history: newHistory,
      channel,
      userId: fromPhone,
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessageText: text,
      needsHuman: botResponse.needsHuman ?? false,
      status: botResponse.needsHuman ? 'pending' : 'open'
    });

    // 5. Notificaciones Staff
    if (botResponse.needsHuman) {
      const orderDraft = (botResponse.meta as any)?.orderDraft;
      
      // Guardar pedido
      if (orderDraft && orderDraft.confirmado) {
          const orderId = `${conversationId}-${Date.now()}`;
          await setDoc(doc(db, 'orders', orderId), {
              conversationId,
              userId: fromPhone,
              channel,
              createdAt: serverTimestamp(),
              status: 'pending',
              draft: orderDraft
          });
      }

      // Enviar alerta
      try {
        const notifyPhones = (whatsappCfg.notificationPhones ?? '')
          .split(',')
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 8);

        if (notifyPhones.length > 0 && whatsappCfg.accessToken && whatsappCfg.phoneNumberId) {
          const adminUrl = `https://graph.facebook.com/v21.0/${whatsappCfg.phoneNumberId}/messages`;
          const adminHeaders = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${whatsappCfg.accessToken}`
          };

          let staffBody = '';
          if (orderDraft && orderDraft.confirmado) {
              staffBody = `📦 *NUEVO PEDIDO*\nCliente: ${fromPhone}\n\n${botResponse.reply}`;
          } else {
              staffBody = `👤 *ATENCIÓN*\nCliente: ${fromPhone}\nMsg: "${text}"`;
          }

          for (const adminPhone of notifyPhones) {
            await fetch(adminUrl, {
              method: 'POST',
              headers: adminHeaders,
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: adminPhone,
                type: 'text',
                text: { body: staffBody }
              })
            }).catch(e => console.error('Error enviando a admin:', e));
          }
        }
      } catch (err) {
        console.error('Error notificando staff:', err);
      }
    }

    // Registrar Log
    try {
      const logCtx = { ...ctx, metadata: newMetadata, previousState };
      logConversationEvent(logCtx, botResponse).catch(console.error);
    } catch (e) { console.error(e); }

   // 6. Enviar Respuesta al Usuario (WhatsApp Cloud API)
    if (whatsappCfg.accessToken && whatsappCfg.phoneNumberId) {
      try {
        const url = `https://graph.facebook.com/v21.0/${whatsappCfg.phoneNumberId}/messages`;
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${whatsappCfg.accessToken}`
        };

        // PASO 1: ENVIAR IMAGEN PRIMERO (Si existe)
        if (botResponse.media && botResponse.media.length > 0) {
          for (const m of botResponse.media) {
            if (m.type === 'image') {
              await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  messaging_product: 'whatsapp',
                  to: fromPhone,
                  type: 'image',
                  image: { link: m.url, caption: m.caption ?? '' }
                })
              });
            }
          }
        }

        // PASO 2: ENVIAR TEXTO O BOTONES DESPUÉS
        let payload: any = {
          messaging_product: 'whatsapp',
          to: fromPhone
        };

        if (botResponse.interactive) {
          payload.type = 'interactive';
          payload.interactive = botResponse.interactive;
        } else {
          payload.type = 'text';
          payload.text = { body: botResponse.reply };
        }

        await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

      } catch (e) {
        console.error('❌ Error enviando a WhatsApp API:', e);
      }
    }

    return json({ ok: true });

  } catch (err) {
    console.error('❌ Error webhook:', err);
    return json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
};