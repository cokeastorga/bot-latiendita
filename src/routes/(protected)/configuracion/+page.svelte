<script lang="ts">
  import { onMount } from 'svelte';
  import { db, storage } from '$lib/firebase';
  import { doc, getDoc, setDoc } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { defaultSettings, type Settings } from '$lib/settings';

  let settings: Settings = structuredClone(defaultSettings);
  let loading = true;
  let saving = false;
  let uploadingImage = false;
  let error: string | null = null;
  let success = false;

  type TabId = 'general' | 'whatsapp' | 'hours' | 'messages' | 'menu';
  let activeTab: TabId = 'general';

  const docRef = doc(db, 'settings', 'global');

  onMount(async () => {
    loading = true;
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Partial<Settings>;
        settings = {
          ...defaultSettings,
          ...data,
          whatsapp: { ...defaultSettings.whatsapp, ...(data.whatsapp ?? {}) },
          hours: { ...defaultSettings.hours, ...(data.hours ?? {}) },
          messages: { ...defaultSettings.messages, ...(data.messages ?? {}) },
          orders: { ...defaultSettings.orders, ...(data.orders ?? {}) },
          api: { ...defaultSettings.api, ...(data.api ?? {}) },
          flow: { 
            active: data.flow?.active ?? true,
            nodes: {
              welcome: { ...defaultSettings.flow.nodes.welcome, ...(data.flow?.nodes?.welcome ?? {}) },
              node_1: { ...defaultSettings.flow.nodes.node_1, ...(data.flow?.nodes?.node_1 ?? {}) },
              node_2: { ...defaultSettings.flow.nodes.node_2, ...(data.flow?.nodes?.node_2 ?? {}) },
              node_3: { ...defaultSettings.flow.nodes.node_3, ...(data.flow?.nodes?.node_3 ?? {}) },
            }
          }
        };
      } else {
        await setDoc(docRef, settings);
      }
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Error al cargar.';
    } finally {
      loading = false;
    }
  });

  async function saveSettings() {
    saving = true;
    error = null;
    success = false;
    try {
      await setDoc(docRef, settings, { merge: true });
      success = true;
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Error al guardar.';
    } finally {
      saving = false;
      setTimeout(() => { success = false; }, 2500);
    }
  }

  async function handleImageUpload(e: Event, nodeId: string) {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    uploadingImage = true;

    try {
      const resizedBlob = await resizeImage(file, 250, 250);
      const storageRef = ref(storage, `bot_assets/${nodeId}_image_${Date.now()}.jpg`);
      await uploadBytes(storageRef, resizedBlob);
      const url = await getDownloadURL(storageRef);

      // @ts-ignore
      if(settings.flow.nodes[nodeId]) {
         // @ts-ignore
         settings.flow.nodes[nodeId].mediaUrl = url;
      }
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      alert('Error al procesar la imagen');
    } finally {
      uploadingImage = false;
    }
  }

  function resizeImage(file: File, width: number, height: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject('Canvas blob error');
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  const nodeKeys = ['welcome', 'node_1', 'node_2', 'node_3'] as const;
  const nodeLabels: Record<string, string> = {
    welcome: '🏠 Mensaje de Bienvenida',
    node_1: '1️⃣ Plantilla Opción 1',
    node_2: '2️⃣ Plantilla Opción 2',
    node_3: '3️⃣ Plantilla Opción 3'
  };

  const tabs: { id: TabId; label: string; desc: string }[] = [
    { id: 'general', label: 'General', desc: 'Nombre y canal.' },
    { id: 'menu', label: 'Flujo de Menú', desc: 'Configura la navegación.' },
    { id: 'whatsapp', label: 'WhatsApp', desc: 'Credenciales API.' },
    { id: 'hours', label: 'Horarios', desc: 'Atención.' },
    { id: 'messages', label: 'Mensajes', desc: 'Textos base.' }
  ];
</script>

<svelte:head>
  <title>Configuración • CC Solution</title>
</svelte:head>

<div class="flex flex-col gap-4 pb-10">
  <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 class="text-lg font-semibold text-slate-900">Configuración</h1>
      <p class="text-xs text-slate-500">Administra el comportamiento del bot.</p>
    </div>
    <div class="flex items-center gap-2">
      {#if success}
        <span class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">✅ Guardado</span>
      {/if}
      <button on:click={saveSettings} disabled={saving || loading} class="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow hover:bg-slate-800 disabled:opacity-60">
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  </div>

  <div class="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1">
    {#each tabs as tab}
      <button on:click={() => (activeTab = tab.id)} class={`min-w-[120px] flex-1 rounded-xl px-3 py-2 text-left transition whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/60'}`}>
        <div class="font-medium text-xs">{tab.label}</div>
        <div class="text-[10px] text-slate-400 truncate">{tab.desc}</div>
      </button>
    {/each}
  </div>

  <div class="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    {#if loading}
      <div class="p-6 text-xs text-slate-500">Cargando...</div>
    {:else}
      {#if activeTab === 'menu'}
        <div class="p-6 space-y-8 bg-slate-50/30">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Editor de Flujo</h2>
              <p class="text-xs text-slate-500">Define qué responde el bot en cada paso del menú.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-medium text-slate-600">Activar menú</span>
              <input type="checkbox" bind:checked={settings.flow.active} class="h-4 w-7 cursor-pointer rounded-full border border-slate-300 bg-white accent-indigo-600" />
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            {#each nodeKeys as key}
              {@const node = settings.flow.nodes[key]}
              <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div class="border-b border-slate-100 bg-slate-50 px-4 py-2 flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">{nodeLabels[key]}</span>
                  <span class="text-[9px] font-mono text-slate-400">ID: {key}</span>
                </div>
                
                <div class="p-4 space-y-4">
                  {#if key === 'welcome'}
                    <div class="space-y-2 pb-2 border-b border-slate-100">
                      <span class="text-[10px] font-medium text-slate-500">Imagen de Cabecera (Se redimensiona a 250x250)</span>
                      <div class="flex items-center gap-3">
                        {#if node.mediaUrl}
                          <img src={node.mediaUrl} alt="Header" class="w-12 h-12 rounded object-cover border border-slate-200" />
                        {/if}
                        <label class="cursor-pointer inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] hover:bg-slate-50 transition">
                          <input type="file" accept="image/*" class="hidden" on:change={(e) => handleImageUpload(e, key)} disabled={uploadingImage} />
                          {uploadingImage ? 'Procesando...' : (node.mediaUrl ? 'Cambiar Imagen' : 'Subir Imagen')}
                        </label>
                      </div>
                    </div>
                  {/if}

                  <div class="space-y-1">
                    <label class="text-[10px] font-medium text-slate-500">Mensaje del Bot</label>
                    <textarea 
                      bind:value={node.text} 
                      rows="3" 
                      class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition"
                    ></textarea>
                  </div>

                  <div class="space-y-2">
                    <label class="text-[10px] font-medium text-slate-500">Opciones / Botones</label>
                    {#each node.options as opt}
                      <div class="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <div class="flex gap-2">
                          <input 
                            bind:value={opt.label} 
                            placeholder="Texto Botón" 
                            class="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-indigo-500"
                          />
                          <select 
                            bind:value={opt.action} 
                            class="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-indigo-500"
                          >
                            <option value="template">Ir a Plantilla</option>
                            <option value="link">Abrir Link</option>
                            <option value="back">Volver Inicio</option>
                            <option value="none">Sin Acción (Texto)</option>
                          </select>
                        </div>

                        {#if opt.action === 'template'}
                          <div class="flex items-center gap-2 px-1">
                            <span class="text-[10px] text-slate-400">Destino:</span>
                            <select bind:value={opt.target} class="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] outline-none">
                              <option value="node_1">Opción 1</option>
                              <option value="node_2">Opción 2</option>
                              <option value="node_3">Opción 3</option>
                            </select>
                          </div>
                        {:else if opt.action === 'link'}
                          <input bind:value={opt.target} placeholder="https://..." class="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-mono text-indigo-600 outline-none" />
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if activeTab === 'general'}
        <div class="p-6">
           <h2 class="text-sm font-semibold text-slate-900 mb-4">Datos Generales</h2>
           <div class="space-y-4 max-w-md">
             <div>
               <label class="block text-xs font-medium text-slate-700 mb-1">Nombre Negocio</label>
               <input bind:value={settings.businessName} class="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs"/>
             </div>
             <div>
               <label class="block text-xs font-medium text-slate-700 mb-1">Canal Default</label>
               <select bind:value={settings.defaultChannel} class="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                 <option value="whatsapp">WhatsApp</option>
                 <option value="web">Webchat</option>
               </select>
             </div>
           </div>
        </div>
      {/if}

      {#if activeTab === 'whatsapp'}
        <div class="grid gap-6 p-6 md:grid-cols-2">
          <div class="space-y-4">
            <h2 class="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Conexión con Meta</h2>
            <div class="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
              <div class="text-[11px] font-medium text-slate-800">Habilitar Bot WhatsApp</div>
              <input type="checkbox" bind:checked={settings.whatsapp.enabled} class="h-4 w-7 cursor-pointer rounded-full border border-slate-300 bg-white accent-indigo-600" />
            </div>
            <div class="space-y-1">
              <label for="phoneNumberId" class="text-[11px] font-medium text-slate-700">Phone Number ID</label>
              <input id="phoneNumberId" bind:value={settings.whatsapp.phoneNumberId} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500" />
            </div>
            <div class="space-y-1">
              <label for="accessToken" class="text-[11px] font-medium text-slate-700">Access Token</label>
              <input id="accessToken" type="password" bind:value={settings.whatsapp.accessToken} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500" />
            </div>
            <div class="space-y-1">
              <label for="verifyToken" class="text-[11px] font-medium text-slate-700">Verify Token</label>
              <input id="verifyToken" type="password" bind:value={settings.whatsapp.verifyToken} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div class="space-y-4">
            <h2 class="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Teléfonos y Alertas</h2>
            <div class="space-y-1">
              <label for="chatbotNumber" class="text-[11px] font-medium text-indigo-700">Número del Chatbot (Público)</label>
              <input id="chatbotNumber" bind:value={settings.whatsapp.chatbotNumber} class="w-full rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500" />
            </div>
            <div class="space-y-1">
              <label for="notificationPhones" class="text-[11px] font-medium text-slate-700">Teléfonos Administrativos</label>
              <textarea id="notificationPhones" rows="4" bind:value={settings.whatsapp.notificationPhones} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 font-mono"></textarea>
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'hours'}
        <div class="grid gap-6 p-6 md:grid-cols-2">
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Días hábiles</h2>
            <div class="space-y-1">
              <label for="timezone" class="text-[11px] font-medium text-slate-700">Zona horaria</label>
              <input id="timezone" bind:value={settings.hours.timezone} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500" />
            </div>
            <div class="space-y-1">
              <label for="weekdays" class="text-[11px] font-medium text-slate-700">Lunes a viernes</label>
              <input id="weekdays" bind:value={settings.hours.weekdays} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Fin de semana</h2>
            <div class="space-y-1">
              <label for="saturday" class="text-[11px] font-medium text-slate-700">Sábado</label>
              <input id="saturday" bind:value={settings.hours.saturday} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500" />
            </div>
            <div class="space-y-1">
              <label for="sunday" class="text-[11px] font-medium text-slate-700">Domingo / festivos</label>
              <textarea id="sunday" rows="3" bind:value={settings.hours.sunday} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500"></textarea>
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'messages'}
        <div class="grid gap-6 p-6 md:grid-cols-2">
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Mensajes base</h2>
            <div class="space-y-1">
              <label for="welcomeMessage" class="text-[11px] font-medium text-slate-700">Bienvenida (Default)</label>
              <textarea id="welcomeMessage" rows="4" bind:value={settings.messages.welcome} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500"></textarea>
            </div>
            <div class="space-y-1">
              <label for="inactivityMessage" class="text-[11px] font-medium text-slate-700">Inactividad</label>
              <textarea id="inactivityMessage" rows="3" bind:value={settings.messages.inactivity} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500"></textarea>
            </div>
          </div>
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Handoff y cierre</h2>
            <div class="space-y-1">
              <label for="handoffMessage" class="text-[11px] font-medium text-slate-700">Derivación a humano</label>
              <textarea id="handoffMessage" rows="3" bind:value={settings.messages.handoff} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500"></textarea>
            </div>
            <div class="space-y-1">
              <label for="closingMessage" class="text-[11px] font-medium text-slate-700">Cierre</label>
              <textarea id="closingMessage" rows="3" bind:value={settings.messages.closing} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500"></textarea>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>