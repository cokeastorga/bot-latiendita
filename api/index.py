from flask import Flask, request, jsonify, url_for
import requests
import os
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

app = Flask(__name__)

# ==============================================================================
# 🔥 INICIALIZACIÓN FIREBASE (Para que el Dashboard vea los datos)
# ==============================================================================
# En Vercel, pasaremos las credenciales como variables de entorno o archivo json
# Si estás en local, asegúrate de tener tu serviceAccountKey.json
if not firebase_admin._apps:
    # Opción A: Usando diccionario desde variable de entorno (Recomendado para Vercel)
    # cred = credentials.Certificate(json.loads(os.environ.get('FIREBASE_CREDENTIALS')))
    
    # Opción B: Inicialización por defecto (si Vercel tiene configurado Google Cloud)
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {'projectId': os.environ.get("FIREBASE_PROJECT_ID")})

db = firestore.client()

# ==============================================================================
# ⚙️ CONFIGURACIÓN SEGURA (Variables de Entorno)
# ==============================================================================

# Leemos las claves desde el servidor (Vercel) o archivo .env
VERIFY_TOKEN = os.environ.get("VERIFY_TOKEN")
WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.environ.get("PHONE_NUMBER_ID")
NUMERO_HUMANO = os.environ.get("NUMERO_HUMANO")

# Nombres de tus plantillas (Tal cual salen en tu administrador de Meta)
TEMPLATE_BIENVENIDA = "delicias_bienvenida_menu"
TEMPLATE_PEDIDO = "respond_pedido"
TEMPLATE_PREGUNTA = "respond_question"
TEMPLATE_ATENCION = "responde_atencion_cliente"


def log_conversation(phone_number, direction, text, type="text"):
    """
    Guarda el mensaje en Firestore para que el Dashboard Svelte lo vea.
    Estructura compatible con: src/lib/chatbot/store.ts
    """
    try:
        conv_id = f"wa:{phone_number}"
        conv_ref = db.collection('conversations').document(conv_id)
        
        # 1. Crear documento de conversación si no existe
        if not conv_ref.get().exists:
            conv_ref.set({
                'channel': 'whatsapp',
                'userId': phone_number,
                'status': 'open',
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })

        # 2. Agregar mensaje a la subcolección
        conv_ref.collection('messages').add({
            'from': 'user' if direction == 'inbound' else 'bot',
            'direction': 'in' if direction == 'inbound' else 'out',
            'text': text,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'type': type
        })

        # 3. Actualizar último mensaje
        conv_ref.update({
            'lastMessageText': text,
            'lastMessageAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        print(f"✅ Log guardado en Firestore: {text}")
    except Exception as e:
        print(f"❌ Error guardando en Firestore: {e}")

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
    
    # Estructura base del mensaje
    data = {
        "messaging_product": "whatsapp",
        "to": phone_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "es_CL"} # Ajusta a 'es' o 'es_AR' si en Meta no dice 'es_CL'
        }
    }

    # 🟢 CORRECCIÓN: Inyección de IMAGEN LOCAL para la Bienvenida
    # Generamos un link público automático a tu archivo en /api/static/logo.png
    if template_name == TEMPLATE_BIENVENIDA:
        # url_for crea: https://tu-proyecto.vercel.app/static/logo.png
        # _external=True asegura que incluya el dominio completo
        # _scheme='https' fuerza a que sea seguro (requerido por Meta)
        try:
            image_url = url_for('static', filename='logo.png', _external=True, _scheme='https')
        except:
            # Fallback por si acaso falla la generación local (útil para pruebas)
            image_url = "https://images.unsplash.com/photo-1555507036-ab1f4038808a"

        data["template"]["components"] = [
            {
                "type": "header",
                "parameters": [
                    {
                        "type": "image",
                        "image": {
                            "link": image_url
                        }
                    }
                ]
            }
        ]
        print(f"🖼️ Imagen inyectada: {image_url}")

    # Debug: Imprimimos qué estamos intentando enviar
    print(f"📤 Intentando enviar plantilla '{template_name}' a {phone_number}...")
    log_conversation(phone_number, 'outbound', f"[Plantilla: {template_name}]", "template")

    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"📬 Respuesta Meta Status: {response.status_code}")
        if response.status_code != 200:
            print(f"❌ Error Meta Body: {response.text}")
    except Exception as e:
        print(f"❌ Error enviando mensaje (Excepción): {e}")

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
    
    # Debug
    print(f"📤 Intentando enviar texto a {phone_number}...")
