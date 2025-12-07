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

// Estructura SettingsMeta acorde a lo nuevo
type SettingsMeta = {
  businessName?: string;
  flow?: {
    active?: boolean;
    nodes?: Record<string, {
      id: string;
      text: string;
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
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Función que busca si el usuario seleccionó una opción del nodo actual
 */
function detectNodeSelection(text: string, options: any[]): any | null {
  const n = normalize(text);
  // 1. Por índice (1, 2, 3...)
  if (/^\d+$/.test(n)) {
    const index = parseInt(n) - 1;
    if (options[index]) return options[index];
  }
  // 2. Por texto aproximado
  for (const opt of options) {
    if (n.includes(normalize(opt.label))) return opt;
  }
  return null;
}

/**
 * Detección de intención básica
 */
export function detectIntent(text: string, previousState?: string | null): IntentMatch {
  const normalized = normalize(text);
  const has = (k: string[]) => k.some(w => normalized.includes(w));

  if (has(['chao', 'adios', 'salir', 'terminar'])) return { id: 'goodbye', confidence: 0.99, reason: 'cierre' };
  if (has(['hola', 'buenas', 'inicio'])) return { id: 'greeting', confidence: 0.9, reason: 'saludo' };
  if (has(['pedido', 'comprar', 'torta'])) return { id: 'order_start', confidence: 0.9, reason: 'pedido' };
  
  return { id: 'fallback', confidence: 0.3, reason: 'fallback' };
}

/**
 * Procesa mensajes con el nuevo sistema de Flujos
 */
export async function processMessage(ctx: BotContext): Promise<BotResponse> {
  const settings = (((ctx.metadata ?? {}) as any).settings ?? {}) as SettingsMeta;
  const flowActive = settings.flow?.active ?? true;
  const flowNodes = settings.flow?.nodes ?? {};
  
  // Estado actual del flujo (por defecto 'welcome' si no existe)
  let currentFlowId = (ctx.metadata?.currentFlowId as string) || 'welcome';
  
  // Verificar comandos globales de salida
  const nText = normalize(ctx.text);
  if (nText === 'salir' || nText === 'cancelar' || nText === 'inicio' || nText === 'hola') {
    // Reset forzado
    currentFlowId = 'welcome';
  }

  // 1. SI EL FLUJO ESTÁ ACTIVO, INTENTAR NAVEGAR
  if (flowActive) {
    const currentNode = flowNodes[currentFlowId];

    if (currentNode && currentNode.options) {
      const selectedOption = detectNodeSelection(ctx.text, currentNode.options);

      if (selectedOption) {
        // --- ACCIÓN: LINK ---
        if (selectedOption.action === 'link') {
          return {
            reply: `🔗 Puedes visitarlo aquí: ${selectedOption.target}`,
            intent: { id: 'smalltalk', confidence: 1, reason: 'flow_link' },
            nextState: 'idle',
            meta: { ...ctx.metadata, currentFlowId } // Mantenemos el mismo nodo
          };
        }

        // --- ACCIÓN: VOLVER ---
        if (selectedOption.action === 'back') {
          // Volver siempre a welcome
          const welcomeNode = flowNodes['welcome'];
          return formatNodeResponse(welcomeNode, 'welcome', ctx);
        }

        // --- ACCIÓN: TEMPLATE (Ir a otro nodo) ---
        if (selectedOption.action === 'template' && selectedOption.target) {
          const nextNodeId = selectedOption.target;
          const nextNode = flowNodes[nextNodeId];
          if (nextNode) {
            return formatNodeResponse(nextNode, nextNodeId, ctx);
          }
        }
        
        // --- ACCIÓN: NONE (Dejar pasar) ---
        // Si es 'none', dejamos que el código siga abajo a la lógica de IA/Pedidos
      }
    }
  }

  // 2. DETECCIÓN INTENCIÓN NORMAL (Fallback o lógica compleja de pedidos)
  const ruleIntent = detectIntent(ctx.text, ctx.previousState);

  // Si es Saludo -> Forzar Welcome Node
  if (ruleIntent.id === 'greeting' && flowActive) {
    const welcomeNode = flowNodes['welcome'];
    if (welcomeNode) {
      return formatNodeResponse(welcomeNode, 'welcome', ctx);
    }
  }

  // Si es Pedido -> Usar lógica de pedidos existente
  if (ruleIntent.id === 'order_start' || ctx.previousState === 'collecting_order_details') {
    const producto = buscarProductoPorTexto(ctx.text);
    const draft: OrderDraft = { producto: producto ? producto.nombre : null };
    // Mantenemos el flujo actual o lo reseteamos? 
    // Al entrar a un pedido complejo, podríamos "pausar" el flujo de menú.
    return await buildProductOrderResponse(producto, draft, ctx, ruleIntent, '\n');
  }

  // 3. IA Fallback (Gemini)
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

  // Fallback final
  return {
    reply: 'No entendí tu opción. Escribe "Inicio" para ver el menú principal.',
    intent: { id: 'fallback', confidence: 1, reason: 'fallback' },
    nextState: 'idle',
    meta: { ...ctx.metadata }
  };
}

// Helper para formatear respuesta de un nodo
function formatNodeResponse(node: any, nodeId: string, ctx: BotContext): BotResponse {
  const lineBreak = ctx.channel === 'whatsapp' ? '\n' : '\n';
  let menuText = node.text;
  
  if (node.options && node.options.length > 0) {
    const list = node.options.map((opt: any) => `👉 ${opt.label}`).join(lineBreak);
    menuText += `${lineBreak}${lineBreak}${list}`;
  }

  return {
    reply: menuText,
    intent: { id: 'smalltalk', confidence: 1, reason: 'flow_node' },
    nextState: 'awaiting_menu_selection', // Marcador para saber que esperamos input de menú
    meta: { 
      ...ctx.metadata, 
      currentFlowId: nodeId // ACTUALIZAMOS EL ESTADO DEL FLUJO
    }
  };
}