// ============================================================================
// ABA ATIVA DO ADMIN E NAVEGAÇÃO
// ============================================================================

window.abrirPainelAdmin = function() {
    ['view-dashboard', 'view-listagem', 'view-relatorios'].forEach(v => {
        const el = document.getElementById(v);
        if(el) el.classList.add('hidden');
    });
    const painel = document.getElementById('view-admin-panel');
    if(painel) painel.classList.remove('hidden');
    if(typeof trocarAbaAdmin === 'function') trocarAbaAdmin('usuarios');
};

window.fecharModalAdmin = function() {
    const painel = document.getElementById('view-admin-panel');
    if(painel) painel.classList.add('hidden');
    const dash = document.getElementById('view-dashboard');
    if(dash) dash.classList.remove('hidden');
};

let adminAbaAtiva = 'usuarios';

window.trocarAbaAdmin = function(aba) {
    adminAbaAtiva = aba;
    ['usuarios', 'listas', 'liderancas', 'valores', 'auditoria', 'ferramentas'].forEach(a => {
        const btn = document.getElementById(`admin-tab-${a}`);
        const content = document.getElementById(`admin-content-${a}`);
        if(btn) {
            if(a === aba) {
                btn.classList.add('border-b-2', 'border-blue-600', 'text-blue-700', 'font-bold');
                btn.classList.remove('text-slate-500', 'dark:text-slate-400');
            } else {
                btn.classList.remove('border-b-2', 'border-blue-600', 'text-blue-700', 'font-bold');
                btn.classList.add('text-slate-500', 'dark:text-slate-400');
            }
        }
        if(content) {
            if(a === aba) content.classList.remove('hidden');
            else content.classList.add('hidden');
        }
    });

    if(aba === 'usuarios') {
        if(typeof window.carregarListaUsuarios === 'function') window.carregarListaUsuarios();
    } else if (aba === 'listas') {
        if(typeof window.atualizarOpcoesSelectAdmin === 'function') window.atualizarOpcoesSelectAdmin();
        if(typeof window.carregarListaAdmin === 'function') window.carregarListaAdmin();
    } else if (aba === 'liderancas') {
        if(typeof window.carregarLiderancasAdmin === 'function') window.carregarLiderancasAdmin();
    } else if (aba === 'valores') {
        if(typeof window.carregarValoresProcedimentos === 'function') window.carregarValoresProcedimentos();
    } else if (aba === 'auditoria') {
        if(typeof window.carregarAuditoria === 'function') window.carregarAuditoria();
    }
};

window.fecharModalAcoesBanco = function() {
    const m = document.getElementById('modal-acoes-banco');
    if(!m) return;
    m.classList.add('opacity-0');
    document.getElementById('modal-acoes-banco-content').classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300);
};

window.abrirModalAcoesBanco = function() {
    const m = document.getElementById('modal-acoes-banco');
    if(!m) return;
    m.classList.remove('hidden');
    setTimeout(() => {
        m.classList.remove('opacity-0');
        document.getElementById('modal-acoes-banco-content').classList.remove('scale-95');
    }, 10);
};

