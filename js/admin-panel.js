/**
 * js/admin-panel.js
 * Lógica para o Painel Administrativo expandido:
 * - Gerenciamento de Usuários
 * - Renomear Lideranças
 * - Tabela de Valores de Procedimentos
 */

// ============================================================================
// ABA ATIVA DO ADMIN
// ============================================================================
let adminAbaAtiva = 'usuarios';

window.trocarAbaAdmin = function(aba) {
    adminAbaAtiva = aba;
    ['usuarios', 'liderancas', 'valores', 'auditoria'].forEach(a => {
        const btn = document.getElementById(`admin-tab-${a}`);
        const content = document.getElementById(`admin-content-${a}`);
        if (btn && content) {
            if (a === aba) {
                btn.classList.add('border-b-2', 'border-blue-600', 'text-blue-700', 'font-bold');
                btn.classList.remove('text-slate-500', 'hover:text-slate-700');
                content.classList.remove('hidden');
            } else {
                btn.classList.remove('border-b-2', 'border-blue-600', 'text-blue-700', 'font-bold');
                btn.classList.add('text-slate-500', 'hover:text-slate-700');
                content.classList.add('hidden');
            }
        }
    });

    if (aba === 'usuarios') carregarListaUsuarios();
    if (aba === 'liderancas') carregarLiderancasAdmin();
    if (aba === 'valores') carregarValoresProcedimentos();
    if (aba === 'auditoria') carregarAuditoria();
};

// ============================================================================
// ABA: RENOMEAR LIDERANÇAS
// ============================================================================
window.carregarLiderancasAdmin = async function() {
    const container = document.getElementById('lista-liderancas-admin');
    if (!container) return;
    container.innerHTML = '<p class="text-slate-400 text-sm italic py-4">Carregando...</p>';

    try {
        // Sincroniza com as lideranças que já existem nos munícipes
        const liderancasAtuais = new Set();
        if(typeof todosPacientes !== 'undefined' && todosPacientes) {
            todosPacientes.forEach(p => {
                if(p.indicacao) liderancasAtuais.add(String(p.indicacao).toUpperCase().trim());
                if(p.lideranca) liderancasAtuais.add(String(p.lideranca).toUpperCase().trim());
            });
        }
        if(typeof dashboardRawData !== 'undefined' && dashboardRawData && dashboardRawData.pacientes) {
            dashboardRawData.pacientes.forEach(p => {
                if(p.indicacao) liderancasAtuais.add(String(p.indicacao).toUpperCase().trim());
                if(p.lideranca) liderancasAtuais.add(String(p.lideranca).toUpperCase().trim());
            });
        }
        
        const qConfig = window.query(window.collection(window.db, 'config_selects'), window.where('chave', '==', 'INDICACAO'));
        let snap = await window.getDocs(qConfig);
        
        const inDb = new Set();
        snap.forEach(d => { if(d.data().valor) inDb.add(d.data().valor.toUpperCase().trim()); });

        let added = false;
        for (let val of liderancasAtuais) {
            if (val && !inDb.has(val)) {
                await window.addDoc(window.collection(window.db, 'config_selects'), { chave: 'INDICACAO', valor: val, criacao: new Date().toISOString() });
                added = true;
            }
        }
        if(added) {
            snap = await window.getDocs(qConfig); // re-fetch
        }

        if (snap.empty) {
            container.innerHTML = '<p class="text-slate-500 text-sm italic py-4">Nenhuma liderança cadastrada ainda.</p>';
            return;
        }

        let html = `<div class="space-y-2">`;
        snap.forEach(doc => {
            const val = doc.data().valor || '';
            html += `
            <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm uppercase">${val.charAt(0)}</div>
                <span class="flex-1 font-medium text-slate-800 uppercase text-sm">${val}</span>
                <button onclick="abrirRenomearLideranca('${doc.id}', '${val.replace(/'/g, "\\'")}')"
                    class="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold transition border border-blue-100">
                    Renomear
                </button>
                <button onclick="excluirLideranca('${doc.id}', '${val.replace(/'/g, "\\'")}')"
                    class="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold transition border border-red-100">
                    Excluir
                </button>
            </div>`;
        });
        html += `</div>`;
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = `<p class="text-red-500 text-sm">Erro ao carregar: ${e.message}</p>`;
    }
};

