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

type HistoryItem = { from: 'user' | 'bot'; text: string; ts: number; };
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

// GET: Verificación
export const GET: RequestHandler = async ({ url }) => {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const settings = await getGlobalSettings();
  const VERIFY_TOKEN = settings.whatsapp.verifyToken || 'latiendita123';

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
};

// POST: Procesamiento
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null);
  if (!body) return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });

  const settings = await getGlobalSettings();
  const whatsappCfg = settings.whatsapp;

  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages ?? [];

    if (!messages.length) return json({ ok: true, skip: 'No messages' });

    const msg = messages[0];
    const fromPhone: string = msg.from;
    
    // Extracción de Texto
    let text = '';
    if (msg.type === 'text') {
      text = msg.text?.body ?? '';
    } else if (msg.type === 'interactive') {
      const type = msg.interactive.type;
      if (type === 'button_reply') text = msg.interactive.button_reply.title;
      else if (type === 'list_reply') text = msg.interactive.list_reply.title;
    } else {
      return json({ ok: true, ignored: true });
    }

    if (!text.trim()) return json({ ok: true, ignored: 'Empty text' });

    // 1. Gestión Conversación
    const channel: Channel = 'whatsapp';
    const conversationId = `wa:${fromPhone}`;
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    let convData: ConversationDoc;

    if (!convSnap.exists()) {
      convData = {
        state: null, metadata: {}, history: [], channel, userId: fromPhone,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      };
      await setDoc(convRef, convData);
    } else {
      convData = (convSnap.data() as ConversationDoc) || {};
    }

    // 2. Timeout
    const TIMEOUT_MS = 5 * 60 * 1000;
    const now = Date.now();
    const lastMsgTime = convData.lastMessageAt?.toMillis ? convData.lastMessageAt.toMillis() : now;
    let previousState = convData.state ?? null;
    let previousMetadata = convData.metadata ?? {};

    if (now - lastMsgTime > TIMEOUT_MS) {
      previousState = null;
      previousMetadata = { ...previousMetadata, orderDraft: null, aiSlots: null };
    }

    // 3. Motor
    const history = (convData.history ?? []).slice(-40);
    const ctx: BotContext = {
      conversationId, userId: fromPhone, channel, text, locale: 'es',
      previousState, metadata: { ...previousMetadata, history, settings }
    };

    const botResponse = await processMessage(ctx);

    // 4. Guardar
    const newHistory: HistoryItem[] = [
      ...history,
      { from: 'user', text, ts: Date.now() },
      { from: 'bot', text: botResponse.reply, ts: Date.now() }
    ].slice(-40);

    const newMetadata = { ...previousMetadata, ...(botResponse.meta ?? {}) };
    let nextStateToSave = botResponse.nextState ?? previousState ?? null;

    if (botResponse.shouldClearMemory) {
      delete newMetadata.orderDraft;
      delete newMetadata.aiSlots;
      nextStateToSave = null;
    }

    await updateDoc(convRef, {
      state: nextStateToSave, metadata: newMetadata, history: newHistory,
      updatedAt: serverTimestamp(), lastMessageAt: serverTimestamp(), lastMessageText: text,
      needsHuman: botResponse.needsHuman ?? false,
      status: botResponse.needsHuman ? 'pending' : 'open'
    });

    // 5. Notificaciones (Simplificado)
    if (botResponse.needsHuman && whatsappCfg.notificationPhones) { /* ... */ }

    // 6. ENVIAR A WHATSAPP (Lógica Robusta)
    if (whatsappCfg.accessToken && whatsappCfg.phoneNumberId) {
      const url = `https://graph.facebook.com/v21.0/${whatsappCfg.phoneNumberId}/messages`;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${whatsappCfg.accessToken}`
      };

      try {
        let payload: any = { messaging_product: 'whatsapp', to: fromPhone };

        // Prioridad 1: Interactivo (Botones + Header opcional)
        if (botResponse.interactive) {
          payload.type = 'interactive';
          payload.interactive = botResponse.interactive;

          // INTENTO 1: Enviar con todo (incluyendo imagen si la tiene)
          const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
          
          // Si falla y tenía header, reintentamos SIN header
          if (!res.ok) {
            const errData = await res.json();
            console.warn('⚠️ Falló envío interactivo completo. Reintentando sin header...', errData);

            if (payload.interactive.header) {
              delete payload.interactive.header; // Quitamos la imagen
              await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) }); // Reintento
            }
          }
        } 
        // Prioridad 2: Texto plano (Fallback final)
        else {
          // Si hay imagen suelta, la enviamos aparte
          if (botResponse.media && botResponse.media.length > 0) {
             for (const m of botResponse.media) {
                if (m.type === 'image') {
                  await fetch(url, {
                    method: 'POST', headers,
                    body: JSON.stringify({
                      messaging_product: 'whatsapp', to: fromPhone, type: 'image',
                      image: { link: m.url, caption: botResponse.reply }
                    })
                  });
                }
             }
          } else {
             payload.type = 'text';
             payload.text = { body: botResponse.reply };
             await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
          }
        }

      } catch (e) {
        console.error('❌ Error crítico enviando a WhatsApp:', e);
      }
    }

    return json({ ok: true });

  } catch (err) {
    console.error('❌ Error webhook:', err);
    return json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
};