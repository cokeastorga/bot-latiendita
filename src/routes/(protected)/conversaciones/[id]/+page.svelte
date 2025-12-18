<script lang="ts">
  import { onMount, afterUpdate, tick } from 'svelte';
  import { page } from '$app/stores';
  import { db } from '$lib/firebase';
  import {
    doc,
    updateDoc, // <--- Importante: Agregado para guardar el nombre
    collection,
    query,
    orderBy,
    onSnapshot
  } from 'firebase/firestore';
  import { goto } from '$app/navigation';

  type ConversationStatus = 'open' | 'pending' | 'closed';

  type Conversation = {
    id: string;
    channel: 'whatsapp' | 'web';
    userId?: string | null;
    contactName?: string | null;  // <--- Nuevo campo editable
    whatsappName?: string | null; // <--- Nombre original de WhatsApp
    status: ConversationStatus;
    lastMessageAt?: Date | null;
    lastIntentId?: string | null;
    needsHuman?: boolean;
  };

  type Message = {
    id: string;
    from: 'user' | 'bot' | 'staff';
    direction: 'in' | 'out';
    text: string;
    intentId?: string | null;
    confidence?: number | null;
    stateBefore?: string | null;
    stateAfter?: string | null;
    createdAt?: Date | null;
  };

  let convId: string;
  let conversation: Conversation | null = null;
  let messages: Message[] = [];
  let loadingConv = true;
  let loadingMessages = true;

  // Lógica de Edición de Nombre
  let isEditingName = false;
  let tempName = '';

  let replyText = '';
  let sendingReply = false;
  let actionLoading = false;
  let errorMsg: string | null = null;

  let scrollContainer: HTMLElement;

  // --- LÓGICA DE SCROLL MEJORADA ---
  const scrollToBottom = async () => {
    if (scrollContainer) {
      await tick();
      // Pequeño timeout para asegurar que el DOM pintó todo antes de bajar
      setTimeout(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }, 50);
    }
  };

  const statusColor: Record<ConversationStatus, string> = {
    open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    closed: 'bg-slate-50 text-slate-600 border-slate-200'
  };

  const channelLabel: Record<'whatsapp' | 'web', string> = {
    whatsapp: 'WhatsApp',
    web: 'Web'
  };

  const channelColor: Record<'whatsapp' | 'web', string> = {
    whatsapp: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    web: 'bg-indigo-50 text-indigo-700 border-indigo-100'
  };

  function formatDate(d?: Date | null): string {
    if (!d) return '—';
    return d.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  $: convId = $page.params.id;

  // Cuando carga la conversación, preparamos el nombre temporal
  $: if (conversation) {
    // Si no estamos editando, actualizamos el tempName con lo que venga de la BD
    if (!isEditingName) {
        tempName = conversation.contactName || conversation.whatsappName || conversation.userId || '';
    }
  }

  onMount(() => {
    if (!convId) return;

    let unsubscribeConv: (() => void);
    let unsubscribeMessages: (() => void);

    const convRef = doc(db, 'conversations', convId);

    // 1. LISTENER CONVERSACIÓN
    unsubscribeConv = onSnapshot(convRef, (docSnap) => {
      if (!docSnap.exists()) {
        loadingConv = false;
        goto('/conversaciones');
        return;
      }

      const data = docSnap.data();
      const meta = (data.metadata ?? {}) as Record<string, unknown>;

      conversation = {
        id: docSnap.id,
        channel: (data.channel ?? 'whatsapp') as 'whatsapp' | 'web',
        userId: data.userId ?? null,
        // Prioridad: contactName (manual) -> customerName (legacy metadata) -> whatsappName
        contactName: data.contactName ?? (meta.customerName as string) ?? null,
        whatsappName: data.whatsappName ?? null,
        status: (data.status ?? 'open') as ConversationStatus,
        lastMessageAt: data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : null,
        lastIntentId: data.lastIntentId ?? null,
        needsHuman: data.needsHuman ?? false
      };
      loadingConv = false;
    }, (error) => {
      console.error('❌ Error listener conv:', error);
      loadingConv = false;
    });

    // 2. LISTENER MENSAJES
    const messagesRef = collection(convRef, 'messages');
    const qMessages = query(messagesRef, orderBy('createdAt', 'asc'));

    unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
      const isAtBottom = scrollContainer 
        ? scrollContainer.scrollHeight - scrollContainer.scrollTop === scrollContainer.clientHeight 
        : true;

      messages = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          from: (d.from ?? (d.direction === 'out' ? 'bot' : 'user')) as 'user' | 'bot' | 'staff',
          direction: (d.direction ?? 'in') as 'in' | 'out',
          text: d.text ?? '',
          intentId: d.intentId ?? null,
          confidence: d.confidence ?? null,
          stateBefore: d.stateBefore ?? null,
          stateAfter: d.stateAfter ?? null,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : null
        };
      });
      loadingMessages = false;
      
      // Forzar scroll abajo al recibir mensajes nuevos
      scrollToBottom();
    });

    return () => {
      if (unsubscribeConv) unsubscribeConv();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  });

  // --- GUARDAR NOMBRE DE CONTACTO ---
  async function saveContactName() {
    if (!conversation?.id) return;
    try {
        await updateDoc(doc(db, 'conversations', conversation.id), {
            contactName: tempName
        });
        isEditingName = false;
    } catch (e) {
        console.error('Error guardando nombre:', e);
        alert('Error al guardar el nombre');
    }
  }

  async function sendManualReply() {
    if (!conversation || !replyText.trim() || sendingReply) return;
    errorMsg = null;
    sendingReply = true;

    try {
      const res = await fetch('/api/manual-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          text: replyText.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Error al enviar respuesta');
      }
      replyText = '';
      scrollToBottom(); // Asegurar scroll al enviar
    } catch (err) {
      console.error(err);
      errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    } finally {
      sendingReply = false;
    }
  }

  async function updateStatus(partial: { status?: ConversationStatus; needsHuman?: boolean }) {
    if (!conversation || actionLoading) return;
    actionLoading = true;
    try {
      await fetch('/api/conversations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: conversation.id, ...partial })
      });
      // Optimistic update
      conversation = { ...conversation, ...partial };
    } catch (err) {
      console.error(err);
    } finally {
      actionLoading = false;
    }
  }

  function handleReplyKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendManualReply();
    }
  }

  // Hook extra para asegurar scroll cuando el componente se actualiza
  afterUpdate(() => {
    if(messages.length > 0 && !loadingMessages) {
        // Validación ligera para no bloquear el scroll si el usuario subió mucho,
        // pero para tu requerimiento de "siempre abajo", lo dejamos directo.
        // scrollToBottom(); 
    }
  });
