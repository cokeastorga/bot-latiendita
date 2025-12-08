<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/firebase';
  import { doc, getDoc, setDoc } from 'firebase/firestore';
  import { defaultSettings, type Settings } from '$lib/settings';

  let settings: Settings = structuredClone(defaultSettings);
  let loading = true;
  let saving = false;
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

  // Helper para iterar sobre los nodos en orden
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
                    {#each node.options as opt, i}
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
                            <select 
                              bind:value={opt.target}
                              class="flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-[10px] outline-none"
                            >
                              <option value="node_1">Opción 1</option>
                              <option value="node_2">Opción 2</option>
                              <option value="node_3">Opción 3</option>
                            </select>
                          </div>
                        {:else if opt.action === 'link'}
                          <input 
                            bind:value={opt.target} 
                            placeholder="https://..." 
                            class="w-full rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-mono text-indigo-600 outline-none"
                          />
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
              <input id="phoneNumberId" bind:value={settings.whatsapp.phoneNumberId} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500" placeholder="Ej: 100561234567890" />
              <p class="text-[9px] text-slate-400">ID único de la API de WhatsApp Cloud.</p>
            </div>

            <div class="space-y-1">
              <label for="accessToken" class="text-[11px] font-medium text-slate-700">Access Token (Permanente)</label>
              <input id="accessToken" type="password" bind:value={settings.whatsapp.accessToken} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500" />
            </div>

            <div class="space-y-1">
              <label for="verifyToken" class="text-[11px] font-medium text-slate-700">Verify Token</label>
              <input id="verifyToken"  type="password" bind:value={settings.whatsapp.verifyToken} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div class="space-y-4">
            <h2 class="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">Teléfonos y Alertas</h2>
            
            <div class="space-y-1">
              <label for="chatbotNumber" class="text-[11px] font-medium text-indigo-700">Número del Chatbot (Público)</label>
              <input 
                id="chatbotNumber" 
                bind:value={settings.whatsapp.chatbotNumber} 
                class="w-full rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500" 
                placeholder="56912345678" 
              />
              <p class="text-[9px] text-slate-400">Este es el número que ven tus clientes. Se usará para generar enlaces.</p>
            </div>

            <div class="my-2 border-t border-slate-100"></div>

            <div class="space-y-1">
              <label for="notificationPhones" class="text-[11px] font-medium text-slate-700">Teléfonos Administrativos (Reciben Alertas)</label>
              <textarea 
                id="notificationPhones" 
                rows="4" 
                bind:value={settings.whatsapp.notificationPhones} 
                placeholder="56911111111, 56922222222" 
                class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 font-mono"
              ></textarea>
              <p class="text-[9px] text-slate-400">
                Escribe los números (separados por coma) del staff que recibirá avisos de <b>pedidos confirmados</b> y <b>solicitudes de humano</b>.
              </p>
            </div>
          </div>
        </div>
      {/if}
      {/if}
  </div>
</div>