// ============================================================================
// USUARIOS
// ============================================================================
window.carregarListaUsuarios = async function() {
    const tbody = document.getElementById('tabela-usuarios-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-4 text-center">Carregando...</td></tr>';
    try {
        const snap = await window.getDocs(window.collection(window.db, 'users'));
        let html = '';
        snap.forEach(doc => {
            const data = doc.data();
            html += `
            <tr class="border-b border-slate-100">
                <td class="px-4 py-3">${data.email || 'N/A'}</td>
                <td class="px-4 py-3">${data.nome || 'N/A'}</td>
                <td class="px-4 py-3">
                    <select class="input-field text-xs" onchange="salvarConfigUsuario('${doc.id}', this.value)">
                        <option value="admin" ${data.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="user" ${data.role === 'user' ? 'selected' : ''}>Usuário</option>
                    </select>
                </td>
                <td class="px-4 py-3 text-right">
                    <button onclick="deletarUsuario('${doc.id}')" class="text-rose-600 hover:text-rose-800"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="4" class="px-4 py-4 text-center">Nenhum usuário</td></tr>';
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-4 py-4 text-center text-rose-500">Erro: ${e.message}</td></tr>`;
    }
};

window.salvarConfigUsuario = async function(id, role) {
    try {
        await window.updateDoc(window.doc(window.db, 'users', id), { role });
    } catch(e) { alert('Erro ao salvar usuário: ' + e.message); }
};
window.deletarUsuario = async function(id) {
    if(!confirm('Deletar usuário?')) return;
    try {
        await window.deleteDoc(window.doc(window.db, 'users', id));
        window.carregarListaUsuarios();
    } catch(e) { alert('Erro ao deletar: ' + e.message); }
};

// ============================================================================
// VALORES
// ============================================================================
window.carregarValoresProcedimentos = async function() {
    const listDiv = document.getElementById('lista-valores-admin');
    if(!listDiv) return;
    listDiv.innerHTML = '<p class="text-slate-400 text-sm">Carregando...</p>';
    try {
        const snapConfig = await window.getDocs(window.collection(window.db, 'config_selects'));
        let procedimentos = [];
        snapConfig.forEach(doc => {
            const data = doc.data();
            const chaveRaw = (data.tipo || data.chave || '').toUpperCase();
            const chaveNorm = chaveRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (chaveNorm.includes('PROCED')) {
                const raw = data.valor || data.nome || '';
                const preco = data.preco_padrao || '';
                if(raw) procedimentos.push({ id: doc.id, nome: String(raw), preco: preco });
            }
        });
        procedimentos.sort((a,b) => a.nome.localeCompare(b.nome));
        
        if(procedimentos.length === 0) {
            listDiv.innerHTML = '<p class="text-slate-500 text-sm p-4 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">Nenhum Procedimento/Exame cadastrado em suas Listas do Sistema.</p>';
            return;
        }

        let html = '';
        procedimentos.forEach(p => {
            const precoVal = p.preco ? parseFloat(p.preco).toFixed(2) : '';
            html += `
            <div class="flex items-center justify-between p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 group">
                <span class="text-sm text-slate-700 font-medium">${p.nome}</span>
                <div class="flex items-center gap-2">
                    <span class="text-slate-400 text-sm">R$</span>
                    <input type="number" step="0.01" id="valor-base-${p.id}" class="input-field w-24 text-right text-sm" placeholder="0.00" value="${precoVal}">
                    <button onclick="salvarValoresBase('${p.id}')" class="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded transition">Salvar</button>
                </div>
            </div>`;
        });
        listDiv.innerHTML = html;
    } catch(e) {
        listDiv.innerHTML = `<p class="text-red-500 text-sm">Erro ao carregar: ${e.message}</p>`;
    }
};

window.salvarValoresBase = async function(id) {
    const el = document.getElementById(`valor-base-${id}`);
    if(!el) return;
    try {
        const valorNum = parseFloat(el.value);
        if(isNaN(valorNum) || valorNum < 0) {
            alert('Valor inválido. Digite apenas números.');
            return;
        }
        await window.updateDoc(window.doc(window.db, 'config_selects', id), { preco_padrao: valorNum.toFixed(2) });
        alert('Valor salvo com sucesso!');
    } catch(e) {
        console.error('Erro ao salvar valor', e);
        alert('Erro ao salvar valor: ' + e.message);
    }
};

// ============================================================================
// LISTAS GÉNERICAS
// ============================================================================
window.carregarListaAdmin = async function() {
    const select = document.getElementById('admin-select-lista');
    const tipo = select ? select.value : '';
    const listDiv = document.getElementById('lista-generica-admin');
    
    if(!tipo) {
        if(listDiv) listDiv.innerHTML = '<p class="text-slate-400 italic text-sm">Selecione uma lista acima para carregar.</p>';
        return;
    }
    
    if(!listDiv) return;
    listDiv.innerHTML = '<p class="text-slate-400 text-sm">Carregando...</p>';
    
    try {
        const snap = await window.getDocs(window.collection(window.db, 'config_selects'));
        let itens = [];
        snap.forEach(doc => {
            const data = doc.data();
            const chaveObj = String(data.tipo || data.chave || '').toUpperCase().trim();
            const tipoUpper = String(tipo).toUpperCase().trim();
            if (chaveObj !== tipoUpper) return;
            const nome = data.valor || data.nome;
            itens.push({ id: doc.id, nome: nome });
        });
        
        itens.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        
        if (itens.length === 0) {
            listDiv.innerHTML = '<p class="text-xs text-slate-400 p-3">Nenhum item cadastrado nesta lista.</p>';
        } else {
            let html = `
            <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table class="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead class="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 uppercase font-bold text-xs border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th class="px-4 py-3">Nome do Item</th>
                            <th class="px-4 py-3 text-right w-40">Ações (Mesclar/Excluir)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
            `;
            itens.forEach(item => {
                html += `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-200 font-medium uppercase">${item.nome}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex justify-end gap-2">
                                    ${(typeof currentUserRole !== 'undefined' && currentUserRole === 'ADMIN') ? `
                                    <button onclick="abrirModalSubstituirLista('${tipo}', '${item.id}', '${item.nome}')" class="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1.5 rounded transition" title="Substituir/Mesclar"><i data-lucide="git-merge" class="w-4 h-4"></i></button>
                                    <button onclick="deletarItemLista('${item.id}')" class="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded transition" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                    ` : '<span class="text-slate-300 text-xs italic">-</span>'}
                                </div>
                            </td>
                        </tr>`;
            });
            html += `
                    </tbody>
                </table>
            </div>`;
            listDiv.innerHTML = html;
        }
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { 
        listDiv.innerHTML = '<p class="text-xs text-rose-500 p-3">Erro ao carregar lista: ' + e.message + '</p>'; 
    }
};

window.adicionarNovoItemLista = async function() {
    const select = document.getElementById('admin-select-lista');
    const tipo = select ? select.value : '';
    if(!tipo) {
        alert('Por favor, selecione uma lista no menu dropdown antes de adicionar.');
        return;
    }
    
    const novoNome = prompt(`Digite o nome para adicionar em ${tipo}:`);
    if(!novoNome || !novoNome.trim()) return;
    
    try {
        await window.addDoc(window.collection(window.db, 'config_selects'), { 
            chave: tipo,
            valor: novoNome.trim().toUpperCase(),
            criacao: new Date().toISOString()
        });
        window.carregarListaAdmin();
        if(typeof carregarFiltros === 'function') carregarFiltros();
    } catch(e) { alert('Erro ao adicionar: ' + e.message); }
};

window.deletarItemLista = async function(id) {
    if(!confirm('Excluir este item permanentemente?')) return;
    try {
        await window.deleteDoc(window.doc(window.db, 'config_selects', id));
        window.carregarListaAdmin();
        if(typeof carregarFiltros === 'function') carregarFiltros();
    } catch(e) { alert('Erro ao deletar: ' + e.message); }
};

let subsTipoContext = '';
let subsIdAntigoContext = '';
let subsNomeAntigoContext = '';

window.fecharSubstituirItemLista = function() {
    const m = document.getElementById('modal-substituir-lista');
    if(!m) return;
    m.classList.add('opacity-0');
    document.getElementById('modal-substituir-lista-content').classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300);
};

window.abrirModalSubstituirLista = async function(tipo, idAntigo, nomeAntigo) {
    subsTipoContext = tipo;
    subsIdAntigoContext = idAntigo;
    subsNomeAntigoContext = nomeAntigo;
    
    document.getElementById('subs-item-antigo').innerText = nomeAntigo;
    document.getElementById('subs-item-novo').value = '';
    
    const select = document.getElementById('subs-item-existente');
    select.innerHTML = '<option value="">Selecione um item (opcional)...</option>';
    
    try {
        const snap = await window.getDocs(window.collection(window.db, 'config_selects'));
        snap.forEach(doc => {
            const data = doc.data();
            const chaveObj = String(data.tipo || data.chave || '').toUpperCase().trim();
            const tipoUpper = String(tipo).toUpperCase().trim();
            
            if (chaveObj === tipoUpper && doc.id !== idAntigo) {
                const nome = data.valor || data.nome;
                select.innerHTML += `<option value="${nome}">${nome}</option>`;
            }
        });
    } catch(e) {}
    
    const m = document.getElementById('modal-substituir-lista');
    m.classList.remove('hidden');
    setTimeout(() => {
        m.classList.remove('opacity-0');
        document.getElementById('modal-substituir-lista-content').classList.remove('scale-95');
    }, 10);
};

window.confirmarSubstituicao = async function() {
    const select = document.getElementById('subs-item-existente');
    const input = document.getElementById('subs-item-novo');
    let novoNome = '';
    
    if (input.value.trim() !== '') {
        novoNome = input.value.trim().toUpperCase();
        try { 
            await window.addDoc(window.collection(window.db, 'config_selects'), { 
                chave: subsTipoContext, 
                valor: novoNome,
                criacao: new Date().toISOString()
            }); 
        } catch(e){}
    } else if (select.value !== '') {
        novoNome = select.value;
    } else {
        alert("Selecione um item ou crie um novo.");
        return;
    }
    
    const fieldMap = {
        'CATEGORIAS': 'categoria',
        'ESPECIALIDADE': 'especialidade',
        'PROCEDIMENTO_EXAMES': 'procedimento',
        'PRIORIDADE': 'prioridade',
        'STATUS_ATENDIMENTO': 'status',
        'INDICACAO': 'bairro'
    };
    const atdField = fieldMap[subsTipoContext] || subsTipoContext;

    try {
        const atdSnap = await window.getDocs(window.collection(window.db, 'atendimentos'));
        atdSnap.forEach(async docSnap => {
            let data = docSnap.data();
            if (data[atdField] === subsNomeAntigoContext) {
                await window.updateDoc(window.doc(window.db, 'atendimentos', docSnap.id), { [atdField]: novoNome });
            }
        });
        
        await window.deleteDoc(window.doc(window.db, 'config_selects', subsIdAntigoContext));
        window.fecharSubstituirItemLista();
        window.carregarListaAdmin();
        if(typeof carregarFiltros === 'function') carregarFiltros();
        alert('Substituição realizada com sucesso!');
    } catch(e) {
        alert('Erro ao substituir: ' + e.message);
    }
};


// ============================================================================
// ABA: LIDERANÇAS
// ============================================================================

window.carregarLiderancasAdmin = async function() {
    const tbody = document.getElementById('tabela-liderancas-admin');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Calculando totais de pacientes por liderança...</td></tr>';
    
    try {
        // 1. Busca TODAS as configs e filtra localmente para evitar problemas de chaves antigas
        const snapConfig = await window.getDocs(window.collection(window.db, 'config_selects'));
        let liderancas = {};
        snapConfig.forEach(doc => {
            const data = doc.data();
            const chaveRaw = (data.tipo || data.chave || '').toUpperCase();
            const chaveNorm = chaveRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (chaveNorm.includes('INDICA') || chaveNorm.includes('LIDER')) {
                const raw = data.valor || data.nome || '';
                if(raw) {
                    const val = raw.toUpperCase().trim();
                    liderancas[val] = { id: doc.id, nome: val, count: 0 };
                }
            }
        });

        // 2. Conta os pacientes por liderança (mesmo as que não estão na config_selects)
        const qPacientes = window.query(window.collection(window.db, 'pacientes'));
        const snapPacientes = await window.getDocs(qPacientes);
        snapPacientes.forEach(doc => {
            let val = String(doc.data().indicacao || '').toUpperCase().trim();
            if(!val) val = String(doc.data().lideranca || '').toUpperCase().trim();
            
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
        await window.addDoc(window.collection(window.db, 'config_selects'), { tipo: 'LIDERANCA', valor: nome.toUpperCase(), criacao: new Date().toISOString() });
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

// ============================================================================
// AUDITORIA DE DOCUMENTOS E TELEFONES
// ============================================================================

window.fecharModalAuditoriaDocs = function() {
    const m = document.getElementById('modal-auditoria-docs');
    if(!m) return;
    m.classList.add('opacity-0');
    document.getElementById('modal-auditoria-docs-content').classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300);
};

window.auditarDocsBanco = async function() {
    const m = document.getElementById('modal-auditoria-docs');
    if(!m) return;
    
    m.classList.remove('hidden');
    setTimeout(() => {
        m.classList.remove('opacity-0');
        document.getElementById('modal-auditoria-docs-content').classList.remove('scale-95');
    }, 10);

    document.getElementById('loading-auditoria-docs').classList.remove('hidden');
    document.getElementById('resultado-auditoria-docs').classList.add('hidden');
    
    const tbody = document.getElementById('tabela-auditoria-docs-body');
    tbody.innerHTML = '';
    
    try {
        const snap = await window.getDocs(window.collection(window.db, 'pacientes'));
        let invalidos = [];
        
        snap.forEach(doc => {
            const data = doc.data();
            let cpfVal = data.cpf || '';
            let susVal = data.sus || '';
            let tituloVal = data.titulo || '';
            let tel1Val = data.telefone1 || '';
            let tel2Val = data.telefone2 || '';
            
            let cpfLimpo = cpfVal.replace(/[^\d]+/g, '');
            let susLimpo = susVal.replace(/[^\d]+/g, '');
            let tituloLimpo = tituloVal.replace(/[^\d]+/g, '');
            let tel1Limpo = tel1Val.replace(/[^\d]+/g, '');
            let tel2Limpo = tel2Val.replace(/[^\d]+/g, '');

            let errors = [];

            if (cpfLimpo.length > 0 && (cpfLimpo.length !== 11 || !window.isValidCPF(cpfLimpo))) {
                errors.push('cpf');
            }
            if (susLimpo.length > 0 && susLimpo.length !== 15) {
                errors.push('sus');
            }
            if (tituloLimpo.length > 0 && tituloLimpo.length !== 12) {
                errors.push('titulo');
            }
            if (tel1Limpo.length > 0 && tel1Limpo.length < 10) {
                errors.push('tel1');
            }
            if (tel2Limpo.length > 0 && tel2Limpo.length < 10) {
                errors.push('tel2');
            }
            
            if (errors.length > 0) {
                invalidos.push({
                    id: doc.id,
                    nome: data.nome || 'Sem Nome',
                    cpf: cpfVal,
                    sus: susVal,
                    titulo: tituloVal,
                    telefone1: tel1Val,
                    telefone2: tel2Val,
                    errors: errors
                });
            }
        });
        
        document.getElementById('total-docs-invalidos').innerText = invalidos.length;
        
        if (invalidos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Nenhum dado inválido encontrado! O banco está limpo.</td></tr>';
        } else {
            let html = '';
            invalidos.forEach((inv, index) => {
                
                const hasError = (field) => inv.errors.includes(field);
                
                const renderField = (key, label, value, err) => {
                    if (!value && !err) return ''; // Se for vazio e não for erro, não mostra
                    const isErr = err;
                    return `
                        <div class="flex items-center gap-2">
                            <label class="w-16 text-right text-[10px] font-bold uppercase ${isErr ? 'text-rose-600' : 'text-slate-400'}">${label}</label>
                            <input type="text" id="audit-${key}-${index}" value="${value}" 
                                class="flex-1 px-2 py-1 text-sm rounded border ${isErr ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-600'} focus:outline-none focus:border-indigo-500 transition">
                        </div>
                    `;
                };

                html += `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100" id="tr-audit-${index}">
                    <td class="px-4 py-3 font-bold text-slate-800 align-top max-w-[200px] truncate" title="${inv.nome}">
                        ${inv.nome}
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex flex-col gap-2 max-w-sm">
                            ${hasError('cpf') || inv.cpf ? renderField('cpf', 'CPF', inv.cpf, hasError('cpf')) : ''}
                            ${hasError('sus') || inv.sus ? renderField('sus', 'SUS', inv.sus, hasError('sus')) : ''}
                            ${hasError('titulo') || inv.titulo ? renderField('titulo', 'Título', inv.titulo, hasError('titulo')) : ''}
                            ${hasError('tel1') || inv.telefone1 ? renderField('tel1', 'Tel 1', inv.telefone1, hasError('tel1')) : ''}
                            ${hasError('tel2') || inv.telefone2 ? renderField('tel2', 'Tel 2', inv.telefone2, hasError('tel2')) : ''}
                        </div>
                    </td>
                    <td class="px-4 py-3 text-right align-top">
                        <button onclick="salvarCorrecaoDocs('${inv.id}', ${index})" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition shadow-sm mb-2 w-full flex items-center justify-center gap-1"><i data-lucide="save" class="w-3 h-3"></i> Salvar</button>
                        <button onclick="fecharModalAuditoriaDocs(); buscarPacientePorId('${inv.id}')" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs transition w-full flex items-center justify-center gap-1"><i data-lucide="external-link" class="w-3 h-3"></i> Ficha</button>
                    </td>
                </tr>
                `;
            });
            tbody.innerHTML = html;
            
            // Applica as mascaras nos inputs criados
            setTimeout(() => {
                invalidos.forEach((inv, index) => {
                    const elCpf = document.getElementById(`audit-cpf-${index}`);
                    const elSus = document.getElementById(`audit-sus-${index}`);
                    const elTit = document.getElementById(`audit-titulo-${index}`);
                    const elTel1 = document.getElementById(`audit-tel1-${index}`);
                    const elTel2 = document.getElementById(`audit-tel2-${index}`);
                    
                    // Assumindo que maskCPF, maskSUS, etc. são acessíveis (pois estão no escopo global ou em masks.js com attach)
                    // Na verdade masks.js define elas no escopo global?
                    // applyMask e maskCPF não estão no window por padrão no masks.js.
                    // Precisamos resolver isso.
                });
            }, 100);
        }
        
        if(typeof lucide !== 'undefined') lucide.createIcons();
        
        document.getElementById('loading-auditoria-docs').classList.add('hidden');
        document.getElementById('resultado-auditoria-docs').classList.remove('hidden');

    } catch(e) {
        document.getElementById('loading-auditoria-docs').classList.add('hidden');
        document.getElementById('resultado-auditoria-docs').classList.remove('hidden');
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-rose-600">Erro ao auditar: ${e.message}</td></tr>`;
    }
};

window.salvarCorrecaoDocs = async function(id, index) {
    const elCpf = document.getElementById(`audit-cpf-${index}`);
    const elSus = document.getElementById(`audit-sus-${index}`);
    const elTit = document.getElementById(`audit-titulo-${index}`);
    const elTel1 = document.getElementById(`audit-tel1-${index}`);
    const elTel2 = document.getElementById(`audit-tel2-${index}`);
    
    let updates = {};
    
    const checkLength = (el, name, len, exato) => {
        if(!el) return true;
        let val = el.value.trim();
        if(val === '') {
            updates[name] = ''; // Permite apagar o campo
            return true;
        }
        let cl = val.replace(/[^\d]+/g, '');
        if (exato) {
            if(cl.length !== len) {
                alert(`O campo ${name.toUpperCase()} deve ter exatamente ${len} números.`);
                return false;
            }
            if(name === 'cpf' && !window.isValidCPF(cl)) {
                alert(`O CPF informado é estruturalmente inválido.`);
                return false;
            }
        } else {
            // ex: telefone
            if(cl.length < len) {
                alert(`O campo ${name.toUpperCase()} deve ter pelo menos ${len} números.`);
                return false;
            }
        }
        updates[name] = val;
        return true;
    };
    
    if (!checkLength(elCpf, 'cpf', 11, true)) return;
    if (!checkLength(elSus, 'sus', 15, true)) return;
    if (!checkLength(elTit, 'titulo', 12, true)) return;
    if (!checkLength(elTel1, 'telefone1', 10, false)) return; // 10 pra fixo, 11 pra cel
    if (!checkLength(elTel2, 'telefone2', 10, false)) return;
    
    try {
        await window.updateDoc(window.doc(window.db, 'pacientes', id), updates);
        
        // Remove a linha da tabela com animação
        const tr = document.getElementById(`tr-audit-${index}`);
        tr.classList.add('bg-emerald-50', 'opacity-50');
        setTimeout(() => {
            tr.remove();
            let total = parseInt(document.getElementById('total-docs-invalidos').innerText);
            document.getElementById('total-docs-invalidos').innerText = Math.max(0, total - 1);
            if(total - 1 === 0) {
                document.getElementById('tabela-auditoria-docs-body').innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Tudo corrigido!</td></tr>';
                if(typeof lucide !== 'undefined') lucide.createIcons();
            }
        }, 500);
        
    } catch(e) {
        alert("Erro ao salvar: " + e.message);
    }
};

window.carregarAuditoria = async function() {
    const tbody = document.getElementById('tabela-auditoria-body');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center">Carregando logs de auditoria...</td></tr>';
    try {
        const q = window.query(window.collection(window.db, 'auditoria'), window.orderBy('data_hora', 'desc'), window.limit(50));
        const snap = await window.getDocs(q);
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-500">Nenhum registro encontrado.</td></tr>';
            return;
        }
        let html = '';
        snap.forEach(doc => {
            const data = doc.data();
            const dataHora = data.data_hora ? new Date(data.data_hora).toLocaleString() : '-';
            html += `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-3">${dataHora}</td>
                <td class="px-4 py-3">${data.usuario || '-'}</td>
                <td class="px-4 py-3 font-bold text-slate-700">${data.acao || '-'}</td>
                <td class="px-4 py-3 text-blue-600 font-bold">${data.modulo || '-'}</td>
                <td class="px-4 py-3 text-xs text-slate-500">${data.detalhes || '-'}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch(e) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-red-500">Erro: ${e.message}</td></tr>`;
    }
};

window.atualizarOpcoesSelectAdmin = function() {
    const sel = document.getElementById('admin-select-lista');
    if(!sel) return;
    
    const padroes = window.VALORES_PADRAO ? Object.keys(window.VALORES_PADRAO) : ['CATEGORIAS', 'ESPECIALIDADE', 'PROCEDIMENTO_EXAMES', 'PRIORIDADE', 'STATUS_ATENDIMENTO', 'STATUS_TITULO', 'LIDERANCA', 'LOCAL', 'PARCEIRO'];
    const extras = window.opcoesFiltros ? Object.keys(window.opcoesFiltros) : [];
    
    const chaves = new Set([...padroes, ...extras, 'INDICACAO']);
    const currentValue = sel.value;
    
    let html = '<option value="">Selecione uma lista...</option>';
    Array.from(chaves).sort().forEach(c => {
        html += `<option value="${c}">${c}</option>`;
    });
    
    sel.innerHTML = html;
    if(chaves.has(currentValue)) sel.value = currentValue;
};