</script>

<div class="flex flex-col h-full max-h-[calc(100vh-6rem)]">
<section class="mb-4 flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <button
        type="button"
        class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
        on:click={() => goto('/conversaciones')}
        title="Volver"
      >
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18L9 12L15 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="h-10 w-10 shrink-0 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-200">
        {(conversation?.contactName?.[0] || conversation?.whatsappName?.[0] || conversation?.userId?.[0] || '#').toUpperCase()}
      </div>

      <div class="flex flex-col min-w-0 flex-1">
        <div class="flex items-center gap-2">
            {#if isEditingName}
                <div class="flex items-center gap-1 w-full max-w-[250px]">
                    <input 
                        type="text" 
                        bind:value={tempName}
                        class="h-7 w-full rounded border border-slate-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
                        autofocus
                    />
                    <button on:click={saveContactName} class="p-1 text-green-600 hover:bg-green-50 rounded" title="Guardar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    <button on:click={() => isEditingName = false} class="p-1 text-red-500 hover:bg-red-50 rounded" title="Cancelar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            {:else}
              <h2 
    class="text-lg font-bold text-slate-800 truncate leading-tight group flex items-center gap-2 cursor-pointer" 
    on:click={() => { 
        isEditingName = true; 
        tempName = conversation?.contactName || conversation?.whatsappName || conversation?.userId || ''; 
    }}
>
    { 
      (conversation?.contactName && conversation.contactName !== conversation.userId) 
        ? conversation.contactName 
        : (conversation?.whatsappName || conversation?.userId || 'Desconocido') 
    }
    
    <span class="opacity-0 group-hover:opacity-100 text-slate-400 text-xs hover:text-blue-500 transition-opacity">
        ✏️
    </span>
</h2>
            {/if}
        </div>
        
        <div class="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            {#if conversation?.userId}
                <span class="font-mono bg-slate-100 px-1 rounded">{conversation.userId}</span>
            {/if}
            
            {#if conversation?.whatsappName && conversation?.contactName && conversation.whatsappName !== conversation.contactName}
                <span class="text-blue-500">({conversation.whatsappName})</span>
            {/if}
            
            <span class="text-[10px] text-slate-400 border-l pl-2 border-slate-300">
                ID: {convId.slice(0,6)}...
            </span>
        </div>
      </div>
    </div>

    {#if conversation}
      <div class="flex flex-col items-end gap-1.5">
        <div class="flex gap-1">
            <span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${channelColor[conversation.channel]}`}>
                {channelLabel[conversation.channel]}
            </span>
            <span class={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor[conversation.status]}`}>
                {conversation.status === 'open' ? 'Activa' : conversation.status}
            </span>
        </div>

        <div class="flex gap-1">
            {#if conversation.status !== 'open'}
                <button on:click={() => updateStatus({ status: 'open', needsHuman: false })} class="px-2 py-0.5 text-[10px] bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Reabrir</button>
            {/if}
            {#if conversation.status === 'open'}
                <button on:click={() => updateStatus({ status: 'closed', needsHuman: false })} class="px-2 py-0.5 text-[10px] bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors">Cerrar</button>
            {/if}
        </div>
      </div>
    {/if}
  </section>

  <section class="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden relative">
    <div class="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm absolute w-full top-0 z-10 h-10">
      <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Historial</p>
      {#if conversation?.lastIntentId}
        <p class="text-[10px] text-slate-400">Última intención: <span class="font-mono text-slate-600">{conversation.lastIntentId}</span></p>
      {/if}
    </div>

    <div 
        bind:this={scrollContainer} 
        class="flex-1 overflow-y-auto p-4 pt-12 space-y-4 bg-slate-50 scroll-smooth"
    >
      {#if loadingMessages}
        <div class="flex justify-center py-10"><span class="animate-pulse text-slate-400 text-sm">Cargando conversación...</span></div>
      {:else if messages.length === 0}
        <div class="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <p>No hay mensajes aquí.</p>
            <p class="text-xs">Envía uno para iniciar.</p>
        </div>
      {:else}
        {#each messages as m}
          <div class={`flex ${m.from === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div class={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm transition-all
                ${m.from === 'user' ? 'bg-white text-slate-800 rounded-bl-none border border-slate-100' 
                : m.from === 'staff' ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' 
                : 'bg-slate-800 text-slate-50 rounded-br-none shadow-slate-200'}`}
            >
              <p class="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
              
              <div class={`mt-1 flex items-center justify-between gap-4 text-[9px] uppercase tracking-wide opacity-70 
                  ${m.from === 'user' ? 'text-slate-400' : 'text-slate-300'}`}>
                <span class="font-bold">
                    {m.from === 'user' ? 'Cliente' : m.from === 'staff' ? 'Tú' : 'Bot'}
                    {m.intentId ? ` • ${m.intentId}` : ''}
                </span>
                <span>{m.createdAt ? m.createdAt.toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'}) : ''}</span>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <div class="border-t border-slate-200 bg-white p-3 z-20">
      <form class="flex items-end gap-2" on:submit|preventDefault={sendManualReply}>
        <textarea
          bind:value={replyText}
          rows="1"
          on:keydown={handleReplyKeydown}
          placeholder={conversation?.status === 'closed' ? 'Reabre el chat para escribir...' : 'Escribe tu respuesta...'}
          class="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50"
          disabled={conversation?.status === 'closed' || sendingReply}
        />
        <button
          type="submit"
          disabled={sendingReply || !replyText.trim() || conversation?.status === 'closed'}
          class="h-[46px] w-[46px] flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:bg-slate-200 disabled:shadow-none disabled:scale-100"
        >
          {#if sendingReply}
            <div class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          {:else}
            <svg class="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          {/if}
        </button>
      </form>
      {#if errorMsg}
        <p class="text-xs text-red-500 mt-2 text-center">{errorMsg}</p>
      {/if}
    </div>
  </section>
</div>