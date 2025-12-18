// src/lib/chatbot/engine.ts
import {
  buildMenuResumen,
  buscarProductoPorTexto
} from '$lib/chatbot/catalog/productos';
import { aiUnderstand, type AiNLUResult } from '$lib/chatbot/aiUnderstanding';
import {
  mergeOrderDraft,
  buildProductOrderResponse,
  type OrderDraft
} from '$lib/chatbot/logic/order';

export type Channel = 'whatsapp' | 'web';

export type IntentId =
  | 'greeting'
  | 'smalltalk'
  | 'order_start'
  | 'order_status'
  | 'faq_hours'
  | 'faq_menu'
  | 'handoff_human'
  | 'goodbye'
  | 'fallback';

type SettingsMeta = {
  businessName?: string;
  flow?: {
    active?: boolean;
    nodes?: Record<string, {
      id: string;
      text: string;
      mediaUrl?: string;
      options: Array<{
        id: string;
        label: string;
        action: 'template' | 'link' | 'back' | 'none';
        target?: string;
      }>;
    }>;
  };
  messages?: any;
  hours?: any;
  whatsapp?: {
    chatbotNumber?: string;
  };
};

export interface BotContext {
  conversationId: string;
  userId?: string;
  channel: Channel;
  text: string;
  locale?: 'es' | 'en';
  previousState?: string | null;
  metadata?: Record<string, unknown>;
}

export interface IntentMatch {
  id: IntentId;
  confidence: number;
  reason: string;
}

