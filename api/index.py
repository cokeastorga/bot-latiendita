from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

# ==============================================================================
# ⚙️ CONFIGURACIÓN (Rellena esto con tus datos)
# ==============================================================================

# 1. Tu contraseña inventada para verificar el Webhook
VERIFY_TOKEN = "latiendita123" 

# 2. Token de acceso de WhatsApp (Empieza por EAAG...)
# Recuerda: Si es temporal dura 24h, lo ideal es configurar uno permanente.
WHATSAPP_TOKEN = "TU_TOKEN_LARGO_AQUI"

# 3. ID del número de teléfono (Lo sacas de Developers > WhatsApp > API Setup)
PHONE_NUMBER_ID = "TU_ID_NUMERO_AQUI"

# 4. Número del humano para atención (Ej: 56912345678)
NUMERO_HUMANO = "569XXXXXXXX"

# 5. Nombres EXACTOS de tus plantillas (Tal cual salen en tu administrador)
TEMPLATE_BIENVENIDA = "respond_bienvenida"
TEMPLATE_PEDIDO = "respond_pedido"
TEMPLATE_PREGUNTA = "respond_question"
TEMPLATE_ATENCION = "responde_atencion_clie"

# ==============================================================================
# 🛠️ FUNCIONES DE AYUDA
# ==============================================================================

def send_whatsapp_template(phone_number, template_name, user_name=None):
    """Envía una plantilla pre-aprobada de Facebook"""
    url = f"https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    
    data = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "template",
        "template": {
            "name": template_name,
            # IMPORTANTE: Cambia "es_CL" si tu plantilla está en otro idioma (es, es_AR, etc)
            "language": {"code": "es_CL"} 
        }
    }

    # Si la plantilla es la de Bienvenida, inyectamos el nombre {{1}}
    if user_name and template_name == TEMPLATE_BIENVENIDA:
        data["template"]["components"] = [
            {
                "type": "body",
                "parameters": [{"type": "text", "text": user_name}]
            }
        ]

    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Enviando plantilla {template_name}: {response.status_code}")
    except Exception as e:
        print(f"Error enviando mensaje: {e}")

def send_whatsapp_text(phone_number, text):
    """Envía un mensaje de texto simple"""
    url = f"https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    data = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "text",
        "text": {"body": text}
    }
    requests.post(url, json=data, headers=headers)

# ==============================================================================
# 🧠 EL CEREBRO DEL BOT (WEBHOOK)
# ==============================================================================

@app.route('/webhook', methods=['GET'])
def verify_webhook():
    """Verificación inicial de Facebook"""
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')

    if mode and token:
        if mode == 'subscribe' and token == VERIFY_TOKEN:
            return challenge, 200
        else:
            return 'Forbidden', 403
    return 'Hola, el bot está activo', 200

@app.route('/webhook', methods=['POST'])
def webhook():
    """Recepción de mensajes"""
    body = request.json
    
    try:
        # Verificamos si es un mensaje válido de WhatsApp
        if body.get("object") == "whatsapp_business_account":
            entry = body["entry"][0]
            changes = entry["changes"][0]
            value = changes["value"]
            
            # Solo procesamos si hay mensajes
            if "messages" in value:
                message = value["messages"][0]
                phone_number = message["from"]
                msg_type = message["type"]
                
                # Intentamos sacar el nombre del perfil, si falla usamos "Cliente"
                try:
                    user_name = value["contacts"][0]["profile"]["name"]
                except:
                    user_name = "Amante del Pan"

                # ------------------------------------------------------
                # CASO 1: El usuario escribió Texto (ej: "Hola")
                # ------------------------------------------------------
                if msg_type == "text":
                    text_body = message["text"]["body"].lower()
                    palabras_clave = ["hola", "buen", "inicio", "menu", "menú", "volver"]
                    
                    if any(p in text_body for p in palabras_clave):
                        send_whatsapp_template(phone_number, TEMPLATE_BIENVENIDA, user_name)

                # ------------------------------------------------------
                # CASO 2: El usuario presionó un BOTÓN
                # ------------------------------------------------------
                elif msg_type == "interactive":
                    # Obtenemos el TEXTO del botón presionado
                    btn_text = message["interactive"]["button_reply"]["title"]
                    print(f"Botón presionado: {btn_text}")

                    # --- LÓGICA DE BOTONES ---
                    
                    # 1. Opción: HACER UN PEDIDO
                    if "Pedido" in btn_text: 
                        send_whatsapp_template(phone_number, TEMPLATE_PEDIDO)

                    # 2. Opción: PREGUNTA
                    elif "pregunta" in btn_text:
                        send_whatsapp_template(phone_number, TEMPLATE_PREGUNTA)

                    # 3. Opción: ATENCIÓN / HUMANO (Menú Principal)
                    elif "Atención" in btn_text or "Humano" in btn_text:
                        # Envía la plantilla intermedia ("Escribe tu duda o presiona volver")
                        send_whatsapp_template(phone_number, TEMPLATE_ATENCION)

                    # 4. Opción: HABLAR CON UN HUMANO (Sub-menú de la plantilla de atención)
                    # Si tienes un botón específico dentro de la plantilla de atención que dice "Hablar con un Humano"
                    # y quieres que ese botón envíe el link directo:
                    if btn_text == "Hablar con un Humano":
                         msg = f"🤝 Para hablar directamente con nosotros, haz clic aquí: https://wa.me/{NUMERO_HUMANO}"
                         send_whatsapp_text(phone_number, msg)

                    # 5. Opción: VOLVER
                    elif "Volver" in btn_text:
                        send_whatsapp_template(phone_number, TEMPLATE_BIENVENIDA, user_name)

    except Exception as e:
        print(f"Error en el webhook: {e}")
        return "Error", 500

    return "EVENT_RECEIVED", 200

# Para correr en local si fuera necesario
if __name__ == '__main__':
    app.run(debug=True)