log_conversation(phone_number, 'outbound', text, "text")

    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"📬 Respuesta Meta Status: {response.status_code}")
        if response.status_code != 200:
             print(f"❌ Error Meta Body: {response.text}")
    except Exception as e:
        print(f"❌ Error enviando texto: {e}")

# ==============================================================================
# 🧠 EL CEREBRO DEL BOT (WEBHOOK)
# ==============================================================================

@app.route('/', methods=['GET'])
def home():
    """Página de inicio para evitar errores 404 en el navegador"""
    return "🤖 El Bot de La Tiendita está ACTIVO y funcionando. Ve a WhatsApp.", 200

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

@app.route('/api/webhook', methods=['POST'])
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

                print(f"📥 Mensaje recibido de {user_name} ({phone_number}): Tipo {msg_type}")

                # ------------------------------------------------------
                # CASO 1: El usuario escribió Texto
                # ------------------------------------------------------
                if msg_type == "text":
                    text_body = message["text"]["body"].lower()
                    log_conversation(phone_number, 'inbound', text_body)
                    print(f"📝 Texto recibido: {text_body}")
                    
                    # 🟢 DETECCIÓN DE PEDIDO WEB 🟢
                    if "pedido web" in text_body or "quiero confirmar" in text_body:
                        msg_confirmacion = (
                            f"¡Hola {user_name}! 👋\n"
                            f"✅ Hemos recibido el detalle de tu pedido Web.\n\n"
                            f"Un humano 🙋‍♂️ revisará el stock y te escribirá en breve para coordinar el pago y la entrega.\n"
                            f"¡Gracias por elegir Delicias Porteñas!"
                        )
                        send_whatsapp_text(phone_number, msg_confirmacion)
                        
                    # 🟢 LÓGICA ESTÁNDAR (Saludos, Menú) 🟢
                    else:
                        palabras_clave = ["hola", "buen", "inicio", "menu", "menú", "volver", "alo", "buenas"]
                        if any(p in text_body for p in palabras_clave):
                            print("✅ Palabra clave detectada. Enviando bienvenida...")
                            send_whatsapp_template(phone_number, TEMPLATE_BIENVENIDA, user_name)
                        else:
                            print("⚠️ Mensaje de texto sin palabra clave conocida. Ignorando.")

                # ------------------------------------------------------
                # CASO 2: El usuario presionó un BOTÓN (Cualquier tipo)
                # ------------------------------------------------------
                else:
                    btn_text = None
                    
                    # Tipo 1: Interactive (Botones de lista o respuestas rápidas estándar)
                    if msg_type == "interactive":
                        btn_text = message["interactive"]["button_reply"]["title"]
                    
                    # Tipo 2: Button (Botones dentro de Plantillas/Templates)
                    elif msg_type == "button":
                        btn_text = message["button"]["text"]

                    if btn_text:
                        print(f"🔘 Botón presionado: {btn_text}")
                        
                        if "Hablar" in btn_text:
                            msg = f"🤝 Para hablar directamente con nosotros, haz clic aquí: https://wa.me/{NUMERO_HUMANO}"
                            send_whatsapp_text(phone_number, msg)
                        
                        elif "Atención" in btn_text or "Humano" in btn_text:
                            send_whatsapp_template(phone_number, TEMPLATE_ATENCION)

                        elif "Pedido" in btn_text: 
                            send_whatsapp_template(phone_number, TEMPLATE_PEDIDO)

                        elif "pregunta" in btn_text:
                            send_whatsapp_template(phone_number, TEMPLATE_PREGUNTA)

                        elif "Volver" in btn_text:
                            send_whatsapp_template(phone_number, TEMPLATE_BIENVENIDA, user_name)
                        else:
                            print(f"⚠️ Botón desconocido: {btn_text}")
                    else:
                         print(f"⚠️ Tipo de mensaje no manejado: {msg_type}")

    except Exception as e:
        print(f"❌ Error CRÍTICO en el webhook: {e}")
        return "Error", 500

    return "EVENT_RECEIVED", 200

# Para correr en local
if __name__ == '__main__':
    app.run(debug=True)