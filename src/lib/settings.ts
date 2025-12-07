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
    nodes: {
      welcome: FlowNode;
      node_1: FlowNode;
      node_2: FlowNode;
      node_3: FlowNode;
    };
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
    notificationPhones: ''
  },
  hours: {
    timezone: 'America/Santiago',
    weekdays: '10:00 – 19:00',
    saturday: '10:00 – 14:00',
    sunday: 'Según disponibilidad, consultar por WhatsApp.'
  },
  messages: {
    welcome: '¡Hola! 👋 Soy Edu.',
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
        options: [
          { id: 'btn_w1', label: '1. Ver Catálogo 🎂', action: 'template', target: 'node_1' },
          { id: 'btn_w2', label: '2. Hacer Pedido 📝', action: 'template', target: 'node_2' },
          { id: 'btn_w3', label: '3. Info y Horarios 📍', action: 'template', target: 'node_3' }
        ]
      },
      node_1: {
        id: 'node_1',
        text: '🎂 Tenemos maravillosas tortas caseras. ¿Qué te gustaría hacer?',
        options: [
          { id: 'btn_n1_1', label: '1. Ver en la Web 🌐', action: 'link', target: 'https://deliciasportenas.cl' },
          { id: 'btn_n1_2', label: '2. Volver al Menú ↩️', action: 'back' }
        ]
      },
      node_2: {
        id: 'node_2',
        text: '📝 Para tomar tu pedido necesito algunos datos. ¿Empezamos o prefieres ver la web?',
        options: [
          { id: 'btn_n2_1', label: '1. Empezar aquí (Chat) 💬', action: 'none' }, // 'none' dejará que el usuario escriba y el motor detecte 'order_start'
          { id: 'btn_n2_2', label: '2. Volver al inicio ↩️', action: 'back' }
        ]
      },
      node_3: {
        id: 'node_3',
        text: '📍 Estamos en Santiago Centro.\n🕒 Horario: Lun-Vie 10-19hrs.',
        options: [
          { id: 'btn_n3_1', label: '1. Ver Mapa 🗺️', action: 'link', target: 'https://maps.google.com' },
          { id: 'btn_n3_2', label: '2. Volver ↩️', action: 'back' }
        ]
      }
    }
  }
};