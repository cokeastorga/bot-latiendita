// src/lib/chatbot/engine.ts
import {
  buildMenuResumen,
  buscarProductoPorTexto
} from '$lib/chatbot/catalog/productos';
import { buildImageUrl } from '$lib/chatbot/utils/images';
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
  hours?: {
    weekdays?: string;
    saturday?: string;
    sunday?: string;
  };
  messages?: {
    welcome?: string;
    handoff?: string;
    closing?: string;
  };
  // Nuevo:
  flow?: {
    welcomeMenu?: {
      headerText?: string;
      options?: Array<{
        id: string;
        label: string;
        replyText: string;
        triggerIntent?: string;
      }>;
    };
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
  media?: Array<{
    type: 'image';
    url: string;
    caption?: string;
  }>;
  shouldClearMemory?: boolean; 
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Función auxiliar para detectar si el usuario seleccionó una opción del menú
 */
function detectMenuSelection(text: string, options: any[]): string | null {
  const n = normalize(text);
  // Chequear números exactos "1", "2", "3" o "opcion 1", etc.
  if (n === '1' || n.includes('opcion 1')) return options[0]?.id;
  if (n === '2' || n.includes('opcion 2')) return options[1]?.id;
  if (n === '3' || n.includes('opcion 3')) return options[2]?.id;
  
  // Chequear coincidencia con el texto de la etiqueta
  for (const opt of options) {
    if (n.includes(normalize(opt.label))) return opt.id;
  }
  return null;
}

/**
 * Detección de intención básica por reglas
 */
export function detectIntent(
  text: string,
  previousState?: string | null
): IntentMatch {
  const normalized = normalize(text);
  const hasAny = (keywords: string[]) => keywords.some((k) => normalized.includes(k));

  if (hasAny(['chao', 'chau', 'adios', 'hasta luego', 'nos vemos', 'cancelar', 'salir', 'terminar', 'fin', 'cerrar'])) {
    return { id: 'goodbye', confidence: 0.99, reason: 'Palabra de cierre' };
  }

  if (previousState === 'collecting_order_details') {
    if (hasAny(['confirmar', 'listo', 'ok', 'estaria bien', 'ya', 'si', 'dale', 'bueno'])) {
      return { id: 'order_start', confidence: 0.95, reason: 'Confirmación de flujo' };
    }
    return { id: 'order_start', confidence: 0.85, reason: 'Continuación de flujo' };
  }

  if (hasAny(['hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'alo'])) {
    return { id: 'greeting', confidence: 0.9, reason: 'Saludo' };
  }

  if (hasAny(['pedido', 'orden', 'comprar', 'encargar', 'quiero un', 'quiero una', 'hacer un pedido', 'pedir'])) {
    return { id: 'order_start', confidence: 0.92, reason: 'Intención de compra' };
  }

  if (hasAny(['estado', 'mi pedido', 'seguimiento', 'tracking', 'donde viene'])) {
    return { id: 'order_status', confidence: 0.9, reason: 'Consulta estado' };
  }

  if (hasAny(['horario', 'abren', 'cierran', 'atienden', 'hora', 'ubicacion', 'ubicados', 'donde estan', 'direccion', 'local'])) {
    return { id: 'faq_hours', confidence: 0.9, reason: 'Consulta info negocio' };
  }

  if (hasAny(['menu', 'carta', 'productos', 'precios', 'catalogo', 'variedades', 'opciones', 'que tienen'])) {
    return { id: 'faq_menu', confidence: 0.93, reason: 'Consulta menú' };
  }

  if (hasAny(['hablar con una persona', 'hablar con humano', 'asesor', 'ejecutivo', 'humano'])) {
    return { id: 'handoff_human', confidence: 0.95, reason: 'Handoff' };
  }

  if (hasAny(['como estas', 'que tal', 'quien eres'])) {
    return { id: 'smalltalk', confidence: 0.7, reason: 'Smalltalk' };
  }

  return { id: 'fallback', confidence: 0.3, reason: 'Fallback' };
}

/**
 * Construye la respuesta final
 */
export async function buildReply(intent: IntentMatch, ctx: BotContext): Promise<BotResponse> {
  const isWhatsApp = ctx.channel === 'whatsapp';
  const settings = (((ctx.metadata ?? {}) as any).settings ?? {}) as SettingsMeta;
  const messages = settings.messages ?? {};
  const hours = settings.hours ?? {};
  const flow = settings.flow?.welcomeMenu ?? {};
  const options = flow.options ?? [];
  
  const lineBreak = isWhatsApp ? '\n' : '\n';
  const aiReply = (ctx.metadata as any)?.aiGeneratedReply as string | undefined;

  let reply = '';
  let nextState: string | null = ctx.previousState ?? null;
  let needsHuman = false;
  let shouldClearMemory = false;

  switch (intent.id) {
    case 'greeting': {
      // ✅ MENÚ DINÁMICO: Construimos el menú desde los settings
      const header = flow.headerText || 'Hola, elige una opción:';
      
      const menuList = options.map((opt: any, i: number) => 
        `${i + 1}. ${opt.label}`
      ).join(lineBreak);

      reply = `${header}${lineBreak}${lineBreak}${menuList}`;
      nextState = 'idle';
      break;
    }

    case 'smalltalk': {
      if (aiReply) {
        reply = aiReply;
      } else {
        reply = `Estoy aquí para ayudarte con tus pedidos. Puedes decir "Ver catálogo" o "Hacer un pedido". 😊`;
      }
      nextState = 'idle';
      break;
    }

    case 'order_start': {
      const producto = buscarProductoPorTexto(ctx.text);
      const draft: OrderDraft = { producto: producto ? producto.nombre : null };
      return await buildProductOrderResponse(producto, draft, ctx, intent, lineBreak, aiReply);
    }

    case 'order_status': {
      reply = `Para revisar el estado de tu pedido necesito algún dato de referencia (ej. número de pedido o nombre).`;
      nextState = 'awaiting_order_reference';
      break;
    }

    case 'faq_hours': {
      const wd = hours.weekdays || 'Consultar';
      const sat = hours.saturday || 'Consultar';
      const sun = hours.sunday || 'Cerrado';

      if (aiReply && aiReply.length > 20) {
         reply = aiReply;
      } else {
         reply = `🕒 *Horarios de Atención:*\n• Lunes a Viernes: ${wd}\n• Sábados: ${sat}\n• Domingos: ${sun}`;
      }

      nextState = ctx.previousState ?? 'idle';
      if (!ctx.previousState || ctx.previousState === 'idle') shouldClearMemory = true;
      break;
    }

    case 'faq_menu': {
      const resumen = buildMenuResumen(4);
      const intro = aiReply ? aiReply : `Aquí tienes algunas de nuestras tortas favoritas 🍰:`;
      reply = `${intro}${lineBreak}${lineBreak}${resumen}${lineBreak}${lineBreak}¿Te gustaría alguna? Solo escribe el nombre.`;
      
      nextState = ctx.previousState ?? 'idle';
      if (!ctx.previousState || ctx.previousState === 'idle') shouldClearMemory = true;
      break;
    }

    case 'handoff_human': {
      reply = messages.handoff || 'Entendido, voy a avisar a un ejecutivo para que te atienda personalmente. 👤';
      nextState = 'handoff_requested';
      needsHuman = true;
      break;
    }

    case 'goodbye': {
      reply = aiReply || messages.closing || '¡Gracias! 👋 Que tengas un excelente día.';
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

      if (aiReply) {
        reply = aiReply;
      } else {
        reply = `No estoy seguro de entender 🤔. Puedes probar diciendo "Ver el menú", "Horarios" o "Quiero pedir una torta".`;
      }
      nextState = ctx.previousState ?? 'idle';
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
  // 1. Cargar configuración de menú para detección temprana
  const settings = (((ctx.metadata ?? {}) as any).settings ?? {}) as any;
  const menuOptions = settings.flow?.welcomeMenu?.options ?? [];

  // 2. Interceptar selección de menú (si no estamos en medio de un pedido)
  if (ctx.previousState !== 'collecting_order_details') {
    const selectedId = detectMenuSelection(ctx.text, menuOptions);
    
    if (selectedId) {
      const selectedOption = menuOptions.find((o: any) => o.id === selectedId);
      
      if (selectedOption) {
        // Opción A: Tiene un triggerIntent configurado (ej. 'faq_menu')
        if (selectedOption.triggerIntent) {
           const intentMock: IntentMatch = { 
             id: selectedOption.triggerIntent, 
             confidence: 1.0, 
             reason: 'Menu Selection' 
           };
           // Saltamos directo a construir la respuesta del intent
           return await buildReply(intentMock, ctx);
        }
        
        // Opción B: Es una respuesta de texto simple
        if (selectedOption.replyText) {
           return {
             reply: selectedOption.replyText,
             intent: { id: 'smalltalk', confidence: 1, reason: 'Menu Reply' },
             nextState: 'idle',
             needsHuman: false,
             meta: { ...ctx.metadata }
           };
        }
      }
    }
  }

  // 3. Detección normal
  const ruleIntent = detectIntent(ctx.text, ctx.previousState);
  const simpleIntents: IntentId[] = ['goodbye', 'handoff_human']; 

  if (ruleIntent.confidence >= 0.95 && simpleIntents.includes(ruleIntent.id)) {
    return await buildReply(ruleIntent, ctx);
  }

  // 4. IA NLU (Gemini)
  let aiResult: AiNLUResult | null = null;
  try {
    aiResult = await aiUnderstand(ctx, ruleIntent.id);
  } catch (err) {
    console.error('❌ Error IA:', err);
  }

  if (aiResult && aiResult.intentId) {
    if (aiResult.slots?.producto) {
      aiResult.intentId = 'order_start';
    }

    const intent: IntentMatch = {
      id: aiResult.intentId,
      confidence: aiResult.confidence ?? 0.9,
      reason: 'IA NLU'
    };

    const previousDraft = ((ctx.metadata ?? {}) as any).orderDraft as OrderDraft | undefined;
    const mergedDraft = mergeOrderDraft(previousDraft, aiResult.slots, ctx);

    const enhancedCtx: BotContext = {
      ...ctx,
      metadata: {
        ...(ctx.metadata ?? {}),
        aiSlots: aiResult.slots,
        aiNeedsHuman: aiResult.needsHuman ?? false,
        aiGeneratedReply: aiResult.generatedReply, 
        orderDraft: mergedDraft
      }
    };

    const lineBreak = enhancedCtx.channel === 'whatsapp' ? '\n' : '\n';

    if (intent.id === 'order_start' || enhancedCtx.previousState === 'collecting_order_details') {
      const producto = buscarProductoPorTexto(mergedDraft.producto || '');
      return await buildProductOrderResponse(
        producto,
        mergedDraft,
        enhancedCtx,
        intent,
        lineBreak,
        aiResult.generatedReply
      );
    }

    const response = await buildReply(intent, enhancedCtx);
    if (aiResult.needsHuman) {
      response.needsHuman = true;
      response.nextState = 'handoff_requested';
    }
    return response;
  }

  return await buildReply(ruleIntent, ctx);
}