// src/lib/settings.ts

export type ActionType = 'template' | 'link' | 'back' | 'none';

export type FlowOption = {
  id: string;
  label: string;       // Texto del botón (ej: "Ir a la Web")
  action: ActionType;  // Qué hace: abrir link, ir a otro nodo, volver
  target?: string;     // ID del nodo destino (ej: 'node_1') o URL
};

export type FlowNode = {
  id: string;
  text: string;        // Mensaje principal del bot
  mediaUrl?: string;
  mediaBase64?: string;
  options: FlowOption[];
};

export type Settings = {
  businessName: string;
  defaultChannel: 'whatsapp' | 'web';
  whatsapp: {
    enabled: boolean;
    phoneNumberId: string;
    accessToken: string;
    verifyToken: string;
    chatbotNumber: string;
    notificationPhones: string;
  };
  hours: {
    timezone: string;
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  messages: {
    welcome: string;
    inactivity: string;
    handoff: string;
    closing: string;
  };
  orders: {
    allowOrders: boolean;
    requireConfirmation: boolean;
    notifyEmail: string;
  };
  api: {
    publicBaseUrl: string;
    webhookSecret: string;
  };
  // 👇 NUEVO: Estructura de Flujo Complejo
  flow: {
    active: boolean; // Interruptor general
    nodes: any;
  };
};

export const defaultSettings: Settings = {
  businessName: 'Delicias Porteñas',
  defaultChannel: 'whatsapp',
  whatsapp: {
    enabled: true,
    phoneNumberId: '',
    accessToken: '',
    verifyToken: '',
    chatbotNumber: '',
    notificationPhones: ''
  },
  hours: {
    timezone: 'America/Santiago',
    weekdays: '10:00 – 21:00',
    saturday: '10:00 – 21:00',
    sunday: 'Según disponibilidad, consultar por WhatsApp.'
  },
  messages: {
    welcome: '¡Hola! 👋 Soy el asistente virtual.',
    inactivity: 'Sigo por aquí 😊.',
    handoff: 'Derivaré tu consulta a una persona. 👤',
    closing: 'Gracias por escribirnos. 👋'
  },
  orders: {
    allowOrders: true,
    requireConfirmation: true,
    notifyEmail: ''
  },
  api: {
    publicBaseUrl: '',
    webhookSecret: ''
  },
  // 👇 NUEVOS DEFAULTS: Árbol de Navegación
  flow: {
    active: true,
    nodes: {
      welcome: {
        id: 'welcome',
        text: '¡Hola! 👋 Bienvenido a Delicias Porteñas. Por favor elige una opción:',
        mediaUrl: '',
        options: [
          { id: 'btn_w1', label: '1. Ver Catálogo y Hacer Pedido🎂', action: 'template', target: 'node_1' },
          { id: 'btn_w2', label: '2. Horarios y Sucursales📍', action: 'template', target: 'node_2' },
          { id: 'btn_w3', label: '3. Atención al Cliente 📝 ', action: 'template', target: 'node_3' }
        ]
      },
      node_1: {
        id: 'node_1',
        text: '1. Ver Catálogo y Hacer Pedido🎂',
        options: [
          { id: 'btn_n1_1', label: '1. Ver en la Web 🌐', action: 'link', target: 'https://deliciasportenas.cl/latiendita' },
          { id: 'btn_n1_2', label: '2. Volver al Menú ↩️', action: 'back' }
        ]
      },
      node_2: {
        id: 'node_2',
        text: '2. Horarios y Sucursales📍',
        options: [
          { id: 'btn_n2_1', label: '1. Ir a la "Tiendita Porteña" 🌐', action: 'link', target: 'https://deliciasportenas.cl/latiendita' },
          { id: 'btn_n2_2', label: '2. Volver al inicio ↩️', action: 'back' }
        ]
      },
      node_3: {
        id: 'node_3',
        text: '3. Atención al Cliente 📝 ',
        options: [
          { id: 'btn_n3_1', label: '1. Contactar con atención al cliente👤', action: 'link', target: 'https://wa.me/56931069911' },
          { id: 'btn_n3_2', label: '2. Volver ↩️', action: 'back' }
        ]
      }
    }
  }
};