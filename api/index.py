from flask import Flask, request, jsonify, url_for
import requests
import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

app = Flask(__name__)

# ==============================================================================
# 🔥 INICIALIZACIÓN FIREBASE (CORREGIDA PARA VERCEL)
# ==============================================================================
if not firebase_admin._apps:
    # Intentamos cargar la credencial JSON desde la variable de entorno
    firebase_creds = os.environ.get('FIREBASE_CREDENTIALS')
    
    if firebase_creds:
        # ✅ MODO PRODUCCIÓN (VERCEL)
        try:
            # Si viene como string JSON, lo parseamos
            cred_dict = json.loads(firebase_creds)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase inicializado con FIREBASE_CREDENTIALS")
        except Exception as e:
            print(f"❌ Error cargando FIREBASE_CREDENTIALS: {e}")
            # Fallback por si el JSON está mal
            try:
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred)
            except:
                pass
    else:
        # ⚠️ MODO LOCAL / GOOGLE CLOUD (Fallback)
        print("⚠️ No se encontró FIREBASE_CREDENTIALS, intentando ApplicationDefault...")
        try:
            cred = credentials.ApplicationDefault()
            project_id = os.environ.get("FIREBASE_PROJECT_ID")
            if project_id:
                firebase_admin.initialize_app(cred, {'projectId': project_id})
            else:
                firebase_admin.initialize_app(cred)
        except Exception as e:
            print(f"❌ Error inicializando Firebase: {e}")

# Instancia de la base de datos
db = firestore.client()

