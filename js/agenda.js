let todosCompromissos = [];

/**
 * Carrega a agenda do Firestore
 */
async function carregarAgenda() {
    try {
        const mesAno = document.getElementById('agenda-filtro-mes') ? document.getElementById('agenda-filtro-mes').value : '';
        const diaEspecifico = document.getElementById('agenda-filtro-dia') ? document.getElementById('agenda-filtro-dia').value : '';
        const categoria = document.getElementById('agenda-filtro-categoria') ? document.getElementById('agenda-filtro-categoria').value : '';
        
        const container = document.getElementById('agenda-lista');
        if(container) container.innerHTML = '<div class="p-8 text-center text-slate-400 italic">Carregando compromissos...</div>';

        const q = window.query(window.collection(window.db, 'agenda'));
        const snapshot = await window.getDocs(q);
        
        todosCompromissos = [];
        snapshot.forEach(doc => {
            todosCompromissos.push({ id: doc.id, ...doc.data() });
        });

        // Filtrar localmente (Firestore não aceita `LIKE` ou funções de mês fáceis)
        let listaFiltrada = [...todosCompromissos];

        if (diaEspecifico) {
            listaFiltrada = listaFiltrada.filter(c => c.data === diaEspecifico);
        } else if (mesAno) {
            listaFiltrada = listaFiltrada.filter(c => c.data && c.data.startsWith(mesAno));
        }
        
        if (categoria) {
            listaFiltrada = listaFiltrada.filter(c => c.categoria === categoria);
        }

        // Ordenar por data e hora crescente
        listaFiltrada.sort((a, b) => {
            const dateA = a.data + 'T' + (a.hora || '00:00');
            const dateB = b.data + 'T' + (b.hora || '00:00');
            return dateA.localeCompare(dateB);
        });

        renderizarAgenda(listaFiltrada);
    } catch (e) {
        console.error("Erro ao carregar agenda:", e);
        if(typeof showModalAlert === 'function') showModalAlert("Erro ao carregar a agenda.");
    }
}

/**
 * Renderiza a lista de compromissos
 */
