// ============================================================================
// ABA: LIDERANÇAS
// ============================================================================

window.carregarLiderancasAdmin = async function() {
    const tbody = document.getElementById('tabela-liderancas-admin');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Calculando totais de pacientes por liderança...</td></tr>';
    
    try {
        // 1. Busca Lideranças salvas na lista
        const qConfig = window.query(window.collection(window.db, 'config_selects'), window.where('chave', '==', 'INDICACAO'));
        const snapConfig = await window.getDocs(qConfig);
        let liderancas = {};
        snapConfig.forEach(doc => {
            const val = doc.data().valor.toUpperCase().trim();
            liderancas[val] = { id: doc.id, nome: val, count: 0 };
        });

        // 2. Conta os pacientes por liderança (mesmo as que não estão na config_selects)
        const qPacientes = window.query(window.collection(window.db, 'pacientes'));
        const snapPacientes = await window.getDocs(qPacientes);
        snapPacientes.forEach(doc => {
            let val = (doc.data().indicacao || '').toUpperCase().trim();
            if(!val) val = (doc.data().lideranca || '').toUpperCase().trim();
            
            if(val) {
                if(!liderancas[val]) {
                    liderancas[val] = { id: null, nome: val, count: 0 };
                }
                liderancas[val].count++;
            }
        });

        const arr = Object.values(liderancas).sort((a,b) => a.nome.localeCompare(b.nome));

        if (arr.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Nenhuma liderança cadastrada.</td></tr>';
            return;
        }

        let html = '';
        arr.forEach((item, index) => {
            const nomeEscaped = item.nome.replace(/'/g, "\\'");
            
            // Se id for null, significa que está nos pacientes mas NÃO está na lista oficial
            let btnAdicionar = '';
            if(!item.id) {
                btnAdicionar = `<button onclick="adicionarLiderancaOficial('${nomeEscaped}')" title="Adicionar à lista oficial de opções" class="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded font-bold transition border border-emerald-100"><i data-lucide="plus" class="w-4 h-4"></i></button>`;
            }

            html += `
            <tr class="hover:bg-slate-50 transition">
                <td class="px-6 py-4 text-center text-slate-400 font-mono text-xs">${index + 1}</td>
                <td class="px-6 py-4 font-bold text-slate-700 uppercase flex items-center gap-2">
                    ${!item.id ? '<span title="Aviso: Esta liderança não está na lista de opções do formulário!" class="text-amber-500"><i data-lucide="alert-triangle" class="w-4 h-4"></i></span>' : ''}
                    ${item.nome}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full text-xs">
                        ${item.count}
                    </span>
                </td>
                <td class="px-6 py-4 text-right flex items-center justify-end gap-2">
                    ${btnAdicionar}
                    <button onclick="abrirSubstituirItemLista('${item.id || ''}', '${nomeEscaped}', 'INDICACAO')" title="Substituir / Mesclar" class="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded font-bold transition border border-indigo-100"><i data-lucide="git-merge" class="w-4 h-4"></i></button>
                    ${item.id ? `<button onclick="excluirItemLista('${item.id}', '${nomeEscaped}')" title="Remover das opções" class="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded font-bold transition border border-red-100"><i data-lucide="trash" class="w-4 h-4"></i></button>` : ''}
                </td>
            </tr>`;
        });

        tbody.innerHTML = html;
        if(typeof lucide !== 'undefined') lucide.createIcons();

    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Erro: ${e.message}</td></tr>`;
    }
};

window.adicionarLiderancaOficial = async function(nome) {
    if(!nome) return;
    try {
        await window.addDoc(window.collection(window.db, 'config_selects'), { chave: 'INDICACAO', valor: nome.toUpperCase(), criacao: new Date().toISOString() });
        showMessage('Adicionado à lista oficial!', 'success');
        carregarLiderancasAdmin();
    } catch(e) {
        showModalAlert('Erro: ' + e.message);
    }
};

window.adicionarNovaLideranca = async function() {
    const nome = prompt("Digite o nome da nova liderança:");
    if(!nome || nome.trim() === '') return;
    adicionarLiderancaOficial(nome.trim());
};
