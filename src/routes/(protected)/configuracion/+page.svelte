<script lang="ts">
  import { onMount } from 'svelte';
  import { db } from '$lib/firebase';
  import { doc, getDoc, setDoc } from 'firebase/firestore';
  import {
    defaultSettings,
    type Settings
  } from '$lib/settings';

  // ✅ inicializamos settings para evitar undefined
  let settings: Settings = structuredClone(defaultSettings);
  let loading = true;
  let saving = false;
  let error: string | null = null;
  let success = false;

  // Agregamos 'menu' a los tabs
  type TabId = 'general' | 'whatsapp' | 'hours' | 'messages' | 'advanced' | 'menu';
  let activeTab: TabId = 'general';

  const docRef = doc(db, 'settings', 'global');

  onMount(async () => {
    loading = true;
    error = null;
    success = false;

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
          flow: { ...defaultSettings.flow, ...(data.flow ?? {}) }
        };
      } else {
        settings = structuredClone(defaultSettings);
        await setDoc(docRef, settings);
      }
    } catch (e: unknown) {
      console.error(e);
      error = e instanceof Error ? e.message : 'Error al cargar la configuración.';
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
      console.error(e);
      error = e instanceof Error ? e.message : 'Error al guardar la configuración.';
    } finally {
      saving = false;
      setTimeout(() => { success = false; }, 2500);
    }
  }

  const tabs: { id: TabId; label: string; desc: string }[] = [
    { id: 'general', label: 'General', desc: 'Nombre y canal por defecto.' },
    { id: 'menu', label: 'Menú Bienvenida', desc: 'Configura las 3 opciones principales.' }, // Nuevo tab
    { id: 'whatsapp', label: 'WhatsApp', desc: 'Tokens y números conectados.' },
    { id: 'hours', label: 'Horarios', desc: 'Configuración de horarios de atención.' },
    { id: 'messages', label: 'Mensajes', desc: 'Textos base del bot.' },
    { id: 'advanced', label: 'Avanzado', desc: 'Webhooks y notificaciones técnicas.' }
  ];
</script>

