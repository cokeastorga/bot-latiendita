// src/lib/settings.ts

export type Settings = {
  businessName: string;
  defaultChannel: 'whatsapp' | 'web';
  whatsapp: {
    enabled: boolean;
    phoneNumberId: string;
    accessToken: string;
    verifyToken: string;
    notificationPhones: string; // separados por coma
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
  // 👇 NUEVO: Configuración del Flujo de Bienvenida
  flow: {
    welcomeMenu: {
      headerText: string;
      options: Array<{
        id: string;
        label: string;
        replyText: string;
        triggerIntent?: string;
      }>;
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
    welcome:
      '¡Hola! 👋 Soy el asistente automático. Puedo ayudarte a hacer pedidos, ver horarios y hablar con una persona del equipo.',
    inactivity:
      'Sigo por aquí 😊 Si todavía necesitas ayuda, puedes escribirme tu consulta o pedido.',
    handoff:
      'Derivaré tu consulta a una persona del equipo 👤. Te responderán lo antes posible.',
    closing:
      'Gracias por escribirnos 🙌 Si más adelante necesitas algo, puedes volver a hablarme cuando quieras.'
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
  // 👇 NUEVOS DEFAULTS
  flow: {
    welcomeMenu: {
      headerText: '¡Hola! 👋 Bienvenido a Delicias Porteñas. ¿En qué puedo ayudarte hoy?',
      options: [
        { 
          id: 'op1', 
          label: 'Ver Menú de Tortas 🎂', 
          replyText: '', 
          triggerIntent: 'faq_menu' 
        },
        { 
          id: 'op2', 
          label: 'Hacer un Pedido 📝', 
          replyText: '¡Genial! Cuéntame qué te gustaría pedir (ej. Torta Mil Hojas para 15 personas).', 
          triggerIntent: 'order_start' 
        },
        { 
          id: 'op3', 
          label: 'Horarios y Ubicación 📍', 
          replyText: '', 
          triggerIntent: 'faq_hours' 
        }
      ]
    }
  }
};