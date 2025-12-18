<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { db } from '$lib/firebase';
  import {
    collection,
    onSnapshot,
    query,
    orderBy,
    limit,
    updateDoc,
    doc,
    type QuerySnapshot,
    type DocumentData
  } from 'firebase/firestore';

  type ConversationStatus = 'open' | 'pending' | 'closed';

  type Conversation = {
    id: string;
    channel: 'whatsapp' | 'web';
    userId?: string | null;
    contactName?: string | null;     // <-- Nuevo campo
    whatsappName?: string | null;    // <-- Nuevo campo
    status: ConversationStatus;
    lastMessageAt?: Date | null;
    lastMessageText?: string;
    lastIntentId?: string | null;
    needsHuman?: boolean;
  };

  let conversations: Conversation[] = [];
  let loading = true;
  
  // Estado para el menú desplegable "Más"
  let activeMenuId: string | null = null; 

  let searchQuery = '';
  let statusFilter: 'all' | ConversationStatus = 'all';

  const statusLabel: Record<'all' | ConversationStatus, string> = {
    all: 'Todas',
    open: 'Abiertas',
    pending: 'Pendientes',
    closed: 'Cerradas'
  };

  const statusColor: Record<ConversationStatus, string> = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    closed: 'bg-slate-50 text-slate-600 border-slate-200'
  };

  const channelColor: Record<'whatsapp' | 'web', string> = {
    whatsapp: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    web: 'bg-indigo-50 text-indigo-700 border-indigo-100'
  };

  function formatDate(d?: Date | null): string {
    if (!d) return '—';
    return d.toLocaleString('es-CL', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  // Helper para mostrar el nombre correcto
  function getDisplayName(c: Conversation) {
    if (c.contactName && c.contactName !== c.userId) return c.contactName;
    return c.whatsappName || c.userId || 'Usuario desconocido';
  }

  // Función para cambiar estado desde el menú rápido
  async function quickUpdateStatus(convId: string, newStatus: ConversationStatus, needsHuman: boolean) {
    activeMenuId = null; // Cerrar menú
    try {
        await updateDoc(doc(db, 'conversations', convId), {
            status: newStatus,
            needsHuman: needsHuman
        });
        // Optimistic UI (actualización visual inmediata)
        conversations = conversations.map(c => 
            c.id === convId ? { ...c, status: newStatus, needsHuman } : c
        );
    } catch (e) {
        console.error("Error updating status:", e);
        alert("Error al actualizar estado");
    }
  }

  // Cerrar menús si se hace click fuera
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
        activeMenuId = null;
    }
  }

  $: filteredConversations = conversations.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    
    // Buscamos también en los nombres nuevos
    const name = getDisplayName(c).toLowerCase();

    const matchesSearch =
      q.length === 0 ||
      name.includes(q) ||
      (c.lastMessageText ?? '').toLowerCase().includes(q) ||
      (c.lastIntentId ?? '').toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.userId ?? '').toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  onMount(() => {
    document.addEventListener('click', handleClickOutside);

    const convRef = collection(db, 'conversations');
    const qConv = query(convRef, orderBy('lastMessageAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(qConv, (snapshot) => {
        const items: Conversation[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const meta = data.metadata || {};
          return {
            id: doc.id,
            channel: (data.channel ?? 'whatsapp') as 'whatsapp' | 'web',
            userId: data.userId ?? null,
            // Recuperamos los campos de nombre
            contactName: data.contactName ?? (meta.customerName as string) ?? null,
            whatsappName: data.whatsappName ?? null,
            
            status: (data.status ?? 'open') as ConversationStatus,
            lastMessageAt: data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : null,
            lastMessageText: data.lastMessageText ?? '',
            lastIntentId: data.lastIntentId ?? null,
            needsHuman: data.needsHuman ?? false
          };
        });
        conversations = items;
        loading = false;
      },
      (error) => {
        console.error('Error escuchando conversaciones:', error);
        loading = false;
      }
    );

    return () => {
      unsubscribe();
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="space-y-6">
  <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-wrap items-center gap-2">
      <div class="inline-flex rounded-full bg-slate-100 p-1 text-xs">
        {#each ['all', 'open', 'pending', 'closed'] as key}
          {@const k = key as 'all' | ConversationStatus}
          <button
            type="button"
            class={`px-3 py-1 rounded-full transition-all ${
              statusFilter === k
                ? 'bg-white shadow-sm text-slate-900 font-medium'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            on:click={() => (statusFilter = k)}
          >
            {statusLabel[k]}
          </button>
        {/each}
      </div>
    </div>

    <div class="flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 min-w-[200px] max-w-sm">
      <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 mr-2" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="6"></circle>
        <path d="M16 16L20 20" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Buscar cliente, mensaje o ID..."
        class="w-full bg-transparent outline-none placeholder:text-slate-300 text-[11px]"
      />
    </div>
  </section>

  <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[300px]">
    <div class="hidden md:grid grid-cols-[200px_minmax(0,1.4fr)_120px_130px_80px] gap-3 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 border-b border-slate-100 bg-slate-50/50">
      <div>Cliente / ID</div>
      <div>Último mensaje</div>
      <div>Estado</div>
      <div>Actividad</div>
      <div class="text-right">Acciones</div>
    </div>

    {#if loading}
      <div class="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
        <div class="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p class="text-xs">Cargando conversaciones...</p>
      </div>
    {:else if filteredConversations.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
        <p class="text-sm">No se encontraron conversaciones.</p>
        <button class="text-xs text-blue-500 hover:underline" on:click={() => {statusFilter='all'; searchQuery='';}}>Limpiar filtros</button>
      </div>
    {:else}
      <ul class="divide-y divide-slate-100">
        {#each filteredConversations as c (c.id)}
          <li class="px-4 py-3 md:py-2.5 hover:bg-slate-50/80 transition-colors text-sm md:text-[13px] group relative">
            <div class="hidden md:grid grid-cols-[200px_minmax(0,1.4fr)_120px_130px_80px] gap-3 items-center">
              
              <div class="flex items-center gap-3 min-w-0">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200">
                  {(getDisplayName(c)[0] || '#').toUpperCase()}
                </div>
                <div class="flex flex-col min-w-0">
                  <p class="font-bold text-slate-800 truncate text-xs leading-tight">
                    {getDisplayName(c)}
                  </p>
                  {#if getDisplayName(c) !== c.userId}
                    <p class="text-[10px] text-slate-400 truncate font-mono">{c.userId}</p>
                  {:else}
                    <p class="text-[10px] text-slate-400 truncate">ID: {c.id.slice(0,6)}...</p>
                  {/if}
                </div>
              </div>

              <div class="min-w-0 pr-4">
                <p class="text-slate-600 truncate text-xs">
                  {c.lastMessageText || 'Sin mensajes aún'}
                </p>
                {#if c.lastIntentId}
                   <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-500 mt-1">
                     {c.lastIntentId}
                   </span>
                {/if}
              </div>

              <div class="flex flex-col items-start gap-1">
                <span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColor[c.status]}`}>
                   {c.status === 'open' ? 'Activa' : c.status === 'pending' ? 'Pendiente' : 'Cerrada'}
                </span>
                {#if c.needsHuman}
                   <span class="text-[9px] text-rose-600 font-medium bg-rose-50 px-1.5 rounded-full border border-rose-100">
                     ! Humano
                   </span>
                {/if}
              </div>

              <div class="text-[11px] text-slate-400">
                {formatDate(c.lastMessageAt)}
              </div>

              <div class="flex justify-end gap-2 relative dropdown-container">
                <button
                  type="button"
                  class="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700 shadow-sm shadow-blue-100 transition-all"
                  on:click|stopPropagation={() => goto(`/conversaciones/${c.id}`)}
                >
                  Abrir
                </button>

                <button
                  type="button"
                  class="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all"
                  on:click|stopPropagation={() => activeMenuId = (activeMenuId === c.id ? null : c.id)}
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                </button>

                {#if activeMenuId === c.id}
                    <div class="absolute right-0 top-8 z-50 w-32 rounded-lg border border-slate-200 bg-white shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100">
                        <button class="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            on:click|stopPropagation={() => quickUpdateStatus(c.id, 'open', false)}>
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Activa
                        </button>
                        <button class="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            on:click|stopPropagation={() => quickUpdateStatus(c.id, 'pending', true)}>
                            <span class="w-2 h-2 rounded-full bg-amber-500"></span> Pendiente
                        </button>
                        <button class="w-full text-left px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            on:click|stopPropagation={() => quickUpdateStatus(c.id, 'closed', false)}>
                            <span class="w-2 h-2 rounded-full bg-slate-500"></span> Cerrada
                        </button>
                    </div>
                {/if}
              </div>
            </div>

            <div class="flex flex-col gap-3 md:hidden relative dropdown-container">
               <div class="flex justify-between items-start">
                  <div class="flex items-center gap-3">
                    <div class="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200">
                         {(getDisplayName(c)[0] || '#').toUpperCase()}
                    </div>
                    <div>
                         <p class="font-bold text-slate-800 text-sm">{getDisplayName(c)}</p>
                         <div class="flex items-center gap-1 text-[10px] text-slate-400">
                            <span>{formatDate(c.lastMessageAt)}</span>
                            <span>•</span>
                            <span class={statusColor[c.status].split(' ')[1]}>{c.status === 'open' ? 'Activa' : c.status}</span>
                         </div>
                    </div>
                  </div>
                  
                  <button
                    class="p-1 text-slate-400"
                    on:click|stopPropagation={() => activeMenuId = (activeMenuId === c.id ? null : c.id)}
                  >
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                  </button>

                    {#if activeMenuId === c.id}
                        <div class="absolute right-0 top-8 z-50 w-36 rounded-lg border border-slate-200 bg-white shadow-xl py-1">
                            <button class="w-full text-left px-4 py-3 text-xs text-slate-700 border-b border-slate-50 hover:bg-slate-50"
                                on:click|stopPropagation={() => goto(`/conversaciones/${c.id}`)}>
                                📂 Abrir Chat
                            </button>
                            <div class="bg-slate-50 px-4 py-1 text-[10px] text-slate-400 font-medium uppercase">Cambiar estado</div>
                            <button class="w-full text-left px-4 py-2 text-xs text-emerald-600 hover:bg-slate-50"
                                on:click|stopPropagation={() => quickUpdateStatus(c.id, 'open', false)}>
                                ● Activa
                            </button>
                            <button class="w-full text-left px-4 py-2 text-xs text-amber-600 hover:bg-slate-50"
                                on:click|stopPropagation={() => quickUpdateStatus(c.id, 'pending', true)}>
                                ● Pendiente
                            </button>
                            <button class="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                                on:click|stopPropagation={() => quickUpdateStatus(c.id, 'closed', false)}>
                                ● Cerrada
                            </button>
                        </div>
                    {/if}
               </div>
               
               <div class="pl-12">
                   <p class="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {c.lastMessageText || 'Sin mensajes'}
                   </p>
               </div>
            </div>

          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>