# ==============================================================================
# ⚙️ VARIABLES DE ENTORNO
# ==============================================================================
VERIFY_TOKEN = os.environ.get("VERIFY_TOKEN")
WHATSAPP_TOKEN = os.environ.get("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.environ.get("PHONE_NUMBER_ID")
NUMERO_HUMANO = os.environ.get("NUMERO_HUMANO")

# Plantillas
TEMPLATE_BIENVENIDA = "delicias_bienvenida_menu"
TEMPLATE_PEDIDO = "respond_pedido"
TEMPLATE_PREGUNTA = "respond_question"
TEMPLATE_ATENCION = "responde_atencion_cliente"

# ==============================================================================
# 💾 LOG DE CONVERSACIÓN (FIRESTORE)
# ==============================================================================
def log_conversation(phone_number, direction, text, type="text"):
    try:
        if not db:
            print("⚠️ DB no inicializada, saltando log.")
            return

        conv_id = f"wa:{phone_number}"
        conv_ref = db.collection('conversations').document(conv_id)
        
        # 1. Crear doc si no existe
        if not conv_ref.get().exists:
            conv_ref.set({
                'channel': 'whatsapp',
                'userId': phone_number,
                'status': 'open',
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })

        # 2. Guardar mensaje
        conv_ref.collection('messages').add({
            'from': 'user' if direction == 'inbound' else 'bot',
            'direction': 'in' if direction == 'inbound' else 'out',
            'text': text,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'type': type
        })

        # 3. Update timestamps
        conv_ref.update({
            'lastMessageText': text,
            'lastMessageAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        print(f"✅ Log guardado: {text[:20]}...")
    except Exception as e:
        print(f"❌ Error guardando en Firestore: {e}")

# ==============================================================================
# 🛠️ ENVÍO WHATSAPP
# ==============================================================================
def send_whatsapp_template(phone_number, template_name, user_name=None):
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
            "language": {"code": "es_CL"}
        }
    }

    # Inyección de imagen para bienvenida
    if template_name == TEMPLATE_BIENVENIDA:
        try:
            image_url = url_for('static', filename='logo.png', _external=True, _scheme='https')
        except:
            image_url = "https://images.unsplash.com/photo-1555507036-ab1f4038808a"

        data["template"]["components"] = [{
            "type": "header",
            "parameters": [{"type": "image", "image": {"link": image_url}}]
        }]

    # Logueamos la salida ANTES de enviar (optimistic)
    log_conversation(phone_number, 'outbound', f"[Plantilla: {template_name}]", "template")

    try:
        requests.post(url, json=data, headers=headers)
    except Exception as e:
        print(f"❌ Error request Meta: {e}")

def send_whatsapp_text(phone_number, text):
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
# 🌐 RUTAS FLASK
# ==============================================================================

@app.route('/', methods=['GET'])
def home():
    return "🤖 Bot Online", 200

# IMPORTANTE: Misma ruta para GET (verify) y POST (webhook)
@app.route('/api/webhook', methods=['GET'])
def verify_webhook():
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')

    if mode and token:
        if mode == 'subscribe' and token == VERIFY_TOKEN:
            return challenge, 200
        else:
            return 'Forbidden', 403
    return 'Webhook Verificado OK', 200

@app.route('/api/webhook', methods=['POST'])
def webhook():
    body = request.json
    try:
        if body.get("object") == "whatsapp_business_account":
            entry = body["entry"][0]
            changes = entry["changes"][0]
            value = changes["value"]
            
            if "messages" in value:
                message = value["messages"][0]
                phone_number = message["from"]
                msg_type = message["type"]
                
                try:
                    user_name = value["contacts"][0]["profile"]["name"]
                except:
                    user_name = "Cliente"

                # 1. TEXTO
                if msg_type == "text":
                    text_body = message["text"]["body"].lower()
                    log_conversation(phone_number, 'inbound', text_body)
                    
                    if "pedido web" in text_body or "quiero confirmar" in text_body:
                        msg = f"¡Hola {user_name}! 👋\n✅ Recibimos tu pedido Web. Un humano te contactará pronto."
                        send_whatsapp_text(phone_number, msg)
                    elif any(p in text_body for p in ["hola", "buen", "inicio", "menu"]):
                        send_whatsapp_template(phone_number, TEMPLATE_BIENVENIDA, user_name)
                
                # 2. BOTONES
                elif msg_type in ["interactive", "button"]:
                    btn_text = ""
                    if msg_type == "interactive":
                        btn_text = message["interactive"]["button_reply"]["title"]
                    elif msg_type == "button":
                        btn_text = message["button"]["text"]
                    
                    if btn_text:
                        log_conversation(phone_number, 'inbound', f"[Botón: {btn_text}]", "button")
                        
                        if "Hablar" in btn_text:
                            send_whatsapp_text(phone_number, f"https://wa.me/{NUMERO_HUMANO}")
                        elif "Atención" in btn_text or "Humano" in btn_text:
                            send_whatsapp_template(phone_number, TEMPLATE_ATENCION)
                        elif "Pedido" in btn_text: 
                            send_whatsapp_template(phone_number, TEMPLATE_PEDIDO)
                        elif "pregunta" in btn_text:
                            send_whatsapp_template(phone_number, TEMPLATE_PREGUNTA)
                        elif "Volver" in btn_text:
                            send_whatsapp_template(phone_number, TEMPLATE_BIENVENIDA, user_name)

    except Exception as e:
        print(f"❌ Error webhook: {e}")
        return "Error", 500

    return "EVENT_RECEIVED", 200

# 🧪 SANDBOX ENDPOINT
@app.route('/api/sandbox', methods=['POST'])
def sandbox_chat():
    data = request.json
    text = data.get('text', '').lower()
    user_id = data.get('conversationId', 'sandbox-user')
    
    log_conversation(user_id, 'inbound', text)
    
    reply = "Mensaje recibido (Sandbox)"
    intent = "unknown"

    if "pedido web" in text:
        intent = "order_web"
        reply = "¡Hola! 👋\n✅ Hemos recibido tu pedido Web (Simulación)."
    elif any(p in text for p in ["hola", "menu"]):
        intent = "greeting"
        reply = "[Se envía Plantilla de Bienvenida]"
    else:
        intent = "fallback"
        reply = "⚠️ No entendí (Sandbox)."

    log_conversation(user_id, 'outbound', reply)
    
    return jsonify({"reply": reply, "intent": {"id": intent}, "nextState": "idle"})

if __name__ == '__main__':
    app.run(debug=True)