function renderizarAgenda(lista) {
    const container = document.getElementById('agenda-lista');
    const tituloLista = document.getElementById('agenda-titulo-lista');
    
    if(!container) return;

    if (tituloLista) {
        tituloLista.innerText = `Compromissos (${lista.length})`;
    }

    if (lista.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-slate-400 italic">Nenhum compromisso encontrado para os filtros selecionados.</div>';
        return;
    }

    container.innerHTML = '';
    
    // Agrupar por data
    const agrupado = {};
    lista.forEach(c => {
        if(!agrupado[c.data]) agrupado[c.data] = [];
        agrupado[c.data].push(c);
    });

    Object.keys(agrupado).sort().forEach(dataKey => {
        // Formatar data (YYYY-MM-DD para DD/MM/YYYY)
        const [ano, mes, dia] = dataKey.split('-');
        const dataFmt = `${dia}/${mes}/${ano}`;
        
        // Determinar o dia da semana
        const diaSemana = new Date(ano, mes-1, dia).toLocaleDateString('pt-BR', { weekday: 'long' });

        const headerDiv = document.createElement('div');
        headerDiv.className = "bg-amber-50 px-4 py-2 border-y border-amber-100/50 flex justify-between items-center";
        headerDiv.innerHTML = `
            <div class="font-bold text-amber-800">${dataFmt}</div>
            <div class="text-xs font-medium text-amber-600 uppercase">${diaSemana}</div>
        `;
        container.appendChild(headerDiv);

        agrupado[dataKey].forEach(c => {
            let catColor = "bg-slate-100 text-slate-700";
            let catIcon = "circle";
            
            if (c.categoria === 'GABINETE') { catColor = "bg-blue-100 text-blue-700"; catIcon = "briefcase"; }
            if (c.categoria === 'VISITA') { catColor = "bg-emerald-100 text-emerald-700"; catIcon = "map-pin"; }
            if (c.categoria === 'EVENTO') { catColor = "bg-fuchsia-100 text-fuchsia-700"; catIcon = "party-popper"; }

            const div = document.createElement('div');
            div.className = "p-4 hover:bg-slate-50 transition border-b border-slate-100/50 group";
            
            const btnEditClass = (typeof currentUserRole !== 'undefined' && currentUserRole === 'VISITOR') ? 'hidden' : '';

            div.innerHTML = `
                <div class="flex flex-col md:flex-row gap-4">
                    <div class="md:w-24 shrink-0 flex flex-col items-start md:items-end md:pr-4 md:border-r border-slate-200">
                        <div class="font-bold text-slate-800 text-lg">${c.hora || '--:--'}</div>
                        <div class="${catColor} text-[10px] px-2 py-1 rounded-full font-bold mt-1 flex items-center gap-1 uppercase">
                            <i data-lucide="${catIcon}" class="w-3 h-3"></i> ${c.categoria || 'Geral'}
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <h4 class="font-bold text-slate-800 uppercase text-lg mb-1">${c.titulo}</h4>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button onclick="editarCompromisso('${c.id}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded transition ${btnEditClass}" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                                <button onclick="excluirCompromisso('${c.id}')" class="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded transition ${btnEditClass}" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </div>
                        ${c.local ? `<div class="text-sm text-slate-600 flex items-center gap-1 mt-2 uppercase"><i data-lucide="map-pin" class="w-4 h-4 text-slate-400"></i> ${c.local}</div>` : ''}
                        ${c.envolvidos ? `<div class="text-sm text-slate-600 flex items-center gap-1 mt-1 uppercase"><i data-lucide="users" class="w-4 h-4 text-slate-400"></i> ${c.envolvidos}</div>` : ''}
                        ${c.detalhes ? `<div class="mt-3 text-sm text-slate-500 bg-slate-50 p-3 rounded border border-slate-100 uppercase">${c.detalhes}</div>` : ''}
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    });

    if(typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Abre o modal de nova agenda
 */
function abrirModalAgenda() {
    document.getElementById('frmAgenda').reset();
    document.getElementById('agenda_id').value = '';
    document.getElementById('titulo-modal-agenda').innerText = "Novo Compromisso";
    document.getElementById('btn-salvar-agenda').innerHTML = "Salvar Compromisso";
    
    // Set default date to today
    const hoje = new Date();
    document.getElementById('agenda_data').valueAsDate = hoje;

    const modal = document.getElementById('modal-agenda');
    if (modal) modal.classList.remove('hidden');
}

/**
 * Fecha o modal
 */
function fecharModalAgenda() {
    const modal = document.getElementById('modal-agenda');
    if (modal) modal.classList.add('hidden');
}

/**
 * Edita um compromisso
 */
function editarCompromisso(id) {
    const comp = todosCompromissos.find(c => c.id === id);
    if (!comp) return;

    document.getElementById('agenda_id').value = comp.id;
    document.getElementById('agenda_titulo').value = comp.titulo || '';
    document.getElementById('agenda_data').value = comp.data || '';
    document.getElementById('agenda_hora').value = comp.hora || '';
    document.getElementById('agenda_categoria').value = comp.categoria || 'GABINETE';
    document.getElementById('agenda_local').value = comp.local || '';
    document.getElementById('agenda_envolvidos').value = comp.envolvidos || '';
    document.getElementById('agenda_detalhes').value = comp.detalhes || '';

    document.getElementById('titulo-modal-agenda').innerText = "Editar Compromisso";
    document.getElementById('btn-salvar-agenda').innerHTML = "Atualizar Compromisso";
    
    const modal = document.getElementById('modal-agenda');
    if (modal) modal.classList.remove('hidden');
}

/**
 * Salva a agenda no Firestore
 */
async function salvarAgenda(e) {
    e.preventDefault();
    
    const id = document.getElementById('agenda_id').value;
    const btnSalvar = document.getElementById('btn-salvar-agenda');
    const originalText = btnSalvar.innerHTML;
    
    btnSalvar.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Salvando...`;
    btnSalvar.disabled = true;

    try {
        const dados = {
            titulo: document.getElementById('agenda_titulo').value,
            data: document.getElementById('agenda_data').value,
            hora: document.getElementById('agenda_hora').value,
            categoria: document.getElementById('agenda_categoria').value,
            local: document.getElementById('agenda_local').value,
            envolvidos: document.getElementById('agenda_envolvidos').value,
            detalhes: document.getElementById('agenda_detalhes').value,
            data_criacao: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (id) {
            await window.updateDoc(window.doc(window.db, 'agenda', id), dados);
        } else {
            await window.addDoc(window.collection(window.db, 'agenda'), dados);
        }

        fecharModalAgenda();
        carregarAgenda();
        if(typeof showModalAlert === 'function') showModalAlert("Compromisso salvo com sucesso!");
    } catch (err) {
        console.error("Erro ao salvar agenda:", err);
        if(typeof showModalAlert === 'function') showModalAlert("Erro ao salvar compromisso: " + err.message);
    } finally {
        btnSalvar.innerHTML = originalText;
        btnSalvar.disabled = false;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

/**
 * Exclui um compromisso
 */
async function excluirCompromisso(id) {
    if (typeof showModalConfirm === 'function') {
        const conf = await showModalConfirm("Tem certeza que deseja excluir este compromisso?");
        if (!conf) return;
    } else {
        if (!confirm("Tem certeza que deseja excluir este compromisso?")) return;
    }

    try {
        await window.deleteDoc(window.doc(window.db, 'agenda', id));
        carregarAgenda();
    } catch (e) {
        console.error("Erro ao excluir agenda:", e);
        if(typeof showModalAlert === 'function') showModalAlert("Erro ao excluir compromisso.");
    }
}

// Inicializa a agenda quando a aba for ativada
document.addEventListener('DOMContentLoaded', () => {
    // Escuta mudanças de aba no ui.js
    const oldSwitchTab = window.switchTab;
    if (typeof oldSwitchTab === 'function') {
        window.switchTab = function(tabId, bypassHistory) {
            oldSwitchTab(tabId, bypassHistory);
            if (tabId === 'agenda') {
                carregarAgenda();
                
                // Set default month to current month if empty
                const filtroMes = document.getElementById('agenda-filtro-mes');
                if (filtroMes && !filtroMes.value) {
                    const hoje = new Date();
                    filtroMes.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
                    carregarAgenda();
                }
            }
        };
    }
});