<svelte:head>
  <title>Configuración • CC Solution</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 class="text-lg font-semibold text-slate-900">Configuración del Bot</h1>
      <p class="text-xs text-slate-500">
        Administra los ajustes globales: tokens, horarios, mensajes y opciones de pedidos.
      </p>
    </div>

    <div class="flex items-center gap-2">
      {#if success}
        <span class="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
          ✅ Cambios guardados
        </span>
      {/if}
      {#if error}
        <span class="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-700">
          ⚠️ {error}
        </span>
      {/if}
      <button
        on:click={saveSettings}
        disabled={saving || loading}
        class="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-slate-50
               shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {#if saving}
          <span class="animate-pulse">Guardando…</span>
        {:else}
          <span>Guardar cambios</span>
        {/if}
      </button>
    </div>
  </div>

  <div class="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1 text-[11px]">
    {#each tabs as tab}
      <button
        type="button"
        on:click={() => (activeTab = tab.id)}
        class={`min-w-[120px] flex-1 rounded-xl px-3 py-2 text-left transition whitespace-nowrap
          ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white/60'}`}
      >
        <div class="font-medium">{tab.label}</div>
        <div class="text-[10px] text-slate-400 truncate">{tab.desc}</div>
      </button>
    {/each}
  </div>

  <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {#if loading}
      <div class="p-6 text-xs text-slate-500">Cargando configuración…</div>
    {:else}
    
      {#if activeTab === 'general'}
        <div class="grid gap-6 p-6 md:grid-cols-2">
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Datos generales</h2>
            <div class="space-y-1">
              <label for="businessName" class="text-[11px] font-medium text-slate-700">Nombre del negocio</label>
              <input id="businessName" bind:value={settings.businessName} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
            <div class="space-y-1">
              <label for="defaultChannel" class="text-[11px] font-medium text-slate-700">Canal por defecto</label>
              <select id="defaultChannel" bind:value={settings.defaultChannel} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60">
                <option value="whatsapp">WhatsApp</option>
                <option value="web">Webchat</option>
              </select>
            </div>
          </div>
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Pedidos</h2>
            <div class="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <div>
                <div class="text-[11px] font-medium text-slate-800">Permitir pedidos por bot</div>
              </div>
              <input type="checkbox" bind:checked={settings.orders.allowOrders} class="h-4 w-7 cursor-pointer rounded-full border border-slate-300 bg-white accent-indigo-600" />
            </div>
            <div class="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <div>
                <div class="text-[11px] font-medium text-slate-800">Requerir confirmación manual</div>
              </div>
              <input type="checkbox" bind:checked={settings.orders.requireConfirmation} class="h-4 w-7 cursor-pointer rounded-full border border-slate-300 bg-white accent-indigo-600" />
            </div>
            <div class="space-y-1">
              <label for="ordersNotifyEmail" class="text-[11px] font-medium text-slate-700">Correo notificaciones</label>
              <input id="ordersNotifyEmail" type="email" bind:value={settings.orders.notifyEmail} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'menu'}
        <div class="p-6 space-y-6">
          <div class="max-w-2xl">
            <h2 class="text-sm font-semibold text-slate-900 mb-1">Encabezado de Bienvenida</h2>
            <p class="text-xs text-slate-500 mb-3">Este es el primer mensaje que verá el usuario.</p>
            <textarea
              bind:value={settings.flow.welcomeMenu.headerText}
              rows="2"
              class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800
                     outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60"
            ></textarea>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            {#each settings.flow.welcomeMenu.options as option, i}
              <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider">Opción {i + 1}</span>
                  {#if option.triggerIntent}
                    <span class="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Automático: {option.triggerIntent}
                    </span>
                  {/if}
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-medium text-slate-500">Etiqueta del botón</label>
                  <input
                    bind:value={option.label}
                    class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                    placeholder="Ej: Ver Menú"
                  />
                </div>

                <div class="space-y-1">
                  <label class="text-[10px] font-medium text-slate-500">Respuesta del Bot</label>
                  <textarea
                    bind:value={option.replyText}
                    rows="4"
                    class="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                    placeholder={option.triggerIntent ? "Se usará la lógica automática..." : "Escribe la respuesta aquí..."}
                    disabled={!!option.triggerIntent} 
                  ></textarea>
                  {#if option.triggerIntent}
                    <p class="text-[9px] text-slate-400">Usa lógica interna ({option.triggerIntent}). El texto es dinámico.</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if activeTab === 'whatsapp'}
        <div class="grid gap-6 p-6 md:grid-cols-2">
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Credenciales de WhatsApp</h2>
            <div class="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <div class="text-[11px] font-medium text-slate-800">Habilitar WhatsApp</div>
              <input type="checkbox" bind:checked={settings.whatsapp.enabled} class="h-4 w-7 cursor-pointer rounded-full border border-slate-300 bg-white accent-indigo-600" />
            </div>
            <div class="space-y-1">
              <label for="phoneNumberId" class="text-[11px] font-medium text-slate-700">Phone Number ID</label>
              <input id="phoneNumberId" bind:value={settings.whatsapp.phoneNumberId} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
            <div class="space-y-1">
              <label for="accessToken" class="text-[11px] font-medium text-slate-700">Access Token</label>
              <input id="accessToken" type="password" bind:value={settings.whatsapp.accessToken} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
            <div class="space-y-1">
              <label for="verifyToken" class="text-[11px] font-medium text-slate-700">Verify Token</label>
              <input id="verifyToken" bind:value={settings.whatsapp.verifyToken} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
          </div>
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Notificaciones</h2>
            <div class="space-y-1">
              <label for="notificationPhones" class="text-[11px] font-medium text-slate-700">Números para notificaciones</label>
              <textarea id="notificationPhones" rows="4" bind:value={settings.whatsapp.notificationPhones} placeholder="+56912345678, +56987654321" class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60"></textarea>
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
              <input id="timezone" bind:value={settings.hours.timezone} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
            <div class="space-y-1">
              <label for="weekdays" class="text-[11px] font-medium text-slate-700">Lunes a viernes</label>
              <input id="weekdays" bind:value={settings.hours.weekdays} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
          </div>
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Fin de semana</h2>
            <div class="space-y-1">
              <label for="saturday" class="text-[11px] font-medium text-slate-700">Sábado</label>
              <input id="saturday" bind:value={settings.hours.saturday} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
            <div class="space-y-1">
              <label for="sunday" class="text-[11px] font-medium text-slate-700">Domingo / festivos</label>
              <textarea id="sunday" rows="3" bind:value={settings.hours.sunday} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60"></textarea>
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
              <textarea id="welcomeMessage" rows="4" bind:value={settings.messages.welcome} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60"></textarea>
            </div>
            <div class="space-y-1">
              <label for="inactivityMessage" class="text-[11px] font-medium text-slate-700">Inactividad</label>
              <textarea id="inactivityMessage" rows="3" bind:value={settings.messages.inactivity} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60"></textarea>
            </div>
          </div>
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Handoff y cierre</h2>
            <div class="space-y-1">
              <label for="handoffMessage" class="text-[11px] font-medium text-slate-700">Derivación a humano</label>
              <textarea id="handoffMessage" rows="3" bind:value={settings.messages.handoff} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60"></textarea>
            </div>
            <div class="space-y-1">
              <label for="closingMessage" class="text-[11px] font-medium text-slate-700">Cierre</label>
              <textarea id="closingMessage" rows="3" bind:value={settings.messages.closing} class="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60"></textarea>
            </div>
          </div>
        </div>
      {/if}

      {#if activeTab === 'advanced'}
        <div class="grid gap-6 p-6 md:grid-cols-2">
          <div class="space-y-3">
            <h2 class="text-sm font-semibold text-slate-900">Webhooks</h2>
            <div class="space-y-1">
              <label for="publicBaseUrl" class="text-[11px] font-medium text-slate-700">URL pública base</label>
              <input id="publicBaseUrl" bind:value={settings.api.publicBaseUrl} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
            <div class="space-y-1">
              <label for="webhookSecret" class="text-[11px] font-medium text-slate-700">Webhook Secret</label>
              <input id="webhookSecret" type="password" bind:value={settings.api.webhookSecret} class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/60" />
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>