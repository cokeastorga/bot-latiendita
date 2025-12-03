from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

# ==============================================================================
# ⚙️ CONFIGURACIÓN SEGURA (Variables de Entorno)
# ==============================================================================

# Leemos las claves desde el servidor (Vercel) o archivo .env
VERIFY_TOKEN = os.environ.get("VERIFY_TOKEN")
WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.environ.get("PHONE_NUMBER_ID")
NUMERO_HUMANO = os.environ.get("NUMERO_HUMANO")

# Nombres de tus plantillas (Tal cual salen en tu administrador de Meta)
# ✅ CORREGIDO SEGÚN TUS CAPTURAS:
TEMPLATE_BIENVENIDA = "delicias_bienvenida_menu"
TEMPLATE_PEDIDO = "respond_pedido"
TEMPLATE_PREGUNTA = "respond_question"
TEMPLATE_ATENCION = "responde_atencion_cliente"

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
            "language": {"code": "es_CL"} # Ajusta a 'es' o 'es_AR' si en Meta no dice 'es_CL'
        }
    }

    # NOTA: Hemos desactivado la inyección de nombre para evitar errores,
    # ya que tu plantilla "delicias_bienvenida_menu" parece ser texto fijo.
    # Si en el futuro agregas "{{1}}" en Meta, descomenta las líneas de abajo 
    # y asegúrate de respetar la indentación (4 espacios).
    
    # if user_name and template_name == TEMPLATE_BIENVENIDA:
    #     data["template"]["components"] = [
    #         {
    #             "type": "body",
    #             "parameters": [{"type": "text", "text": user_name}]
    #         }
    #     ]

    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code != 200:
            print(f"Error Meta: {response.text}")
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
    try:
        requests.post(url, json=data, headers=headers)
    except Exception as e:
        print(f"Error enviando texto: {e}")

# ==============================================================================
# 🧠 EL CEREBRO DEL BOT (WEBHOOK)
# ==============================================================================

@app.route('/webhook', methods=['GET'])
def verify_webhook():
    """Verificación inicial de Facebook para conectar el webhook"""
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
        # Verificamos si es un evento de mensaje
        if body.get("object") == "whatsapp_business_account":
            entry = body["entry"][0]
            changes = entry["changes"][0]
            value = changes["value"]
            
            # Solo procesamos si hay mensajes nuevos
            if "messages" in value:
                message = value["messages"][0]
                phone_number = message["from"]
                msg_type = message["type"]
                
                # Intentamos obtener el nombre del usuario
                try:
                    user_name = value["contacts"][0]["profile"]["name"]
                except:
                    user_name = "Cliente"

                # ------------------------------------------------------
                # CASO 1: El usuario escribió Texto
                # ------------------------------------------------------
                if msg_type == "text":
                    text_body = message["text"]["body"].lower()
                    
                    # 🟢 DETECCIÓN DE PEDIDO WEB 🟢
                    # Si el mensaje viene de la web (contiene "pedido web" o "quiero confirmar")
                    if "pedido web" in text_body or "quiero confirmar" in text_body:
                        
                        # 1. Enviar confirmación automática
                        msg_confirmacion = (
                            f"¡Hola {user_name}! 👋\n"
                            f"✅ Hemos recibido el detalle de tu pedido Web.\n\n"
                            f"Un humano 🙋‍♂️ revisará el stock y te escribirá en breve para coordinar el pago y la entrega.\n"
                            f"¡Gracias por elegir Delicias Porteñas!"
                        )
                        send_whatsapp_text(phone_number, msg_confirmacion)
                        
                        # (Opcional) Si quieres disparar el menú principal también, descomenta esto:
                        # send_whatsapp_template(phone_number, TEMPLATE_BIENVENIDA, user_name)

                    # 🟢 LÓGICA ESTÁNDAR (Saludos, Menú) 🟢
                    else:
                        palabras_clave = ["hola", "buen", "inicio", "menu", "menú", "volver", "alo", "buenas"]
                        if any(p in text_body for p in palabras_clave):
                            send_whatsapp_template(phone_number, TEMPLATE_BIENVENIDA, user_name)

                # ------------------------------------------------------
                # CASO 2: El usuario presionó un BOTÓN
                # ------------------------------------------------------
                elif msg_type == "interactive":
                    btn_text = message["interactive"]["button_reply"]["title"]
                    
                    # 1. Botón "Hablar con humano" (Link a WhatsApp personal)
                    if "Hablar" in btn_text:
                         msg = f"🤝 Para hablar directamente con nosotros, haz clic aquí: https://wa.me/{NUMERO_HUMANO}"
                         send_whatsapp_text(phone_number, msg)
                    
                    # 2. Botón "Atención" o "Humano" (Menú de espera)
                    elif "Atención" in btn_text or "Humano" in btn_text:
                        send_whatsapp_template(phone_number, TEMPLATE_ATENCION)

                    # 3. Botón "Hacer Pedido" (Instrucciones Web)
                    elif "Pedido" in btn_text: 
                        send_whatsapp_template(phone_number, TEMPLATE_PEDIDO)

                    # 4. Botón "Pregunta" (Info general)
                    elif "pregunta" in btn_text:
                        send_whatsapp_template(phone_number, TEMPLATE_PREGUNTA)

                    # 5. Botón "Volver al inicio"
                    elif "Volver" in btn_text:
                        send_whatsapp_template(phone_number, TEMPLATE_BIENVENIDA, user_name)

    except Exception as e:
        print(f"Error en el webhook: {e}")
        return "Error", 500

    return "EVENT_RECEIVED", 200

# Para correr en local
if __name__ == '__main__':
    app.run(debug=True)