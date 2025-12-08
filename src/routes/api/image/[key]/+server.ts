// src/routes/api/image/[key]/+server.ts
import { getGlobalSettings } from '$lib/settings.server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
  const key = params.key; // ej: 'welcome'
  
  try {
    const settings = await getGlobalSettings();
    // @ts-ignore - Acceso dinámico al nodo
    const node = settings.flow?.nodes?.[key];

    if (!node || !node.mediaBase64) {
      return new Response('Imagen no encontrada', { status: 404 });
    }

    // El formato base64 suele ser: "data:image/jpeg;base64,/9j/4AAQSk..."
    // Necesitamos quitar el encabezado para obtener solo los datos binarios
    const base64Data = node.mediaBase64.split(',')[1];
    if (!base64Data) {
      return new Response('Formato de imagen inválido', { status: 500 });
    }

    const imgBuffer = Buffer.from(base64Data, 'base64');

    return new Response(imgBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600' // Cachear por 1 hora para rapidez
      }
    });

  } catch (err) {
    console.error('Error sirviendo imagen:', err);
    return new Response('Error interno', { status: 500 });
  }
};