export interface BotResponse {
  reply: string;
  intent: IntentMatch;
  nextState?: string | null;
  needsHuman?: boolean;
  meta?: Record<string, unknown>;
  media?: Array<{ type: 'image'; url: string; caption?: string }>;
  shouldClearMemory?: boolean; 
  interactive?: {
    type: 'button' | 'list';
    body: { text: string };
    action: any;
  };
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function detectMenuSelection(text: string, options: any[]): string | null {
  const n = normalize(text);
  if (/^\d+$/.test(n)) {
    const index = parseInt(n) - 1;
    if (options[index]) return options[index].id;
  }
  for (const opt of options) {
    if (n.includes(normalize(opt.label))) return opt.id;
  }
  return null;
}

export function detectIntent(text: string, previousState?: string | null): IntentMatch {
  const normalized = normalize(text);
  const has = (k: string[]) => k.some(w => normalized.includes(w));

  if (has(['chao', 'adios', 'salir', 'terminar'])) return { id: 'goodbye', confidence: 0.99, reason: 'cierre' };
  if (has(['hola', 'buenas', 'inicio', 'buenos', 'buen'])) return { id: 'greeting', confidence: 0.9, reason: 'saludo' };
  if (has(['pedido', 'comprar', 'torta', 'facturas'])) return { id: 'order_start', confidence: 0.9, reason: 'pedido' };
  
  return { id: 'fallback', confidence: 0.3, reason: 'fallback' };
}

export async function buildReply(intent: IntentMatch, ctx: BotContext): Promise<BotResponse> {
  const isWhatsApp = ctx.channel === 'whatsapp';
  const settings = (((ctx.metadata ?? {}) as any).settings ?? {}) as SettingsMeta;
  const messages = settings.messages ?? {};
  const hours = settings.hours ?? {};
  const flow = settings.flow?.welcomeMenu ?? {}; 
  const botNumber = settings.whatsapp?.chatbotNumber;
  const lineBreak = isWhatsApp ? '\n' : '\n';
  const aiReply = (ctx.metadata as any)?.aiGeneratedReply as string | undefined;

  let reply = '';
  let nextState: string | null = ctx.previousState ?? null;
  let needsHuman = false;
  let shouldClearMemory = false;

  switch (intent.id) {
    case 'greeting': {
      const welcomeNode = settings.flow?.nodes?.['welcome'];
      if (welcomeNode) {
        return formatNodeResponse(welcomeNode, 'welcome', ctx);
      }
      reply = 'Hola, bienvenido.';
      nextState = 'idle';
      break;
    }

    case 'smalltalk': {
      reply = aiReply || `Estoy aquí para ayudarte. 😊`;
      nextState = 'idle';
      break;
    }

    case 'order_start': {
      const producto = buscarProductoPorTexto(ctx.text);
      const draft: OrderDraft = { producto: producto ? producto.nombre : null };
      return await buildProductOrderResponse(producto, draft, ctx, intent, lineBreak, aiReply);
    }

    case 'order_status': {
      reply = `Para revisar el estado necesito algún dato de referencia.`;
      nextState = 'awaiting_order_reference';
      break;
    }

    case 'faq_hours': {
      const wd = hours.weekdays || 'Consultar';
      const sat = hours.saturday || 'Consultar';
      const sun = hours.sunday || 'Cerrado';
      reply = aiReply && aiReply.length > 20 ? aiReply : `🕒 *Horarios:*\n• L-V: ${wd}\n• Sáb: ${sat}\n• Dom: ${sun}`;
      nextState = 'idle';
      shouldClearMemory = true;
      break;
    }

    case 'faq_menu': {
      const resumen = buildMenuResumen(4);
      const intro = aiReply ? aiReply : `Aquí tienes algunas opciones 🍰:`;
      reply = `${intro}${lineBreak}${lineBreak}${resumen}${lineBreak}${lineBreak}¿Te gustaría alguna?`;
      nextState = 'idle';
      shouldClearMemory = true;
      break;
    }

    case 'handoff_human': {
      if (ctx.channel === 'web' && botNumber) {
        reply = `Para atención rápida, hablemos por WhatsApp: https://wa.me/${botNumber}`;
      } else {
        reply = messages.handoff || 'Un ejecutivo te atenderá pronto. 👤';
      }
      nextState = 'handoff_requested';
      needsHuman = true;
      break;
    }

    case 'goodbye': {
      reply = aiReply || messages.closing || '¡Gracias! 👋';
      nextState = 'ended';
      shouldClearMemory = true;
      break;
    }

    case 'fallback':
    default: {
      const producto = buscarProductoPorTexto(ctx.text);
      if (producto) {
        const draft: OrderDraft = { producto: producto.nombre };
        return await buildProductOrderResponse(producto, draft, ctx, intent, lineBreak, aiReply);
      }
      reply = aiReply || `No estoy seguro. Prueba "Ver menú".`;
      nextState = 'idle';
      break;
    }
  }

  return {
    reply,
    intent,
    nextState,
    needsHuman,
    meta: {
      channel: ctx.channel,
      locale: ctx.locale || 'es',
      previousState: ctx.previousState ?? null
    },
    shouldClearMemory
  };
}

export async function processMessage(ctx: BotContext): Promise<BotResponse> {
  const settings = (((ctx.metadata ?? {}) as any).settings ?? {}) as any;
  const flowActive = settings.flow?.active ?? true;
  const flowNodes = settings.flow?.nodes ?? {};
  
  let currentFlowId = (ctx.metadata?.currentFlowId as string) || 'welcome';
  
  const nText = normalize(ctx.text);
  if (nText === 'salir' || nText === 'cancelar' || nText === 'inicio' || nText === 'hola') {
    currentFlowId = 'welcome';
  }

  if (flowActive) {
    const currentNode = flowNodes[currentFlowId];
    if (currentNode && currentNode.options) {
      const selectedId = detectMenuSelection(ctx.text, currentNode.options);
      if (selectedId) {
        const selectedOption = currentNode.options.find((o: any) => o.id === selectedId);
        if (selectedOption) {
          if (selectedOption.action === 'link') {
            return {
              reply: `🔗 Link: ${selectedOption.target}`,
              intent: { id: 'smalltalk', confidence: 1, reason: 'flow_link' },
              nextState: 'idle',
              meta: { ...ctx.metadata, currentFlowId }
            };
          }
          if (selectedOption.action === 'back') {
            const welcomeNode = flowNodes['welcome'];
            return formatNodeResponse(welcomeNode, 'welcome', ctx);
          }
          if (selectedOption.action === 'template' && selectedOption.target) {
            const nextNodeId = selectedOption.target;
            const nextNode = flowNodes[nextNodeId];
            if (nextNode) {
              return formatNodeResponse(nextNode, nextNodeId, ctx);
            }
          }
        }
      }
    }
  }

  const ruleIntent = detectIntent(ctx.text, ctx.previousState);

  if (ruleIntent.id === 'greeting' && flowActive) {
    const welcomeNode = flowNodes['welcome'];
    if (welcomeNode) {
      return formatNodeResponse(welcomeNode, 'welcome', ctx);
    }
  }

  if (ruleIntent.id === 'order_start' || ctx.previousState === 'collecting_order_details') {
    const producto = buscarProductoPorTexto(ctx.text);
    const draft: OrderDraft = { producto: producto ? producto.nombre : null };
    return await buildProductOrderResponse(producto, draft, ctx, ruleIntent, '\n');
  }

  let aiResult: AiNLUResult | null = null;
  try {
    aiResult = await aiUnderstand(ctx, ruleIntent.id);
  } catch (e) { console.error(e); }

  if (aiResult && aiResult.generatedReply) {
    return {
      reply: aiResult.generatedReply,
      intent: { id: aiResult.intentId, confidence: aiResult.confidence, reason: 'IA' },
      nextState: 'idle',
      meta: { ...ctx.metadata }
    };
  }

  return {
    reply: 'No entendí tu opción. Escribe "Inicio" para volver al menú.',
    intent: { id: 'fallback', confidence: 1, reason: 'fallback' },
    nextState: 'idle',
    meta: { ...ctx.metadata }
  };
}

function formatNodeResponse(node: any, nodeId: string, ctx: BotContext): BotResponse {
  const lineBreak = ctx.channel === 'whatsapp' ? '\n' : '\n';
  let menuText = node.text;
  let interactive = undefined;
  
  // 1. SIEMPRE PREPARAMOS LA IMAGEN SI EXISTE
  // (La enviamos en 'media' para que el webhook la envíe primero)
  let media: Array<{ type: 'image'; url: string; caption?: string }> | undefined = undefined;
  if (node.mediaUrl && node.mediaUrl.length > 5) {
    media = [{ type: 'image', url: node.mediaUrl, caption: '' }];
  }

  // 2. BOTONES WHATSAPP (Sin Header, para máxima estabilidad)
  if (ctx.channel === 'whatsapp' && node.options && node.options.length > 0 && node.options.length <= 3) {
    const buttons = node.options.map((opt: any) => ({
      type: 'reply',
      reply: {
        id: opt.id,
        title: opt.label.substring(0, 20) 
      }
    }));

    interactive = {
      type: 'button',
      body: { text: node.text },
      action: { buttons }
    };
    menuText = node.text; 
  } 
  else if (node.options && node.options.length > 0) {
    const list = node.options.map((opt: any, i: number) => `${i + 1}. ${opt.label}`).join(lineBreak);
    menuText += `${lineBreak}${lineBreak}${list}`;
  }

  return {
    reply: menuText,
    interactive: interactive as any,
    media: media, // Enviamos la imagen adjunta
    intent: { id: 'smalltalk', confidence: 1, reason: 'flow_node' },
    nextState: 'awaiting_menu_selection',
    meta: { 
      ...ctx.metadata, 
      currentFlowId: nodeId 
    }
  };
}