window.abrirRenomearLideranca = function(id, nomeAtual) {
    const novoNome = prompt(`Renomear liderança:\n"${nomeAtual}"\n\nNovo nome:`, nomeAtual);
    if (!novoNome || novoNome.trim() === '' || novoNome.trim().toUpperCase() === nomeAtual.toUpperCase()) return;

    confirmarRenomearLideranca(id, nomeAtual, novoNome.trim().toUpperCase());
};

window.confirmarRenomearLideranca = async function(id, nomeAntigo, novoNome) {
    const confirmado = await showModalConfirm(
        `Renomear "${nomeAntigo}" para "${novoNome}"?\n\nIsso irá ATUALIZAR todos os munícipes cadastrados com esta indicação.`
    );
    if (!confirmado) return;

    try {
        // 1. Atualiza o config_select
        await window.updateDoc(window.doc(window.db, 'config_selects', id), { valor: novoNome });

        // 2. Atualiza em lote todos os pacientes com indicacao = nomeAntigo
        const q = window.query(
            window.collection(window.db, 'pacientes'),
            window.where('indicacao', '==', nomeAntigo)
        );
        const snap = await window.getDocs(q);
        const batch = window.writeBatch(window.db);
        snap.forEach(doc => batch.update(doc.ref, { indicacao: novoNome }));
        await batch.commit();

        showMessage(`Renomeado! ${snap.size} munícipe(s) atualizados.`, 'success');
        carregarLiderancasAdmin();

        // Recarrega dados em memória
        if (typeof carregarListaPacientes === 'function') carregarListaPacientes();
    } catch(e) {
        showModalAlert('Erro ao renomear: ' + e.message);
    }
};

window.excluirLideranca = async function(id, nome) {
    const confirmado = await showModalConfirm(`Excluir a liderança "${nome}" da lista?\n\nOs munícipes que possuem ela não serão alterados.`);
    if (!confirmado) return;
    try {
        await window.deleteDoc(window.doc(window.db, 'config_selects', id));
        showMessage('Liderança removida da lista.', 'success');
        carregarLiderancasAdmin();
    } catch(e) {
        showModalAlert('Erro: ' + e.message);
    }
};

