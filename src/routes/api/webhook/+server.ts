// src/routes/api/webhook/+server.ts
import { getGlobalSettings } from '$lib/settings.server';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import {
  processMessage,
  type BotContext,
  type Channel
} from '$lib/chatbot/engine';
import { db } from '$lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  query, orderBy, limit, getDocs
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
  unreadCount?: number;
};

// Verificación del Webhook para Meta
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

    // 1. GESTIÓN DE CONVERSACIÓN
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

    // 2. LÓGICA DE TIMEOUT (5 MINUTOS)
    const TIMEOUT_MS = 5 * 60 * 1000;
    const now = Date.now();
    const lastMsgTime = convData.lastMessageAt?.toMillis ? convData.lastMessageAt.toMillis() : now;
    let previousState = convData.state ?? null;
    let previousMetadata = convData.metadata ?? {};

    if (now - lastMsgTime > TIMEOUT_MS) {
      previousState = null;
      previousMetadata = { ...previousMetadata, orderDraft: null, aiSlots: null };
    }

    // 3. MOTOR DEL CHATBOT
    const history = (convData.history ?? []).slice(-40);
    const ctx: BotContext = {
      conversationId, userId: fromPhone, channel, text, locale: 'es',
      previousState, metadata: { ...previousMetadata, history, settings }
    };

    // -----------------------------------------------------------------------
    // 🛑 LÓGICA DE PAUSA (VERSIÓN SEGURA - SIN INDICES COMPLEJOS)
    // -----------------------------------------------------------------------
    const PAUSE_DURATION_MS = 30 * 60 * 1000; // 30 Minutos
    
    // Obtenemos los últimos 15 mensajes (Solo ordenados por fecha, esto SIEMPRE funciona)
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const qLast = query(
      messagesRef, 
      orderBy('createdAt', 'desc'), 
      limit(15) 
    );
    
    const snapshots = await getDocs(qLast);
    
    // Filtramos en memoria para encontrar el último de 'staff'
    const lastStaffMsg = snapshots.docs
        .map(d => d.data())
        .find(msg => msg.from === 'staff');
    
    if (lastStaffMsg) {
      const lastStaffTime = lastStaffMsg.createdAt?.toMillis 
        ? lastStaffMsg.createdAt.toMillis() 
        : Date.now();
        
      const timeSinceStaff = Date.now() - lastStaffTime;

      if (timeSinceStaff < PAUSE_DURATION_MS) {
        console.log(`[Webhook] ⏸️ Conversación pausada. Staff respondió hace ${Math.round(timeSinceStaff/60000)} min.`);
        
        await addDoc(messagesRef, {
            from: 'user',
            direction: 'in',
            text: text,
            createdAt: serverTimestamp(),
            paused: true
        });
        
        await updateDoc(convRef, {
            lastMessageAt: serverTimestamp(),
            lastMessageText: text,
            unreadCount: (convData.unreadCount || 0) + 1
        });

        return json({ ok: true, ignored: 'paused_by_human' });
      }
    }

    // -----------------------------------------------------------------------
    // PROCESAMIENTO NORMAL DEL BOT
    // -----------------------------------------------------------------------

    const botResponse = await processMessage(ctx);

    // 4. ACTUALIZACIÓN DEL DOCUMENTO PRINCIPAL
    const newMetadata = { ...previousMetadata, ...(botResponse.meta ?? {}) };
    let nextStateToSave = botResponse.nextState ?? previousState ?? null;

    if (botResponse.shouldClearMemory) {
      delete newMetadata.orderDraft;
      delete newMetadata.aiSlots;
      nextStateToSave = null;
    }

    await updateDoc(convRef, {
      state: nextStateToSave,
      metadata: newMetadata,
      updatedAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
      lastMessageText: text,
      needsHuman: botResponse.needsHuman ?? false,
      status: botResponse.needsHuman ? 'pending' : 'open'
    });

    // 5. REGISTRO EN SUBCOLECCIÓN "MESSAGES"
    // Usuario
    await addDoc(messagesRef, {
      from: 'user',
      direction: 'in',
      text: text,
      createdAt: serverTimestamp()
    });

    // Bot (Aquí corregí también el guardado del Intent ID)
    await addDoc(messagesRef, {
      from: 'bot',
      direction: 'out',
      text: botResponse.reply,
      intentId: botResponse.intent?.id || null, // Corrección: .intent.id en vez de .intentId
      createdAt: serverTimestamp()
    });

    // 6. ENVIAR RESPUESTA A WHATSAPP
    if (whatsappCfg.accessToken && whatsappCfg.phoneNumberId) {
      const url = `https://graph.facebook.com/v21.0/${whatsappCfg.phoneNumberId}/messages`;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${whatsappCfg.accessToken}`
      };

      // Enviar imagen si existe
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
                image: { link: m.url, caption: '' }
              })
            }).catch(e => console.error('Error img:', e));
          }
        }
      }

      // Enviar texto o interactivo
      const payload: any = { messaging_product: 'whatsapp', to: fromPhone };
      if (botResponse.interactive) {
        payload.type = 'interactive';
        payload.interactive = botResponse.interactive;
      } else {
        payload.type = 'text';
        payload.text = { body: botResponse.reply };
      }
      
      await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
        .catch(e => console.error('Error enviando msg:', e));
    }

    return json({ ok: true });

  } catch (err) {
    console.error('❌ Error crítico en Webhook:', err);
    return json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
};