import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGlobalSettings } from '$lib/settings.server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { base64Image } = await request.json();
    if (!base64Image) return json({ error: 'No image data received' }, { status: 400 });

    const settings = await getGlobalSettings();
    const { accessToken, phoneNumberId } = settings.whatsapp;

    if (!accessToken || !phoneNumberId) {
      return json({ error: 'Faltan credenciales (Token o ID)' }, { status: 500 });
    }

    console.log('[WhatsApp Profile] Iniciando proceso de actualización...');

    // 1. Preparar el Buffer (Limpieza estricta del Base64)
    // Buscamos cualquier prefijo data:image... y lo quitamos
    const base64Clean = base64Image.split(',')[1] || base64Image;
    const buffer = Buffer.from(base64Clean, 'base64');
    const fileLength = buffer.byteLength;
    const fileType = 'image/jpeg';

    console.log(`[WhatsApp Profile] Imagen procesada: ${fileLength} bytes`);

    // 2. Obtener APP ID (Requisito para uploads)
    const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    const debugRes = await fetch(debugUrl);
    const debugData = await debugRes.json();
    
    if (!debugData.data?.app_id) {
      console.error('[WhatsApp Profile] Error debug_token:', debugData);
      throw new Error('No se pudo obtener el APP ID del token.');
    }
    const appId = debugData.data.app_id;
    console.log(`[WhatsApp Profile] App ID detectado: ${appId}`);

    // 3. Crear Sesión de Carga (Resumable Upload Session)
    const sessionUrl = `https://graph.facebook.com/v21.0/${appId}/uploads?file_length=${fileLength}&file_type=${fileType}`;
    const sessionRes = await fetch(sessionUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const sessionData = await sessionRes.json();
    
    if (!sessionData.id) {
      console.error('[WhatsApp Profile] Error creando sesión:', sessionData);
      throw new Error('Fallo al iniciar sesión de carga en Meta.');
    }
    const uploadSessionId = sessionData.id;
    console.log(`[WhatsApp Profile] Sesión creada: ${uploadSessionId}`);

    // 4. Subir los Bytes (Paso Crítico)
    // NOTA: Usamos 'OAuth' en el header Authorization y file_offset exacto
    const uploadUrl = `https://graph.facebook.com/v21.0/${uploadSessionId}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `OAuth ${accessToken}`, // OAuth suele ser más estable para uploads que Bearer
        'file_offset': '0',
        'Content-Type': 'application/octet-stream' // Importante para evitar corrupción
      },
      body: buffer
    });
    const uploadData = await uploadRes.json();
    
    // El handle suele venir en 'h'
    const profileHandle = uploadData.h; 
    
    if (!profileHandle) {
      console.error('[WhatsApp Profile] Error subiendo bytes:', uploadData);
      throw new Error('La imagen se subió pero no devolvió un handle válido.');
    }
    console.log(`[WhatsApp Profile] Imagen subida OK. Handle: ${profileHandle}`);

    // 5. Aplicar Foto de Perfil
    const profileUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/whatsapp_business_profile`;
    const finalRes = await fetch(profileUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        profile_picture_handle: profileHandle
      })
    });

    const finalData = await finalRes.json();

    if (!finalRes.ok) {
      console.error('[WhatsApp Profile] Error final:', finalData);
      // Si el error persiste, devolvemos el mensaje exacto de Meta
      throw new Error(finalData.error?.message || 'Error desconocido al aplicar el perfil');
    }

    console.log('[WhatsApp Profile] ¡Éxito!');
    return json({ success: true });

  } catch (error: any) {
    console.error('❌ [WhatsApp Profile] Exception:', error.message);
    return json({ error: error.message }, { status: 500 });
  }
};