// ============================================================================
// ABA: TABELA DE VALORES DE PROCEDIMENTOS
// ============================================================================
window.carregarValoresProcedimentos = async function() {
    const container = document.getElementById('lista-valores-admin');
    if (!container) return;
    container.innerHTML = '<p class="text-slate-400 text-sm italic py-4">Carregando...</p>';

    try {
        // Sincroniza com os procedimentos que já existem nos atendimentos
        const procedimentosAtuais = new Set();
        if(typeof todosAtendimentos !== 'undefined' && todosAtendimentos) {
            todosAtendimentos.forEach(a => {
                if(a.procedimento) procedimentosAtuais.add(String(a.procedimento).toUpperCase().trim());
            });
        }
        if(typeof dashboardRawData !== 'undefined' && dashboardRawData && dashboardRawData.atendimentos) {
            dashboardRawData.atendimentos.forEach(a => {
                if(a.procedimento) procedimentosAtuais.add(String(a.procedimento).toUpperCase().trim());
            });
        }
        
        const qConfig = window.query(window.collection(window.db, 'config_selects'), window.where('chave', '==', 'PROCEDIMENTO_EXAMES'));
        let snap = await window.getDocs(qConfig);
        
        const inDb = new Set();
        snap.forEach(d => { if(d.data().valor) inDb.add(d.data().valor.toUpperCase().trim()); });

        let added = false;
        for (let val of procedimentosAtuais) {
            if (val && !inDb.has(val)) {
                await window.addDoc(window.collection(window.db, 'config_selects'), { chave: 'PROCEDIMENTO_EXAMES', valor: val, criacao: new Date().toISOString() });
                added = true;
            }
        }
        if(added) {
            snap = await window.getDocs(qConfig); // re-fetch
        }

        if (snap.empty) {
            container.innerHTML = '<p class="text-slate-500 text-sm italic py-4 text-center">Nenhum procedimento cadastrado ainda. Eles são criados automaticamente quando você cadastra um atendimento.</p>';
            return;
        }

        let html = `
        <div class="overflow-x-auto rounded-xl border border-slate-200">
            <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
                    <tr>
                        <th class="px-4 py-3">Procedimento</th>
                        <th class="px-4 py-3 text-right">Valor Padrão (R$)</th>
                        <th class="px-4 py-3 text-right">Ação</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">`;

        snap.forEach(doc => {
            const d = doc.data();
            const val = d.valor || '';
            const preco = d.preco_padrao ? parseFloat(d.preco_padrao).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '—';
            html += `
                <tr class="hover:bg-slate-50 transition">
                    <td class="px-4 py-3 font-medium text-slate-800 uppercase">${val}</td>
                    <td class="px-4 py-3 text-right font-mono text-emerald-700 font-bold">R$ ${preco}</td>
                    <td class="px-4 py-3 text-right">
                        <button onclick="editarValorProcedimento('${doc.id}', '${val.replace(/'/g, "\\'")}', '${d.preco_padrao || ''}')"
                            class="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold border border-emerald-100 transition">
                            Editar Valor
                        </button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table></div>
        <p class="text-xs text-slate-400 mt-3 italic">⚠️ Ao atualizar o valor, atendimentos já salvos <strong>não</strong> serão alterados. O novo valor será aplicado apenas em atendimentos futuros.</p>`;
        container.innerHTML = html;
    } catch(e) {
        container.innerHTML = `<p class="text-red-500 text-sm">Erro ao carregar: ${e.message}</p>`;
    }
};

window.editarValorProcedimento = async function(id, nome, precoAtual) {
    const novoPreco = prompt(`Definir valor padrão para:\n"${nome}"\n\nDigite o valor em R$ (apenas números):`, precoAtual || '');
    if (novoPreco === null) return;
    const valorNum = parseFloat(novoPreco.replace(',', '.'));
    if (isNaN(valorNum) || valorNum < 0) {
        showModalAlert('Valor inválido. Digite apenas números (ex: 150 ou 150.50)');
        return;
    }

    try {
        await window.updateDoc(window.doc(window.db, 'config_selects', id), { preco_padrao: valorNum.toFixed(2) });
        showMessage(`Valor de "${nome}" atualizado para R$ ${valorNum.toFixed(2)}`, 'success');
        carregarValoresProcedimentos();
    } catch(e) {
        showModalAlert('Erro: ' + e.message);
    }
};

// Auto-preenchimento de valor ao selecionar procedimento no formulário de atendimento
window.aplicarValorPadraoProc = async function(nomeProcedimento) {
    if (!nomeProcedimento) return;
    try {
        const snap = await window.getDocs(window.query(
            window.collection(window.db, 'config_selects'),
            window.where('chave', '==', 'PROCEDIMENTO_EXAMES'),
            window.where('valor', '==', nomeProcedimento.toUpperCase())
        ));
        if (!snap.empty) {
            const d = snap.docs[0].data();
            if (d.preco_padrao) {
                const campoValor = document.getElementById('field_valor');
                if (campoValor && !campoValor.value) {
                    campoValor.value = parseFloat(d.preco_padrao).toFixed(2);
                }
            }
        }
    } catch(e) {}
};


// ============================================================================
// ABA: AUDITORIA (LOGS)
// ============================================================================
window.carregarAuditoria = async function() {
    const tbody = document.getElementById('tabela-auditoria-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Carregando logs de auditoria...</td></tr>';

    try {
        const q = window.query(
            window.collection(window.db, 'auditoria'),
            window.orderBy('data_hora', 'desc'),
            window.limit(100)
        );
        const snap = await window.getDocs(q);
        
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">Nenhum log encontrado.</td></tr>';
            return;
        }

        let html = '';
        snap.forEach(doc => {
            const d = doc.data();
            const dataStr = d.data_hora ? new Date(d.data_hora).toLocaleString('pt-BR') : 'Desconhecida';
            html += `
                <tr class="hover:bg-slate-50 transition">
                    <td class="px-4 py-3 text-slate-500 text-xs font-mono">${dataStr}</td>
                    <td class="px-4 py-3 font-bold text-slate-700">${d.usuario || '—'}</td>
                    <td class="px-4 py-3">
                        <span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">${d.acao || '—'}</span>
                    </td>
                    <td class="px-4 py-3 text-slate-500 text-xs uppercase">${d.modulo || '—'}</td>
                    <td class="px-4 py-3 text-slate-600 italic text-xs max-w-xs truncate" title="${d.detalhes || ''}">${d.detalhes || '—'}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-red-500">Erro ao carregar auditoria: ${e.message}</td></tr>`;
        console.error(e);
    }
};
