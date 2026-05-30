/**
 * js/ui.js
 * Funções de manipulação da interface (DOM) e lógica de visualização.
 */

// ============================================================================
// VARIíVEIS GLOBAIS DE UI
// ============================================================================
let listaProcedimentosTemp = []; // Armazena os itens adicionados antes de salvar
window.historicoAtualCache = []; // Armazena o histórico do munícipe atual para impressão

// ============================================================================
// 1. LOGIN E PERMISSÃƒâ€¢ES (FIREBASE AUTH)
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Escuta o estado de autenticação do Firebase
    if (window.auth) {
        window.auth.onAuthStateChanged(async user => {
            if (user) {
                // Usuário está logado
                const email = user.email.toLowerCase();
                let isAdmin = false;
                
                try {
                    const q = window.query(window.collection(window.db, "usuarios"), window.where("email", "==", email));
                    const snap = await window.getDocs(q);
                    
                    if (!snap.empty) {
                        const userData = snap.docs[0].data();
                        if (userData.perfil === 'ADMIN' || userData.role === 'ADMIN') {
                            isAdmin = true;
                        }
                    } else {
                        // Cria um usuário Visitante padrão caso não exista
                        await window.collection(window.db, "usuarios").add({
                            email: email,
                            perfil: 'VISITOR',
                            criadoEm: new Date().toISOString()
                        });
                    }
                } catch(e) {
                    console.error("Erro ao ler/criar perfil no Firestore:", e);
                }
                
                currentUserRole = isAdmin ? 'ADMIN' : 'VISITOR';
                iniciarSistema(isAdmin ? 'Administrador' : 'Visitante');
            } else {
                // Usuário não está logado
                const emailInput = document.getElementById('login_email');
                const pswInput = document.getElementById('login_senha');
                if (emailInput) emailInput.value = "";
                if (pswInput) pswInput.value = "";
                
                document.getElementById('view-login').classList.remove('hidden');
            }
        });
    }
});

function efetuarLogin() {
    const email = document.getElementById('login_email').value;
    const psw = document.getElementById('login_senha').value;
    const erroEl = document.getElementById('login-erro');
    const sucessoEl = document.getElementById('login-sucesso');
    
    erroEl.classList.add('hidden');
    sucessoEl.classList.add('hidden');

    if(!email || !psw) {
        erroEl.innerText = "Preencha e-mail e senha.";
        erroEl.classList.remove('hidden');
        return;
    }

    window.auth.signInWithEmailAndPassword(email, psw)
        .then(() => {
            sucessoEl.innerText = "Login realizado com sucesso! Aguarde...";
            sucessoEl.classList.remove('hidden');

            // Salvar no cache (localStorage) com token (base64 da senha para 1-click login)
            const emailLower = email.trim().toLowerCase();
            let recents = JSON.parse(localStorage.getItem('recentLoginsCache') || '[]');
            recents = recents.filter(r => r.email !== emailLower);
            recents.unshift({ email: emailLower, token: btoa(psw) });
            if(recents.length > 5) recents.pop();
            localStorage.setItem('recentLoginsCache', JSON.stringify(recents));
            
            if(typeof renderRecentLogins === 'function') renderRecentLogins();
        })
        .catch(error => {
            erroEl.innerText = "Erro ao fazer login: E-mail ou senha incorretos.";
            erroEl.classList.remove('hidden');
        });
}

function toggleRecuperarSenha() {
    const formLogin = document.getElementById('form-login');
    const formRec = document.getElementById('form-recuperar');
    const erroEl = document.getElementById('login-erro');
    const sucessoEl = document.getElementById('login-sucesso');
    
    erroEl.classList.add('hidden');
    sucessoEl.classList.add('hidden');

    if (formLogin.classList.contains('hidden')) {
        formLogin.classList.remove('hidden');
        formRec.classList.add('hidden');
    } else {
        formLogin.classList.add('hidden');
        formRec.classList.remove('hidden');
    }
}

function recuperarSenha() {
    const email = document.getElementById('recuperar_email').value;
    const erroEl = document.getElementById('login-erro');
    const sucessoEl = document.getElementById('login-sucesso');
    
    erroEl.classList.add('hidden');
    sucessoEl.classList.add('hidden');

    if(!email) {
        erroEl.innerText = "Por favor, informe seu e-mail.";
        erroEl.classList.remove('hidden');
        return;
    }

    window.auth.sendPasswordResetEmail(email)
        .then(() => {
            sucessoEl.innerText = "E-mail de redefinição de senha enviado! Verifique sua caixa de entrada (e o spam).";
            sucessoEl.classList.remove('hidden');
            document.getElementById('recuperar_email').value = "";
        })
        .catch(error => {
            erroEl.innerText = "Erro ao enviar e-mail. Verifique se o e-mail está correto.";
            erroEl.classList.remove('hidden');
        });
}

function iniciarSistema(roleName) {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('user-role-display').innerText = roleName;
    
    switchTab('dashboard');
    aplicarPermissoes();
}

function logout() {
    window.auth.signOut().then(() => {
        location.reload(); 
    });
}

function aplicarPermissoes() {
    const isVisitor = currentUserRole === 'VISITOR';
    
    const sidebarActions = document.getElementById('sidebar-actions');
    if(sidebarActions) {
        if (isVisitor) sidebarActions.classList.add('hidden');
        else sidebarActions.classList.remove('hidden');
    }

    const navImport = document.getElementById('nav-import');
    if(navImport) {
        if(currentUserRole === 'ADMIN') navImport.classList.remove('hidden');
        else navImport.classList.add('hidden');
    }

    const navAdmin = document.getElementById('nav-admin');
    if(navAdmin) {
        if(currentUserRole === 'ADMIN') navAdmin.classList.remove('hidden');
        else navAdmin.classList.add('hidden');
    }

    const botoesAcao = document.querySelectorAll('.btn-action, .btn-delete');
    botoesAcao.forEach(btn => {
        if(isVisitor) btn.classList.add('hidden');
        else {
            if(!btn.classList.contains('btn-delete')) {
                btn.classList.remove('hidden');
            }
        }
    });

    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(inp => {
        const id = inp.id || '';
        const isFilter = id.includes('filtro') || id.includes('busca') || id.includes('dash-filter') || id.includes('rel-filter') || id.includes('parc-filter') || id.includes('listagem-tipo');
        
        if(!isFilter) {
            if(isVisitor) inp.setAttribute('disabled', 'true');
            else inp.removeAttribute('disabled');
        } else {
            inp.removeAttribute('disabled');
        }
    });
}

// ============================================================================
// 2. NAVEGAÇÃƒÆ’O
// ============================================================================

function toggleMobileMenu(forceClose = false) {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar || !backdrop) return;
    
    const isHidden = sidebar.classList.contains('hidden');
    
    if (!isHidden || forceClose) {
        // Fechar
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
        backdrop.classList.add('hidden');
    } else {
        // Abrir
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
        backdrop.classList.remove('hidden');
    }
}

/**
 * Função switchTab atualizada:
 * Adicionado parâmetro 'shouldReset' (padrão true).
 * Se for false, não limpa o formulário ao trocar de aba (usado na edição).
 */
function switchTab(tabId, shouldReset = true) {
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Fecha o menu mobile ao navegar
    if (typeof toggleMobileMenu === 'function' && window.innerWidth < 768) {
        toggleMobileMenu(true);
    }

    const views = [
        'view-lista-pacientes', 'view-lista-atendimentos', 
        'view-form-paciente', 'view-form-atendimento', 
        'view-dashboard', 'view-relatorios', 'view-listagens',
        'view-parceiros', 'view-historico-paciente', 
        'view-detalhe-atendimento', 'view-importacao',
        'view-admin-panel'
    ];
    
    views.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById('view-' + tabId);
    if(target) target.classList.remove('hidden');
    
    // Só reseta se shouldReset for true
    if (shouldReset) {
        if (tabId === 'form-paciente') resetFormPaciente();
        if (tabId === 'form-atendimento') resetFormAtendimento();
    }
    
    if (tabId === 'lista-pacientes') {
        const listaVisible = !document.getElementById('subview-pacientes-lista').classList.contains('hidden');
        if(listaVisible && typeof carregarListaPacientes === 'function') carregarListaPacientes();
        else if (typeof carregarAniversarios === 'function') carregarAniversarios();
    }

    if (tabId === 'lista-atendimentos' && typeof carregarListaAtendimentos === 'function') carregarListaAtendimentos();
    if (tabId === 'dashboard' && typeof loadDashboard === 'function') loadDashboard();
    if (tabId === 'parceiros' && typeof initParceiros === 'function') initParceiros();
    if (tabId === 'relatorios' && typeof initRelatorios === 'function') initRelatorios();
    if (tabId === 'admin-panel' && typeof carregarListaUsuarios === 'function') carregarListaUsuarios();

    if(currentUserRole) aplicarPermissoes();
}

function voltarInicio() { 
    switchTab('lista-pacientes'); 
}

function alternarSubAbaPacientes(aba) {
    const listaDiv = document.getElementById('subview-pacientes-lista');
    const niverDiv = document.getElementById('subview-pacientes-niver');
    const btnLista = document.getElementById('tab-btn-lista');
    const btnNiver = document.getElementById('tab-btn-niver');
    const buscaContainer = document.getElementById('container-busca-pacientes');
    const filtroNiver = document.getElementById('container-filtro-niver');

    if (aba === 'lista') {
        listaDiv.classList.remove('hidden');
        niverDiv.classList.add('hidden');
        buscaContainer.classList.remove('hidden');
        filtroNiver.classList.add('hidden');
        filtroNiver.style.display = 'none'; 

        btnLista.className = "text-blue-600 border-b-2 border-blue-600 pb-2 transition-all";
        btnNiver.className = "text-slate-500 hover:text-blue-500 pb-2 transition-all flex items-center gap-1";
        
        if(typeof carregarListaPacientes === 'function') carregarListaPacientes();
    } else {
        listaDiv.classList.add('hidden');
        niverDiv.classList.remove('hidden');
        buscaContainer.classList.add('hidden');
        filtroNiver.classList.remove('hidden');
        filtroNiver.style.display = 'flex';

        btnNiver.className = "text-pink-600 border-b-2 border-pink-600 pb-2 transition-all flex items-center gap-1";
        btnLista.className = "text-slate-500 hover:text-blue-500 pb-2 transition-all";

        if(typeof carregarAniversarios === 'function') carregarAniversarios();
    }
}

// ============================================================================
// 3. MODAIS E MENSAGENS
// ============================================================================

function showMessage(msg, type) {
    const el = document.getElementById('system-message');
    if(!el) return;
    el.innerHTML = msg;
    el.className = `mb-4 p-4 rounded-lg border flex items-center gap-2 ${type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`;
    el.classList.remove('hidden');
    if(type !== 'error') setTimeout(() => el.classList.add('hidden'), 5000);
}

function abrirDetalheAtendimento(at) {
    const backdrop = document.getElementById('modal-backdrop-detalhe');
    if(!backdrop) return;
    const innerModal = document.getElementById('view-detalhe-atendimento');
    innerModal.classList.remove('hidden');
    backdrop.classList.remove('hidden');

    document.getElementById('det-paciente').innerText = at.nome_paciente || at.nome || '-';
    document.getElementById('det-cpf').innerText = `CPF: ${at.cpf_paciente || at.cpf || '-'}`;
    document.getElementById('det-status').innerText = at.status || 'PENDENTE';
    
    const statusEl = document.getElementById('det-status');
    statusEl.className = "px-3 py-1 rounded-full text-xs font-bold border shadow-sm " + 
        (at.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-700' : 
        (at.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 
        (at.status === 'CANCELADO' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600')));

    document.getElementById('det-data').innerText = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
    document.getElementById('det-tipo').innerText = (at.tipo_servico || '') + (at.tipo ? ` - ${at.tipo}` : '');
    document.getElementById('det-servico').innerText = at.especialidade || '-';
    document.getElementById('det-local').innerText = at.local || '-';
    document.getElementById('det-parceiro').innerText = at.parceiro || '-';
    
    document.getElementById('det-marcacao').innerText = at.data_marcacao ? at.data_marcacao.split('-').reverse().join('/') : '-';
    document.getElementById('det-risco').innerText = at.data_risco ? at.data_risco.split('-').reverse().join('/') : '-';
    document.getElementById('det-obs').innerText = at.obs_atendimento || 'Sem observações.';

    // írea de botões no rodapé do modal
    const footerModal = document.querySelector('#view-detalhe-atendimento .border-t');
    if (footerModal) {
        footerModal.innerHTML = `
            <div class="flex justify-end gap-3 w-full">
                <button onclick="fecharDetalhe()" class="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium">Fechar</button>
                <button id="btn-editar-detalhe" class="btn-action px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md flex items-center gap-2">
                    <i data-lucide="edit-3" class="w-4 h-4"></i> Editar Atendimento
                </button>
            </div>
        `;
        
        const btnEdit = document.getElementById('btn-editar-detalhe');
        if(currentUserRole === 'VISITOR') {
            btnEdit.classList.add('hidden');
        } else {
            btnEdit.onclick = function() {
                fecharDetalhe();
                abrirEdicaoAtendimento(at);
            };
        }
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function fecharDetalhe() {
    document.getElementById('modal-backdrop-detalhe').classList.add('hidden');
}

function abrirListaRelatorio(tipo, index) {
    if(!window.dadosRelatorioCache || !window.dadosRelatorioCache[tipo]) return;
    const dados = window.dadosRelatorioCache[tipo][index];
    if(!dados) return;

    document.getElementById('modal-lista-relatorio').classList.remove('hidden');
    document.getElementById('titulo-modal-relatorio').innerText = `${dados.nome} (${dados.qtd})`;
    const tbody = document.getElementById('tbody-modal-relatorio');
    tbody.innerHTML = '';

    dados.lista.forEach(at => {
        const tempId = 'rel_item_' + Math.random().toString(36).substr(2, 9);
        window[tempId] = at;
        const tr = document.createElement('tr');
        tr.className = "hover:bg-blue-50 cursor-pointer transition border-b border-slate-50";
        let badgeEspera = "bg-slate-100 text-slate-600";
        if(at.diasEspera > 90) badgeEspera = "bg-red-100 text-red-700";
        else if(at.diasEspera > 30) badgeEspera = "bg-orange-100 text-orange-700";
        else badgeEspera = "bg-green-100 text-green-700";

        tr.innerHTML = `
            <td class="px-6 py-3 font-mono text-xs text-slate-500">${at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-'}</td>
            <td class="px-6 py-3">
                <div class="font-bold text-slate-700 text-sm uppercase">${at.nome}</div>
                <div class="text-xs text-slate-400 flex gap-2"><span>${at.local || 'Local N/I'}</span><span class="text-slate-300">|</span><span>CPF: ${at.cpf || '...'}</span></div>
            </td>
            <td class="px-6 py-3 text-right"><span class="${badgeEspera} px-2 py-1 rounded text-xs font-bold">${at.diasEspera} dias</span></td>
        `;
        tr.onclick = () => {
            document.getElementById('modal-lista-relatorio').classList.add('hidden');
            abrirDetalheAtendimento(window[tempId]);
        };
        tbody.appendChild(tr);
    });
}

// ============================================================================
// 4. LOGICA DE PROCEDIMENTOS MÃƒÅ¡LTIPLOS & CONTROLE DE UI
// ============================================================================

function toggleModoEdicao(isEdicao) {
    const btnAdd = document.getElementById('btn-add-lista');
    const containerLista = document.getElementById('container-lista-procedimentos');
    const tituloForm = document.getElementById('titulo_form_atend');
    const btnSave = document.getElementById('btn-save-atendimento');
    
    if (isEdicao) {
        if(btnAdd) btnAdd.classList.add('hidden');
        if(containerLista) containerLista.classList.add('hidden');
        if(tituloForm) tituloForm.innerText = "Editar Atendimento";
        // No modo edição, o texto deve refletir atualização íºnica
        if(btnSave) btnSave.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5"></i> Atualizar Dados`;
    } else {
        if(btnAdd) btnAdd.classList.remove('hidden');
        if(containerLista) containerLista.classList.remove('hidden');
        if(tituloForm) tituloForm.innerText = "Novo Atendimento";
        if(btnSave) btnSave.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5"></i> Salvar Todos os Atendimentos`;
    }
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function adicionarProcedimentoNaLista() {
    const dataAbertura = document.getElementById('data_abertura').value;
    const prontuario = document.getElementById('field_prontuario').value;
    const tipoServico = document.getElementById('field_tipo_servico').value;
    const parceiro = document.getElementById('field_parceiro').value;
    const especialidade = document.getElementById('field_especialidade').value;
    const procedimento = document.getElementById('field_procedimento').value;
    const local = document.getElementById('field_local').value;
    const tipoDetalhe = document.getElementById('field_tipo').value;
    const valor = document.getElementById('field_valor').value;
    const dataMarcacao = document.getElementById('field_data_marcacao').value;
    const dataRisco = document.getElementById('field_data_risco').value;
    const dataConclusao = document.getElementById('field_data_conclusao').value;
    const status = document.getElementById('field_status_atendimento').value; 
    const obs = document.getElementById('field_obs_atendimento').value;

    if (!tipoServico && !procedimento && !especialidade) {
        alert("Preencha pelo menos o Tipo de Serviço, Especialidade ou Procedimento.");
        return;
    }

    const item = {
        tempId: Date.now(),
        data_abertura: dataAbertura,
        prontuario: prontuario,
        tipo_servico: tipoServico,
        parceiro: parceiro,
        especialidade: especialidade,
        procedimento: procedimento,
        local: local,
        tipo: tipoDetalhe,
        valor: valor,
        data_marcacao: dataMarcacao,
        data_risco: dataRisco,
        data_conclusao: dataConclusao,
        status: status || (dataConclusao ? 'CONCLUIDO' : 'PENDENTE'),
        obs_atendimento: obs
    };

    listaProcedimentosTemp.push(item);
    renderizarTabelaProcedimentos();
    
    // Limpa campos do card
    ['field_especialidade', 'field_procedimento', 'field_local', 'field_tipo', 
     'field_valor', 'field_data_marcacao', 'field_data_risco', 'field_data_conclusao', 
     'field_obs_atendimento', 'field_prontuario'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    
    ['especialidade', 'procedimento', 'local', 'tipo'].forEach(k => {
        const sel = document.getElementById(`sel_${k}`);
        if(sel) sel.value = "";
        cancelSelectNew(k);
    });
}

function renderizarTabelaProcedimentos() {
    const tbody = document.getElementById('lista-procedimentos-temp');
    if(!tbody) return; // Proteção se o elemento não existir
    tbody.innerHTML = '';

    if (listaProcedimentosTemp.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-400 italic">Nenhum item adicionado.</td></tr>';
        return;
    }

    listaProcedimentosTemp.forEach((item, index) => {
        const tr = document.createElement('tr');
        const dataFmt = item.data_marcacao ? item.data_marcacao.split('-').reverse().join('/') : (item.data_abertura ? item.data_abertura.split('-').reverse().join('/') : '-');
        const desc = `${item.tipo_servico || ''} ${item.especialidade || ''} ${item.procedimento || ''}`.trim();
        
        let statusColor = item.status === 'CONCLUIDO' ? 'text-emerald-600' : 'text-orange-600';

        tr.innerHTML = `
            <td class="px-4 py-2 font-mono text-xs">${dataFmt}</td>
            <td class="px-4 py-2 uppercase text-xs font-bold text-slate-700">${desc}</td>
            <td class="px-4 py-2 uppercase text-xs">${item.local || '-'}</td>
            <td class="px-4 py-2 text-xs font-bold ${statusColor}">${item.status}</td>
            <td class="px-4 py-2 text-right">
                <button type="button" onclick="removerItemTemp(${index})" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function removerItemTemp(index) {
    listaProcedimentosTemp.splice(index, 1);
    renderizarTabelaProcedimentos();
}

function checkStatusConclusao() {
    const dataConc = document.getElementById('field_data_conclusao').value;
    const selStatus = document.getElementById('sel_status_atendimento');
    const fieldStatus = document.getElementById('field_status_atendimento');
    
    if (dataConc) {
        if(selStatus) selStatus.value = 'CONCLUIDO';
        if(fieldStatus) fieldStatus.value = 'CONCLUIDO';
    } else {
        if(selStatus && selStatus.value === 'CONCLUIDO') {
            selStatus.value = 'PENDENTE';
            if(fieldStatus) fieldStatus.value = 'PENDENTE';
        }
    }
}

async function submitAtendimento(e) {
    if(e) e.preventDefault(); 
    const id = document.getElementById('atend_id_hidden').value;

    // --- MODO EDIÇÃƒÆ’O (Single) ---
    if (id) {
        const data = {
            id: id,
            cpf_paciente: document.getElementById('hidden_cpf').value,
            nome_paciente: document.getElementById('hidden_nome').value,
            data_abertura: document.getElementById('data_abertura').value,
            prontuario: document.getElementById('field_prontuario').value,
            tipo_servico: document.getElementById('field_tipo_servico').value,
            parceiro: document.getElementById('field_parceiro').value,
            especialidade: document.getElementById('field_especialidade').value,
            procedimento: document.getElementById('field_procedimento').value,
            local: document.getElementById('field_local').value,
            tipo: document.getElementById('field_tipo').value,
            valor: document.getElementById('field_valor').value,
            data_marcacao: document.getElementById('field_data_marcacao').value,
            data_risco: document.getElementById('field_data_risco').value,
            data_conclusao: document.getElementById('field_data_conclusao').value,
            status: document.getElementById('field_status_atendimento').value,
            obs_atendimento: document.getElementById('field_obs_atendimento').value
        };

        if(await sendData('registerService', data, 'loading-atendimento')) { 
            if(typeof resetFormAtendimento === 'function') resetFormAtendimento(); 
            switchTab('lista-atendimentos');
        }
        return;
    }

    // --- MODO CRIAÇÃƒÆ’O (Lote/Batch) ---
    if (typeof listaProcedimentosTemp === 'undefined' || listaProcedimentosTemp.length === 0) {
        alert("Adicione pelo menos um procedimento í  lista antes de salvar.");
        return;
    }

    const cpf = document.getElementById('hidden_cpf').value;
    const nome = document.getElementById('hidden_nome').value;

    if(!cpf && !nome) { alert("Busque o munícipe."); return; }

    // Limpeza de dados para evitar erros de payload
    const batch = listaProcedimentosTemp.map(item => {
        // Remove tempId e garante que todos os campos existam para evitar undefined
        const { tempId, ...cleanItem } = item;
        return {
            ...cleanItem,
            cpf_paciente: cpf,
            nome_paciente: nome
        };
    });

    if(await sendData('registerServiceBatch', batch, 'loading-atendimento')) { 
        // 1. LIMPEZA EXPLíCITA IMEDIATA PARA EVITAR DUPLICIDADE
        listaProcedimentosTemp = []; 
        renderizarTabelaProcedimentos(); // Atualiza a tabela visualmente para vazia

        // 2. Reseta o formulário (ISSO AGORA LIMPA CPF E NOME OCULTOS)
        if(typeof resetFormAtendimento === 'function') resetFormAtendimento(); 
        
        // 3. Foca no campo de busca para o próximo paciente (Fluxo contínuo)
        setTimeout(() => {
            const buscaEl = document.getElementById('busca_cpf');
            if(buscaEl) {
                // buscaEl.value = ""; // Já é limpo no resetFormAtendimento
                buscaEl.focus(); 
            }
        }, 100);
    }
}

// ============================================================================
// 5. FORMULíRIOS E PREENCHIMENTO
// 5. FORMULí RIOS E PREENCHIMENTO
// ============================================================================

function renderizarSelectsVazios() {
    if(typeof CONFIG_SELECTS === 'undefined') return;
    CONFIG_SELECTS.forEach(cfg => {
        const el = document.getElementById(cfg.container);
        if(el) {
            const fieldName = cfg.nameOverride || cfg.id;
            el.innerHTML = `
                <label class="label-field">${cfg.label}</label>
                <div class="relative">
                    <select id="sel_${cfg.id}" onchange="checkSelectNew('${cfg.id}')" class="input-field bg-white uppercase">
                        <option value="">Carregando...</option>
                    </select>
                    <div id="grp_new_${cfg.id}" class="hidden mt-1 animate-fade-in">
                        <div class="flex gap-1">
                            <input type="text" id="inp_${cfg.id}" placeholder="Digite novo..." class="switched-input flex-1 input-field uppercase">
                            <button type="button" onclick="cancelSelectNew('${cfg.id}')" class="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 font-bold" title="Cancelar">X</button>
                        </div>
                    </div>
                    <input type="hidden" name="${fieldName}" id="field_${cfg.id}">
                </div>`;
        }
    });
}

function checkSelectNew(id) {
    const sel = document.getElementById(`sel_${id}`);
    if (sel.value === '__NEW__') {
        sel.classList.add('hidden');
        document.getElementById(`grp_new_${id}`).classList.remove('hidden');
        document.getElementById(`inp_${id}`).focus();
        document.getElementById(`field_${id}`).value = '';
    } else {
        document.getElementById(`field_${id}`).value = sel.value;
    }
}

function cancelSelectNew(id) {
    const sel = document.getElementById(`sel_${id}`);
    sel.value = ""; 
    document.getElementById(`field_${id}`).value = "";
    sel.classList.remove('hidden'); 
    document.getElementById(`grp_new_${id}`).classList.add('hidden');
}

function preencherSelectInteligente(id, valor) {
    if(!valor) return;
    const sel = document.getElementById(`sel_${id}`);
    const hidden = document.getElementById(`field_${id}`);
    hidden.value = valor;
    sel.classList.remove('hidden');
    document.getElementById(`grp_new_${id}`).classList.add('hidden');
    
    let exists = false;
    for(let i=0; i<sel.options.length; i++) {
        if(sel.options[i].value.toUpperCase() === valor.toUpperCase()) {
            sel.selectedIndex = i;
            exists = true;
            break;
        }
    }
    if(!exists) {
        const novaOpcao = new Option(valor, valor, true, true);
        const lastIndex = sel.options.length - 1;
        if (lastIndex >= 0 && sel.options[lastIndex].value === '__NEW__') {
            sel.add(novaOpcao, sel.options[lastIndex]); 
        } else {
            sel.add(novaOpcao);
        }
        sel.value = valor;
    }
}

function renderizarTabelaPacientes(lista) {
    const tbody = document.getElementById('tabela-pacientes-body');
    tbody.innerHTML = '';
    if(lista.length === 0) { 
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>'; return; 
    }
    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors";
        const pStr = JSON.stringify(p).replace(/"/g, '&quot;');
        
        const btnEditClass = currentUserRole === 'VISITOR' ? 'hidden' : '';
        
        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-slate-800 uppercase" onclick="verHistoricoCompleto(${pStr})">${p.nome}</td>
            <td class="px-6 py-4 text-slate-600" onclick="verHistoricoCompleto(${pStr})">${p.cpf || '<span class="text-orange-500 text-xs font-bold px-2 py-1 bg-orange-100 rounded">SEM CPF</span>'}</td>
            <td class="px-6 py-4 hidden sm:table-cell text-slate-500" onclick="verHistoricoCompleto(${pStr})">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td>
            <td class="px-6 py-4 hidden md:table-cell uppercase text-slate-500" onclick="verHistoricoCompleto(${pStr})">${p.municipio||'-'}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); abrirAtendimentoDireto('${p.cpf}','${p.id}')" class="btn-action bg-emerald-100 text-emerald-700 p-2 rounded-lg mr-2 hover:bg-emerald-200 transition ${btnEditClass}" title="Novo Atendimento"><i data-lucide="plus" class="w-4 h-4"></i></button>
                <button onclick="event.stopPropagation(); abrirEdicaoDireta('${p.cpf}','${p.id}')" class="btn-action bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition ${btnEditClass}" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function renderizarTabelaAtendimentos(lista) {
    const tbody = document.getElementById('tabela-atendimentos-body');
    const contador = document.getElementById('contador-atendimentos');
    
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Nenhum atendimento encontrado.</td></tr>';
        if(contador) contador.innerText = "0 registros";
        return;
    }

    lista.forEach(at => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 transition-colors cursor-pointer group";
        
        const dataFmt = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
        
        let statusClass = "bg-slate-100 text-slate-600";
        if(at.status === 'CONCLUIDO') statusClass = "bg-emerald-100 text-emerald-700";
        if(at.status === 'PENDENTE') statusClass = "bg-amber-100 text-amber-700";
        if(at.status === 'CANCELADO') statusClass = "bg-red-100 text-red-700";

        const tempId = 'at_' + Math.random().toString(36).substr(2, 9);
        window[tempId] = at; 

        tr.onclick = () => abrirDetalheAtendimento(window[tempId]);

        tr.innerHTML = `
            <td class="px-4 py-4 font-mono text-xs text-slate-500">${dataFmt}</td>
            <td class="px-4 py-4">
                <div class="font-bold text-slate-700 text-sm uppercase">${at.nome_paciente || at.nome || 'Sem Nome'}</div>
                <div class="text-xs text-slate-400 font-mono">${at.cpf_paciente || at.cpf || '...'}</div>
            </td>
            <td class="px-4 py-4 text-xs uppercase text-slate-600 font-bold">${at.tipo_servico || '-'}</td>
            <td class="px-4 py-4 text-xs uppercase text-slate-500">${at.especialidade || '-'}</td>
            <td class="px-4 py-4 text-xs uppercase text-slate-500">${at.procedimento || '-'}</td>
            <td class="px-4 py-4">
                <span class="${statusClass} px-2 py-1 rounded text-[10px] font-bold uppercase border border-black/5">${at.status}</span>
            </td>
            <td class="px-4 py-4 text-right">
                <button onclick="event.stopPropagation(); abrirEdicaoAtendimentoId('${at.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded border border-transparent hover:border-blue-200 transition" title="Editar">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if(contador) contador.innerText = `${lista.length} registros exibidos`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function renderizarTorreGenero(pacientes) {
    let masc = 0, fem = 0;
    pacientes.forEach(p => {
        const s = p.sexo ? p.sexo.toUpperCase() : '';
        if(s === 'M' || s === 'MASCULINO') masc++;
        else if(s === 'F' || s === 'FEMININO') fem++;
    });
    const total = masc + fem || 1;
    const pMasc = Math.round((masc / total) * 100);
    const pFem = Math.round((fem / total) * 100);
    document.getElementById('val-masc').innerText = masc;
    document.getElementById('val-fem').innerText = fem;
    setTimeout(() => {
        const tMasc = document.getElementById('tower-masc');
        const tFem = document.getElementById('tower-fem');
        if(tMasc) tMasc.style.height = `${pMasc}%`;
        if(tFem) tFem.style.height = `${pFem}%`;
    }, 100);
}

function resetFormPaciente() {
    document.getElementById('frmPaciente').reset();
    document.getElementById('paciente_id_hidden').value = "";
    document.getElementById('msg_cpf_paciente').innerText = '';
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    document.getElementById('resto-form-paciente').classList.add('hidden');
    document.getElementById('btn-imprimir').classList.add('hidden');
    
    const btnDelete = document.getElementById('btn-delete-paciente');
    if(btnDelete) btnDelete.classList.add('hidden');
    
    CONFIG_SELECTS.forEach(cfg => {
        const sel = document.getElementById(`sel_${cfg.id}`);
        if(sel && cfg.id !== 'status_atendimento') sel.value = "";
        cancelSelectNew(cfg.id);
    });
}

/**
 * Função resetFormAtendimento atualizada:
 * Aceita parâmetro opcional 'preserveSearch' para manter os dados de busca/paciente
 * enquanto limpa o restante do formulário.
 */
function resetFormAtendimento(preserveSearch = false) {
    const frm = document.getElementById('frmAtendimento');
    
    // Se não for para preservar a busca, faz o reset total padrão
    if (!preserveSearch) {
        if(frm) frm.reset();
        document.getElementById('resultado_busca').innerText = '';
        
        // Limpa campos ocultos e visuais de paciente
        document.getElementById('hidden_cpf').value = "";
        document.getElementById('hidden_nome').value = "";
        document.getElementById('busca_cpf').value = ""; 
        
        // Esconde formulário
        document.getElementById('resto-form-atendimento').classList.add('hidden');
    } else {
        // Reset Parcial: Limpa APENAS os campos do formulário de procedimentos
        // Mantendo o cabeçalho do paciente (search e hidden inputs) intactos
        
        // Limpa lista temporária
        listaProcedimentosTemp = [];
        renderizarTabelaProcedimentos();
        
        // Limpa campos específicos do "card" de adicionar procedimento
        const inputsToClear = document.querySelectorAll('#resto-form-atendimento input, #resto-form-atendimento select, #resto-form-atendimento textarea');
        inputsToClear.forEach(el => {
            if (el.type !== 'hidden' && el.type !== 'button') {
                el.value = '';
            }
        });

        // Reseta selects customizados
        if(typeof CONFIG_SELECTS !== 'undefined') {
            CONFIG_SELECTS.forEach(cfg => {
                const sel = document.getElementById(`sel_${cfg.id}`);
                if(sel) sel.value = "";
                if(typeof cancelSelectNew === 'function') cancelSelectNew(cfg.id);
            });
        }
    }
    
    // Reset de campos comuns
    document.getElementById('atend_id_hidden').value = "";
    
    const titulo = document.getElementById('titulo_form_atend');
    if(titulo) titulo.innerText = "Novo Atendimento";
    
    const btnTxt = document.getElementById('txt_btn_atend');
    if(btnTxt) btnTxt.innerText = "Salvar Todos os Atendimentos";
    
    const btnDelete = document.getElementById('btn-delete-atendimento');
    if(btnDelete) btnDelete.classList.add('hidden');
    
    const dataAb = document.getElementById('data_abertura');
    if(dataAb) dataAb.valueAsDate = new Date();
    
    // RESTAURA MODO PADRÃƒÆ’O (NOVO)
    toggleModoEdicao(false);

    // RESET DO PRONTUíRIO (Volta a ficar bloqueado)
    const prontuarioInput = document.getElementById('field_prontuario');
    if(prontuarioInput) {
        prontuarioInput.value = '';
        prontuarioInput.disabled = true;
        prontuarioInput.classList.add('bg-slate-100', 'cursor-not-allowed');
        prontuarioInput.classList.remove('bg-white');
        prontuarioInput.placeholder = "Selecione Local HO...";
    }

    const inpConclusao = document.getElementById('field_data_conclusao');
    if(inpConclusao) {
        inpConclusao.onchange = checkStatusConclusao;
    }
}

function mostrarFormularioPaciente(isEdit, dados = null) {
    document.getElementById('resto-form-paciente').classList.remove('hidden');
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    
    const btnPrint = document.getElementById('btn-imprimir');
    const btnDelete = document.getElementById('btn-delete-paciente');
    
    if(isEdit) {
        btnPrint.classList.remove('hidden');
        if(currentUserRole === 'ADMIN') {
            btnDelete.classList.remove('hidden');
        } else {
            btnDelete.classList.add('hidden');
        }
    } else {
        btnPrint.classList.add('hidden');
        btnDelete.classList.add('hidden');
    }

    if(isEdit && dados) {
        document.getElementById('paciente_id_hidden').value = dados.id;
        
        const fields = [
            'nome','apelido','familia','rg','nascimento','sexo','tel1','tel2',
            'cep','logradouro','municipio_titulo','zona','secao','obs',
            'sus', 'referencia', 'lideranca'
        ];
        
        fields.forEach(k => { const el = document.getElementById(`field_${k}`); if(el) el.value = dados[k] || ''; });
        
        ['municipio','bairro','status_titulo', 'indicacao'].forEach(k => { 
            let val = dados[k];
            if (k === 'municipio') val = val || dados.cidade || dados.Municipio || dados.Cidade;
            if (k === 'bairro') val = val || dados.Bairro;
            if (k === 'status_titulo') val = val || dados.situacao_eleitoral || dados.situacaoEleitoral || dados.municipio_titulo;
            if (k === 'indicacao') val = val || dados.quem_indicou || dados.QuemIndicou;
            preencherSelectInteligente(k, val); 
        });
        
        const elTitulo = document.getElementById('field_titulo'); if(elTitulo) elTitulo.value = dados.titulo || '';
        const elLogra = document.getElementById('field_logradouro'); if(elLogra) elLogra.value = dados.logradouro || dados.endereco || dados.Endereco || dados.Logradouro || ''; 
    }
}

function abrirEdicaoDireta(cpf, id) {
    // Passa false para NÃƒÆ’O resetar o formulário automaticamente, pois vamos popular
    switchTab('form-paciente', false);
    const inputCpf = document.getElementById('paciente_cpf_check');
    const cpfStr = cpf ? String(cpf) : '';
    inputCpf.value = cpfStr;
    
    if (id) {
        if(typeof verificarPorId === 'function') verificarPorId(id);
    } else if (cpfStr && cpfStr.length > 4) {
        if(typeof verificarCpfInicial === 'function') verificarCpfInicial();
    }
}

function abrirEdicaoAtendimento(at) {
    // CORREÇÃƒÆ’O CRíTICA: Passa false para NÃƒÆ’O resetar o formulário
    switchTab('form-atendimento', false);
    
    // Reset TOTAL pois estamos carregando um atendimento existente completo
    resetFormAtendimento(false);

    // ATIVA MODO DE EDIÇÃƒÆ’O (Esconde lista e botões de lote)
    toggleModoEdicao(true);

    document.getElementById('atend_id_hidden').value = at.id;
    document.getElementById('busca_cpf').value = at.cpf_paciente || at.cpf;
    document.getElementById('hidden_cpf').value = at.cpf_paciente || at.cpf;
    document.getElementById('hidden_nome').value = at.nome_paciente || at.nome;
    document.getElementById('resultado_busca').innerHTML = `<span class="text-blue-700 font-bold flex items-center gap-1"><i data-lucide="user" class="w-4 h-4"></i> Editando: ${at.nome_paciente || at.nome}</span>`;
    document.getElementById('resto-form-atendimento').classList.remove('hidden');

    const btnDelete = document.getElementById('btn-delete-atendimento');
    if(currentUserRole === 'ADMIN') {
        btnDelete.classList.remove('hidden');
    } else {
        btnDelete.classList.add('hidden');
    }

    document.getElementById('data_abertura').value = at.data_abertura || '';
    
    // LOGICA DO PRONTUíRIO NA EDIÇÃƒÆ’O
    const prontuarioInput = document.getElementById('field_prontuario');
    const localVal = at.local ? at.local.toUpperCase() : '';
    
    if(localVal === 'HO') {
        prontuarioInput.disabled = false;
        prontuarioInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
        prontuarioInput.classList.add('bg-white');
        prontuarioInput.value = at.prontuario || '';
    } else {
        prontuarioInput.disabled = true;
        prontuarioInput.classList.add('bg-slate-100', 'cursor-not-allowed');
        prontuarioInput.value = '';
    }

    document.getElementById('field_tipo').value = at.tipo || ''; 
    document.getElementById('field_data_marcacao').value = at.data_marcacao || '';
    document.getElementById('field_data_risco').value = at.data_risco || '';
    document.getElementById('field_data_conclusao').value = at.data_conclusao || '';
    document.getElementById('field_valor').value = at.valor || '';
    document.getElementById('field_obs_atendimento').value = at.obs_atendimento || '';

    ['tipo_servico','parceiro','especialidade','procedimento','local','tipo','status_atendimento'].forEach(k => {
        const val = k === 'status_atendimento' ? at.status : at[k];
        preencherSelectInteligente(k, val);
    });
    
    const inpConclusao = document.getElementById('field_data_conclusao');
    if(inpConclusao) inpConclusao.onchange = checkStatusConclusao;
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
    if(currentUserRole === 'VISITOR') aplicarPermissoes();
}

function abrirEdicaoAtendimentoId(id) {
    // CORREÇÃƒÆ’O CRíTICA: Converte para String para garantir comparação correta
    const at = todosAtendimentos.find(x => String(x.id) === String(id));
    if(at) abrirEdicaoAtendimento(at);
}

/**
 * FUNÇÃƒÆ’O CORRIGIDA: Abrir Novo Atendimento Direto
 * Garante que o formulário seja limpo, mas preserva e define o paciente alvo.
 */
function abrirAtendimentoDireto(cpf, id) {
    if(!cpf || cpf.length < 5) { alert("Munícipe sem CPF. Edite o cadastro primeiro."); abrirEdicaoDireta(cpf, id); return; }
    
    // 1. Alterna para a aba SEM resetar automaticamente (false)
    switchTab('form-atendimento', false);
    
    // 2. Chama o reset em modo "preserveSearch" = false (Reset Total)
    // Para garantir que não haja lixo de outros atendimentos.
    resetFormAtendimento(false);

    // 3. Preenchimento DO CAMPO DE BUSCA (Explicitamente após o reset)
    const inputBusca = document.getElementById('busca_cpf');
    if(inputBusca) inputBusca.value = cpf;

    // Tenta achar o paciente na memória local (todosPacientes)
    let paciente = null;
    if (typeof todosPacientes !== 'undefined' && Array.isArray(todosPacientes)) {
        const cpfLimpo = String(cpf).replace(/\D/g, '');
        paciente = todosPacientes.find(p => String(p.id) === String(id)) || 
                   todosPacientes.find(p => String(p.cpf).replace(/\D/g, '') === cpfLimpo);
    }

    if (paciente) {
        // PREENCHIMENTO DIRETO (Memória)
        const resDiv = document.getElementById('resultado_busca');
        const hiddenCpf = document.getElementById('hidden_cpf');
        const hiddenNome = document.getElementById('hidden_nome');
        const restoForm = document.getElementById('resto-form-atendimento');

        if(resDiv) resDiv.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${paciente.nome}</span>`;
        if(hiddenCpf) hiddenCpf.value = paciente.cpf || cpf;
        if(hiddenNome) hiddenNome.value = paciente.nome;
        if(restoForm) restoForm.classList.remove('hidden');
        
        // Foca no primeiro campo íºtil
        const dataInput = document.getElementById('data_abertura');
        if(dataInput) dataInput.focus();
        
    } else {
        // BUSCA NA API (Fallback)
        if(typeof buscarPacienteParaAtendimento === 'function') {
            buscarPacienteParaAtendimento();
        }
    }
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

async function submitPaciente(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.cpf = document.getElementById('paciente_cpf_check').value;
    if(!data.cpf || data.cpf.length < 5) { alert("CPF obrigatório."); return; }
    
    if(await sendData('registerPatient', data, 'loading-paciente')) { 
        if(typeof resetFormPaciente === 'function') resetFormPaciente(); 
        if(typeof voltarInicio === 'function') voltarInicio(); 
    }
}

function calcularDataRisco() {
    const dataMarcacao = document.getElementById('field_data_marcacao').value;
    const campoEspec = document.getElementById('field_especialidade');
    if(!dataMarcacao) return;

    // Ajuste para evitar fuso horário que volta um dia
    const [ano, mes, dia] = dataMarcacao.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);

    let meses = 3; 
    if(campoEspec && campoEspec.value && campoEspec.value.toUpperCase().includes("OFTALMOLOGIA")) meses = 6;
    d.setMonth(d.getMonth() + meses);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    document.getElementById('field_data_risco').value = `${yyyy}-${mm}-${dd}`;
}

// ============================================================================
// 6. FUNÇÕES DE EXCLUSÃO (UI HANDLERS)
// ============================================================================

function confirmarExclusaoPaciente() {
    if(!pacienteAtual) return;
    const confirmacao = confirm(`ATENÇÃO: Você está prestes a excluir o munícipe ${pacienteAtual.nome}.\n\nISSO APAGARÁ TAMBÉM TODOS OS ATENDIMENTOS DELE.\n\nTem certeza absoluta?`);
    if(confirmacao) {
        if(typeof excluirPacienteAPI === 'function') excluirPacienteAPI(pacienteAtual.id, pacienteAtual.cpf);
    }
}

function confirmarExclusaoAtendimento() {
    const id = document.getElementById('atend_id_hidden').value;
    if(!id) return;
    const confirmacao = confirm("Tem certeza que deseja excluir este atendimento?");
    if(confirmacao) {
        if(typeof excluirAtendimentoAPI === 'function') excluirAtendimentoAPI(id);
    }
}

// ============================================================================
// 7. RELATÓRIO ELEITORAL (NOVO)
// ============================================================================

function abrirRelatorioEleitoral() {
    if (!dashboardRawData || !dashboardRawData.pacientes) {
        alert("Dados do dashboard ainda não carregados. Aguarde um momento.");
        return;
    }

    const modal = document.getElementById('modal-relatorio-eleitoral');
    modal.classList.remove('hidden');

    const statusSet = new Set();
    dashboardRawData.pacientes.forEach(p => {
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        statusSet.add(st);
    });
    
    const sel = document.getElementById('filtro-modal-eleitoral');
    sel.innerHTML = '<option value=">Todos os Status</option>';
    Array.from(statusSet).sort().forEach(s => {
        sel.innerHTML += `<option value="${s}">${s}</option>`;
    });

    filtrarRelatorioEleitoral();
}

function filtrarRelatorioEleitoral() {
    const filtro = document.getElementById('filtro-modal-eleitoral').value;
    const tbody = document.getElementById('tbody-relatorio-eleitoral');
    const theadTr = document.querySelector('#modal-relatorio-eleitoral thead tr');
    
    if(theadTr && theadTr.children.length === 4) {
        const thAcao = document.createElement('th');
        thAcao.className = "px-6 py-3 text-right";
        thAcao.innerText = "Ação";
        theadTr.appendChild(thAcao);
    }

    tbody.innerHTML = '';

    const lista = dashboardRawData.pacientes.filter(p => {
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        if (filtro && st !== filtro) return false;
        return true;
    });

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>';
        document.getElementById('contador-eleitoral').innerText = '0 registros';
        return;
    }

    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-blue-50 transition-colors";
        
        let statusColor = "bg-slate-100 text-slate-600";
        const st = p.status_titulo ? p.status_titulo.toUpperCase() : 'N/I';
        if (st.includes('REGULAR')) statusColor = "bg-green-100 text-green-700";
        else if (st.includes('CANCELADO') || st.includes('SUSPENSO')) statusColor = "bg-red-100 text-red-700";
        else if (st.includes('TRANSFERIDO')) statusColor = "bg-orange-100 text-orange-700";

        const pStr = JSON.stringify(p).replace(/"/g, '&quot;');

        const btnEditClass = currentUserRole === 'VISITOR' ? 'hidden' : '';

        tr.innerHTML = `
            <td class="px-6 py-3">
                <div class="font-bold text-slate-800 text-sm uppercase cursor-pointer hover:text-blue-600" onclick="verHistoricoCompleto(${pStr})">${p.nome}</div>
                <div class="text-xs text-slate-400 font-mono">${p.cpf || 'SEM CPF'}</div>
            </td>
            <td class="px-6 py-3 text-sm text-slate-600">
                <div class="flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3"></i> ${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</div>
            </td>
            <td class="px-6 py-3 text-sm text-slate-600">
                <div class="uppercase text-xs font-bold">${p.bairro || '-'}</div>
                <div class="text-[10px] text-slate-400">Bairro</div>
            </td>
            <td class="px-6 py-3 text-center">
                <span class="${statusColor} px-2 py-1 rounded text-[10px] font-bold uppercase border border-black/5">${st}</span>
            </td>
            <td class="px-6 py-3 text-right">
                <button onclick="document.getElementById('modal-relatorio-eleitoral').classList.add('hidden'); abrirEdicaoDireta('${p.cpf}', '${p.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded border border-transparent hover:border-blue-200 transition ${btnEditClass}" title="Editar Cadastro">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('contador-eleitoral').innerText = `${lista.length} registros encontrados`;
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

function imprimirRelatorioEleitoral() {
    if (!dashboardRawData || !dashboardRawData.pacientes) {
        alert("Aguarde o carregamento dos dados.");
        return;
    }

    const printArea = document.getElementById('printable-area');
    if (!printArea) return;

    const filtro = document.getElementById('filtro-modal-eleitoral').value;
    
    const lista = dashboardRawData.pacientes.filter(p => {
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        if (filtro && st !== filtro) return false;
        return true;
    });

    const tituloRelatorio = filtro ? `Relatório Eleitoral - Status: ${filtro}` : 'Relatório Eleitoral - Geral';

    let html = `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #333;">
            <div style="text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; padding-bottom: 10px;">
                <h1 style="margin: 0; font-size: 18px; text-transform: uppercase;">${tituloRelatorio}</h1>
                <p style="margin: 5px 0 0; font-size: 12px; color: #666;">Connecta | Total: ${lista.length} registros | Emissão: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background-color: #f1f5f9; text-align: left;">
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">NOME / CPF</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">CONTATO</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc;">LOCALIZAÇÃƒÆ’O</th>
                        <th style="padding: 8px 5px; border-bottom: 1px solid #ccc; text-align: center;">STATUS</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (lista.length === 0) {
        html += `<tr><td colspan="4" style="padding: 15px; text-align: center; color: #666;">Nenhum registro encontrado.</td></tr>`;
    } else {
        lista.forEach((p, index) => {
            const bg = index % 2 === 0 ? '#fff' : '#f8fafc';
            const st = p.status_titulo ? p.status_titulo.toUpperCase() : 'N/I';
            
            html += `
                <tr style="background-color: ${bg}; border-bottom: 1px solid #eee;">
                    <td style="padding: 6px 5px;">
                        <strong style="text-transform: uppercase;">${p.nome}</strong><br>
                        ${p.cpf || '-'}
                    </td>
                    <td style="padding: 6px 5px;">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td>
                    <td style="padding: 6px 5px; text-transform: uppercase;">${p.bairro || '-'}</td>
                    <td style="padding: 6px 5px; text-align: center; font-weight: bold;">${st}</td>
                </tr>
            `;
        });
    }

    html += `</tbody></table>
        <div style="margin-top: 20px; font-size: 10px; text-align: right; color: #999;">Sistema de Gestão Interna</div>
    </div>`;

    printArea.innerHTML = html;
    window.print();
}

/**
 * Função para imprimir a Ficha do Munícipe (Preenchida)
 * Esta função deve ser chamada pelos botões "Imprimir" no formulário e no histórico.
 */
function imprimirFicha() {
    // Verificação de Segurança Adicional
    const btnHist = document.getElementById('btn-imprimir-historico');
    if (btnHist && btnHist.disabled) {
        // Se o botão estiver desabilitado, impede a execução mesmo que chamada via console
        return;
    }

    const printArea = document.getElementById('printable-area');
    if(!printArea) return;

    let p = pacienteAtual;
    
    // Se estiver na visualização de histórico, usa o objeto de histórico (prioridade)
    const viewHist = document.getElementById('view-historico-paciente');
    if (!viewHist.classList.contains('hidden') && typeof histPacienteAtual !== 'undefined' && histPacienteAtual) {
        p = histPacienteAtual;
    }

    // Se ainda não tiver paciente (ex: impressão direta do formulário de cadastro antes de verificar ID), tenta pegar dos inputs
    if(!p) {
        const nomeInput = document.getElementById('field_nome');
        if(nomeInput && nomeInput.value) {
            p = {
                nome: nomeInput.value,
                cpf: document.getElementById('paciente_cpf_check').value,
                rg: document.getElementById('field_rg').value,
                nascimento: document.getElementById('field_nascimento').value,
                tel: document.getElementById('field_tel1').value,
                tel2: document.getElementById('field_tel2').value,
                cep: document.getElementById('field_cep').value,
                logradouro: document.getElementById('field_logradouro').value,
                bairro: document.getElementById('field_bairro') ? document.getElementById('field_bairro').value : '',
                municipio: document.getElementById('field_municipio') ? document.getElementById('field_municipio').value : '',
                referencia: document.getElementById('field_referencia').value,
                apelido: document.getElementById('field_apelido').value,
                status_titulo: document.getElementById('field_status_titulo') ? document.getElementById('field_status_titulo').value : '',
                zona: document.getElementById('field_zona').value,
                secao: document.getElementById('field_secao').value,
                lideranca: document.getElementById('field_lideranca') ? document.getElementById('field_lideranca').value : '',
                indicacao: document.getElementById('field_indicacao') ? document.getElementById('field_indicacao').value : '',
                obs: document.getElementById('field_obs').value
            };
        }
    }

    if(!p) {
        alert("Nenhum munícipe selecionado para impressão.");
        return;
    }

    // Estilos inline (mesmos da ficha em branco para consistência)
    const styleLabel = "display: block; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;";
    const styleValue = "border-bottom: 1px solid #333; min-height: 20px; width: 100%; margin-bottom: 10px; font-size: 12px; font-weight: bold; color: #000; padding-bottom: 2px;";
    const styleSection = "margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 15px;";
    const styleTitle = "margin-top: 0; font-size: 14px; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;";
    // Estilos da Tabela de Histórico
    const styleTable = "width: 100%; border-collapse: collapse; font-size: 10px;";
    const styleTh = "border-bottom: 1px solid #000; text-align: left; padding: 4px; font-weight: bold; text-transform: uppercase; font-size: 9px;";
    const styleTd = "border-bottom: 1px solid #eee; padding: 4px; font-size: 9px;";
    const styleTdRight = "border-bottom: 1px solid #eee; padding: 4px; text-align: right; font-size: 9px;";

    const safe = (val) => val || '-';
    const money = (val) => {
        if(!val) return 'R$ 0,00';
        return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Gera o HTML do Histórico se houver dados em cache
    let historyHtml = '';
    if (window.historicoAtualCache && window.historicoAtualCache.length > 0) {
        let totalGeral = 0;

        historyHtml += `
            <div style="${styleSection}">
                <h2 style="${styleTitle}">HISTÓRICO DE ATENDIMENTOS</h2>
                <table style="${styleTable}">
                    <thead>
                        <tr>
                            <th style="${styleTh} width: 60px;">Data</th>
                            <th style="${styleTh} width: 70px;">Status</th>
                            <th style="${styleTh}">Classificação</th>
                            <th style="${styleTh}">Procedimento / Especialidade</th>
                            <th style="${styleTh}">Local / Prontuário</th>
                            <th style="${styleTh}">Agendamento</th>
                            <th style="${styleTh} text-align: right; width: 70px;">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        window.historicoAtualCache.forEach(h => {
            const dataFmt = h.data_abertura ? h.data_abertura.split('-').reverse().join('/') : '-';
            const catTipo = `${h.tipo_servico || ''}<br><span style="color:#666; font-size:8px">${h.tipo || ''}</span>`;
            const espProc = `<b>${h.especialidade || ''}</b><br>${h.procedimento || ''}`;
            const localPront = `<b>${h.local || '-'}</b>${h.prontuario ? `<br>Pront: ${h.prontuario}` : ''}`;
            
            let agendamento = '-';
            if (h.data_marcacao) agendamento = `Marc: ${h.data_marcacao.split('-').reverse().join('/')}`;
            if (h.data_conclusao) agendamento += `<br>Conc: ${h.data_conclusao.split('-').reverse().join('/')}`;

            const valorFloat = parseFloat(h.valor) || 0;
            totalGeral += valorFloat;

            historyHtml += `
                <tr>
                    <td style="${styleTd}">${dataFmt}</td>
                    <td style="${styleTd}"><b>${h.status || '-'}</b></td>
                    <td style="${styleTd}">${catTipo}</td>
                    <td style="${styleTd}">${espProc}</td>
                    <td style="${styleTd}">${localPront}</td>
                    <td style="${styleTd}">${agendamento}</td>
                    <td style="${styleTdRight}">${money(valorFloat)}</td>
                </tr>
                ${h.obs_atendimento ? `<tr><td colspan="7" style="border-bottom: 1px solid #eee; padding: 2px 4px 4px 4px; color: #555; font-style: italic; font-size: 9px; background-color: #fcfcfc;">Obs: ${h.obs_atendimento}</td></tr>` : ''}
            `;
        });

        // Linha de Total
        historyHtml += `
                <tr style="background-color: #f8fafc; font-weight: bold;">
                    <td colspan="6" style="padding: 8px; text-align: right; border-top: 2px solid #333;">TOTAL GERAL:</td>
                    <td style="padding: 8px; text-align: right; border-top: 2px solid #333; color: #2563eb;">${money(totalGeral)}</td>
                </tr>
        `;

        historyHtml += `
                    </tbody>
                </table>
            </div>
        `;
    }

    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; max-width: 100%;">
            
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">Ficha Cadastral</h1>
                <p style="margin: 2px 0 0; color: #555; font-size: 12px;">Connecta</p>
            </div>

            <div style="${styleSection}">
                <h2 style="${styleTitle}">DADOS DO MUNíCIPE</h2>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Nome Completo</span>
                        <div style="${styleValue}">${safe(p.nome)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CPF</span>
                        <div style="${styleValue}">${safe(p.cpf)}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Nasc.</span>
                        <div style="${styleValue}">${p.nascimento ? p.nascimento.split('-').reverse().join('/') : '-'}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">RG</span>
                        <div style="${styleValue}">${safe(p.rg)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 1</span>
                        <div style="${styleValue}">${safe(p.tel || p.tel1)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 2</span>
                        <div style="${styleValue}">${safe(p.tel2)}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CEP</span>
                        <div style="${styleValue}">${safe(p.cep)}</div>
                    </div>
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Endereço</span>
                        <div style="${styleValue}">${safe(p.logradouro)}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Bairro</span>
                        <div style="${styleValue}">${safe(p.bairro)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Município</span>
                        <div style="${styleValue}">${safe(p.municipio)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Ponto de Referência</span>
                        <div style="${styleValue}">${safe(p.referencia)}</div>
                    </div>
                </div>
                
                 <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Referência (Apelido)</span>
                        <div style="${styleValue}">${safe(p.apelido)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Situação Eleitoral</span>
                        <div style="${styleValue}">${safe(p.status_titulo)}</div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Zona / Seção</span>
                        <div style="${styleValue}">${safe(p.zona)} / ${safe(p.secao)}</div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Liderança (É Líder?)</span>
                        <div style="${styleValue}">${safe(p.lideranca)}</div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Quem Indicou (Indicação)</span>
                        <div style="${styleValue}">${safe(p.indicacao)}</div>
                    </div>
                </div>
                
                <div style="margin-top: 10px;">
                    <span style="${styleLabel}">Observações</span>
                    <div style="${styleValue} height: auto; min-height: 40px;">${safe(p.obs)}</div>
                </div>
            </div>

            ${historyHtml}
            
            <div style="text-align: center; font-size: 10px; color: #888; margin-top: 20px;">
                Impresso em ${new Date().toLocaleString('pt-BR')} - Sistema de Gestão Interna
            </div>
        </div>
    `;

    printArea.innerHTML = html;
    window.print();
}

function imprimirFichaEmBranco() {
    const printArea = document.getElementById('printable-area');
    if(!printArea) return;

    // Estilos inline para garantir a formatação na impressão
    const styleLabel = "display: block; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;";
    const styleInput = "border-bottom: 1px solid #333; height: 20px; width: 100%; margin-bottom: 10px;";
    const styleSection = "margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 15px;";
    const styleTitle = "margin-top: 0; font-size: 14px; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;";

    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; max-width: 100%;">
            
            <!-- CABEÇALHO -->
            <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase;">Ficha de Atendimento</h1>
                <p style="margin: 2px 0 0; color: #555; font-size: 12px;">Connecta</p>
            </div>

            <!-- DADOS PESSOAIS -->
            <div style="${styleSection}">
                <h2 style="${styleTitle}">1. DADOS DO MUNíCIPE</h2>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Nome Completo</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CPF</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Nasc.</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">RG</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 1</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Telefone 2</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">CEP</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 3;">
                        <span style="${styleLabel}">Endereço (Rua, Nº, Compl)</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Bairro</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Município</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Situação Eleitoral</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Zona / Seção</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Local de Votação</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>
            </div>

            <!-- DADOS DO SERVIÇO -->
            <div style="${styleSection}">
                <h2 style="${styleTitle}">2. DADOS DO SERVIÇO / ATENDIMENTO</h2>
                
                <div style="display: flex; gap: 15px;">
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Abertura</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Liderança / Indicação</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Tipo Serviço</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Especialidade / Procedimento</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Local de Atendimento</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px;">
                    <div style="flex: 2;">
                        <span style="${styleLabel}">Parceiro / Médico</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Data Marcação</span>
                        <div style="${styleInput}"></div>
                    </div>
                    <div style="flex: 1;">
                        <span style="${styleLabel}">Valor (R$)</span>
                        <div style="${styleInput}"></div>
                    </div>
                </div>

                <div style="margin-top: 10px;">
                    <span style="${styleLabel}">Observações do Pedido</span>
                    <div style="${styleInput} height: 60px; border: 1px solid #333;"></div>
                </div>
            </div>

            <div style="text-align: center; font-size: 10px; color: #888; margin-top: 20px;">
                Impresso em ${new Date().toLocaleString('pt-BR')} - Sistema de Gestão Interna
            </div>
        </div>
    `;

    printArea.innerHTML = html;
    window.print();
}

function abrirDetalheSituacaoEleitoral(label) {
    abrirRelatorioEleitoral(label);
}

async function verHistoricoCompleto(p) {
    if(typeof switchTab === 'function') switchTab('historico-paciente');
    
    document.getElementById('hist-nome').innerText = p.nome;
    document.getElementById('hist-cpf').innerText = p.cpf ? `CPF: ${p.cpf}` : 'SEM CPF REGISTRADO';
    document.getElementById('hist-tel').innerText = `Tel: ${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}`;
    
    const btnPrint = document.getElementById('btn-imprimir-historico');
    if(btnPrint) {
        btnPrint.disabled = false;
        btnPrint.classList.remove('opacity-50', 'cursor-not-allowed');
        btnPrint.innerHTML = '<i data-lucide="printer" class="w-4 h-4 mr-2"></i> Completo';
    }

    const divDetalhes = document.getElementById('hist-detalhes');
    const timeline = document.getElementById('hist-timeline');
    timeline.innerHTML = '<p class="text-slate-400 text-sm italic pl-4">Buscando histórico completo...</p>';
    
    const btnHistDelete = document.getElementById('btn-hist-delete');
    if(btnHistDelete && typeof currentUserRole !== 'undefined') {
        btnHistDelete.classList.toggle('hidden', currentUserRole !== 'ADMIN');
    }

    window.historicoAtualCache = [];

    try {
        pacienteAtual = p; 
        histPacienteAtual = p;

        let dataCriacao = p.data_criacao || p.dataCriacao || p.DataCriacao || p.Data_criacao || 'N/I';
        if (dataCriacao && dataCriacao.includes('T')) {
            try {
                const d = new Date(dataCriacao);
                if (!isNaN(d.getTime())) {
                    const dia = String(d.getDate()).padStart(2, '0');
                    const mes = String(d.getMonth() + 1).padStart(2, '0');
                    const ano = d.getFullYear();
                    const hor = String(d.getHours()).padStart(2, '0');
                    const min = String(d.getMinutes()).padStart(2, '0');
                    dataCriacao = `${dia}/${mes}/${ano} ${hor}:${min}`;
                }
            } catch(e) {}
        } else if (dataCriacao && dataCriacao.length === 10 && dataCriacao.includes('-')) {
            const parts = dataCriacao.split('-');
            if(parts.length === 3 && parts[0].length === 4) dataCriacao = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        
        const municipio = p.municipio || p.cidade || p.Municipio || p.Cidade || '-';
        const bairro = p.bairro || p.Bairro || '-';
        const logradouro = p.logradouro || p.endereco || p.Endereco || p.Logradouro || '-';
        const situacao = p.status_titulo || p.situacao_eleitoral || p.situacaoEleitoral || p.municipio_titulo || '-';

        divDetalhes.innerHTML = `
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Cadastrado em</span> <span class="font-medium text-slate-800 text-xs">${dataCriacao}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Data Nasc.</span> <span class="font-medium text-slate-800">${p.nascimento ? p.nascimento.split('-').reverse().join('/') : '-'}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">RG</span> <span class="font-medium text-slate-800">${p.rg || '-'}</span></div>
            
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Município</span> <span class="font-medium text-slate-800">${municipio}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Bairro</span> <span class="font-medium text-slate-800">${bairro}</span></div>
            <div class="md:col-span-2"><span class="block text-xs font-bold text-slate-400 uppercase">Endereço</span> <span class="font-medium text-slate-800">${logradouro}</span></div>
            
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Situação Eleitoral</span> <span class="font-medium text-slate-800">${situacao}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Zona/Seção</span> <span class="font-medium text-slate-800">${p.zona || '-'}/${p.secao || '-'}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Família</span> <span class="font-medium text-slate-800">${p.familia || '-'}</span></div>
            
            ${p.obs ? `<div class="md:col-span-3 mt-2 pt-2 border-t border-slate-100"><span class="block text-xs font-bold text-slate-400 uppercase">Observações</span> <p class="italic text-slate-600">${p.obs}</p></div>` : ''}
        `;

        if (todosAtendimentos.length === 0 && typeof carregarListaAtendimentos === 'function') {
            await carregarListaAtendimentos();
        }

        const cpfP = String(p.cpf || '').replace(/\D/g, '');
        const history = todosAtendimentos.filter(a => {
            const aCpf = String(a.cpf_paciente || a.cpf || '').replace(/\D/g, '');
            return aCpf === cpfP && cpfP !== '';
        });
        
        history.sort((a,b) => new Date(b.data_criacao || b.data_abertura || '2000-01-01') - new Date(a.data_criacao || a.data_abertura || '2000-01-01'));
        window.historicoAtualCache = history; 

        if(history.length === 0) {
            timeline.innerHTML = '<p class="text-slate-400 pl-4">Nenhum atendimento registrado.</p>';
        } else {
            const itemsHtml = history.map(at => {
                const dataFmt = at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-';
                let statusColor = "bg-slate-100 text-slate-600";
                let borderColor = "border-slate-300";
                
                if(at.status === 'CONCLUIDO') { statusColor = "bg-emerald-100 text-emerald-700"; borderColor = "border-emerald-500"; }
                if(at.status === 'PENDENTE') { statusColor = "bg-amber-100 text-amber-700"; borderColor = "border-amber-500"; }
                if(at.status === 'CANCELADO') { statusColor = "bg-red-100 text-red-700"; borderColor = "border-red-500"; }

                const tempId = 'hist_' + Math.random().toString(36).substr(2, 9);
                window[tempId] = at;

                return `
                    <div class="relative pl-4 pb-6 cursor-pointer hover:opacity-90 transition group" onclick="abrirDetalheAtendimento(window['${tempId}'])">
                        <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white rounded-full border-4 ${borderColor}"></div>
                        <div class="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                            
                            <div class="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                                <div class="flex flex-col">
                                    <span class="text-xs font-bold text-slate-400 uppercase">Data Abertura</span>
                                    <span class="font-bold text-slate-800 text-lg">${dataFmt}</span>
                                </div>
                                <span class="${statusColor} text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-black/5">${at.status}</span>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-700">
                                <div class="col-span-2 sm:col-span-1">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Tipo / Serviço</span>
                                    <span class="font-bold text-blue-900">${at.tipo_servico || 'N/I'}</span>
                                </div>
                                <div class="col-span-2 sm:col-span-1">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Especialidade / Proc.</span>
                                    <span class="font-medium">${at.especialidade || at.procedimento || '-'}</span>
                                </div>
                                <div class="col-span-2">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Local / Detalhe</span>
                                    <span>${at.local || '-'} ${at.tipo ? `(${at.tipo})` : ''}</span>
                                </div>
                                ${at.parceiro ? `
                                <div class="col-span-2">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Parceiro</span>
                                    <span class="text-emerald-700 font-medium"><i data-lucide="handshake" class="w-3 h-3 inline mr-1"></i>${at.parceiro}</span>
                                </div>` : ''}
                                ${at.data_marcacao ? `
                                <div class="col-span-2 sm:col-span-1 bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                                    <span class="text-[10px] font-bold text-blue-400 uppercase block">Marcado Para</span>
                                    <span class="font-bold text-blue-800">${at.data_marcacao.split('-').reverse().join('/')}</span>
                                </div>` : ''}
                                ${at.obs_atendimento ? `
                                <div class="col-span-2 mt-2 pt-2 border-t border-slate-100">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Observações</span>
                                    <p class="text-slate-500 italic text-xs line-clamp-2">${at.obs_atendimento}</p>
                                </div>` : ''}
                            </div>
                            <div class="text-xs text-slate-400 mt-3 flex justify-end items-center gap-1 group-hover:text-blue-500 transition-colors">
                                <span>Ver detalhes completos</span>
                                <i data-lucide="arrow-right" class="w-3 h-3"></i>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            timeline.innerHTML = itemsHtml;
        }
        
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) {
        divDetalhes.innerHTML = '<div class="col-span-3 text-red-500">Erro ao carregar detalhes do munícipe.</div>';
        timeline.innerHTML = '<p class="text-red-500 pl-4">Erro ao carregar histórico.</p>';
        if(btnPrint) {
             btnPrint.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 mr-2"></i> Erro';
        }
        console.error(e);
    }
}


// ============================================================================
// X. LISTAGENS PARA IMPRESSÃƒO
// ============================================================================

async function mudarFiltroListagem() {
    if (!window.todosPacientes || window.todosPacientes.length === 0) {
        if (typeof carregarListaPacientes === 'function') await carregarListaPacientes();
    }
    if (!window.todosAtendimentos || window.todosAtendimentos.length === 0) {
        if (typeof carregarListaAtendimentos === 'function') await carregarListaAtendimentos();
    }

    const tipo = document.getElementById('listagem-tipo').value;
    const lblFiltro = document.getElementById('lbl-filtro-secundario');
    const selMes = document.getElementById('inp-filtro-secundario-mes');
    const txtBusca = document.getElementById('inp-filtro-secundario-texto');
    const datalist = document.getElementById('listagens-datalist');

    if (txtBusca && !txtBusca.dataset.clickBound) {
        txtBusca.addEventListener('click', function() {
            if (this.list && typeof this.showPicker === 'function') {
                try { this.showPicker(); } catch(e) {}
            }
        });
        txtBusca.dataset.clickBound = "true";
    }

    selMes.classList.add('hidden');
    txtBusca.classList.add('hidden');
    if (datalist) datalist.innerHTML = '';

    if (tipo === 'aniversariantes') {
        lblFiltro.innerText = "Selecione o Mês";
        selMes.classList.remove('hidden');
    } else if (tipo === 'pendentes') {
        lblFiltro.innerText = "Filtro Automático";
        txtBusca.classList.remove('hidden');
        txtBusca.disabled = true;
        txtBusca.placeholder = "Todos os pendentes...";
    } else {
        txtBusca.classList.remove('hidden');
        txtBusca.disabled = false;
        txtBusca.value = "";
        
        let targetField = '';
        if (tipo === 'bairros') {
            lblFiltro.innerText = "Qual Bairro? (Vazio para todos)";
            txtBusca.placeholder = "Ex: Centro";
            targetField = 'bairro';
        } else if (tipo === 'indicacao') {
            lblFiltro.innerText = "Qual Indicação? (Vazio para todos)";
            txtBusca.placeholder = "Nome da indicação";
            targetField = 'indicacao';
        } else if (tipo === 'lideranca') {
            lblFiltro.innerText = "Qual Liderança? (Vazio para todos)";
            txtBusca.placeholder = "Nome do líder";
            targetField = 'lideranca';
        }
        
        if (targetField && window.todosPacientes && datalist) {
            let uniqueValues = new Set();
            let hasEmpty = false;
            window.todosPacientes.forEach(p => {
                let v = p[targetField];
                if (targetField === 'bairro' && !v) v = p['Bairro'];
                if (v && v.trim() !== '') uniqueValues.add(v.trim().toUpperCase());
                else hasEmpty = true;
            });
            Array.from(uniqueValues).sort().forEach(val => {
                datalist.innerHTML += `<option value="${val}"></option>`;
            });
            if (hasEmpty && targetField === 'bairro') {
                datalist.innerHTML += `<option value="SEM BAIRRO"></option>`;
            }
        }
    }
}

async function gerarListagem() {
    const tipo = document.getElementById('listagem-tipo').value;
    const mes = document.getElementById('inp-filtro-secundario-mes').value;
    const texto = document.getElementById('inp-filtro-secundario-texto').value.trim().toUpperCase();
    
    const tbody = document.getElementById('tabela-listagem-body');
    const thead = document.getElementById('tabela-listagem-head');
    
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Carregando dados...</td></tr>';
    
    if (!window.todosPacientes || window.todosPacientes.length === 0) {
        if (typeof carregarListaPacientes === 'function') await carregarListaPacientes();
    }
    if (!window.todosAtendimentos || window.todosAtendimentos.length === 0) {
        if (typeof carregarListaAtendimentos === 'function') await carregarListaAtendimentos();
    }
    
    let html = '';
    let header = '';

    if (tipo === 'aniversariantes') {
        header = `<tr><th class="px-6 py-4">Munícipe</th><th class="px-6 py-4">Data Nasc.</th><th class="px-6 py-4">Telefone</th><th class="px-6 py-4">Bairro</th><th class="px-6 py-4">Indicação</th></tr>`;
        
        const hojeDate = new Date();
        const hojeDia = hojeDate.getDate();
        const hojeMes = hojeDate.getMonth() + 1;
        const anoAtual = hojeDate.getFullYear();

        if (mes === "") {
            const mesesNomes = {
                '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho',
                '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
            };
            
            for (let m = 1; m <= 12; m++) {
                const mesStr = m.toString().padStart(2, '0');
                const list = todosPacientes.filter(p => {
                    if (!p.nascimento) return false;
                    const parts = p.nascimento.split('-');
                    if (parts.length !== 3) return false;
                    return parts[1] === mesStr;
                });
                
                if (list.length > 0) {
                    list.sort((a,b) => a.nascimento.split('-')[2].localeCompare(b.nascimento.split('-')[2]));
                    html += `<tr class="bg-indigo-50"><td colspan="5" class="px-6 py-3 font-bold text-indigo-800 text-center uppercase">${mesesNomes[mesStr]} ${anoAtual} - ${list.length} pessoas fazem aniversário neste mês</td></tr>`;
                    list.forEach(p => {
                        const dataFmt = p.nascimento.split('-').reverse().join('/');
                        const diaAniv = parseInt(p.nascimento.split('-')[2]);
                        
                        let statusHtml = '';
                        let trClass = 'hover:bg-slate-50 transition';
                        
                        if (m < hojeMes) { statusHtml = 'Já fez'; trClass = 'bg-slate-50 opacity-75'; }
                        else if (m > hojeMes) { statusHtml = 'Vai fazer'; }
                        else {
                            if (diaAniv < hojeDia) { statusHtml = 'Já fez'; trClass = 'bg-slate-50 opacity-75'; }
                            else if (diaAniv > hojeDia) { statusHtml = 'Vai fazer'; }
                            else { statusHtml = 'HOJE! 🥳'; trClass = 'bg-green-100 border-l-4 border-green-500 font-bold'; }
                        }
                        
                        html += `<tr class="${trClass}"><td class="px-6 py-2 font-bold">${p.nome} <span class="text-[10px] uppercase text-slate-500 ml-2 font-bold">${statusHtml}</span></td><td class="px-6 py-2">${dataFmt}</td><td class="px-6 py-2">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td><td class="px-6 py-2">${p.bairro||'-'}</td><td class="px-6 py-2">${p.indicacao||'-'}</td></tr>`;
                    });
                }
            }
            if (html === '') html = `<tr><td colspan="5" class="px-6 py-4 text-center">Nenhum aniversariante encontrado.</td></tr>`;
        } else {
            const list = todosPacientes.filter(p => {
                if (!p.nascimento) return false;
                const parts = p.nascimento.split('-');
                if (parts.length !== 3) return false;
                return parts[1] === mes;
            });
            list.sort((a,b) => {
                const dA = a.nascimento.split('-')[2];
                const dB = b.nascimento.split('-')[2];
                return dA.localeCompare(dB);
            });

            if (list.length === 0) html = `<tr><td colspan="5" class="px-6 py-4 text-center">Nenhum aniversariante encontrado.</td></tr>`;
            else {
                const mesesNomes = {
                    '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho',
                    '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
                };
                html += `<tr class="bg-indigo-50"><td colspan="5" class="px-6 py-3 font-bold text-indigo-800 text-center uppercase">${mesesNomes[mes]} ${anoAtual} - ${list.length} pessoas fazem aniversário neste mês</td></tr>`;
            }
            
            list.forEach(p => {
                const dataFmt = p.nascimento.split('-').reverse().join('/');
                const diaAniv = parseInt(p.nascimento.split('-')[2]);
                const mesAniv = parseInt(mes);
                
                let statusHtml = '';
                let trClass = 'hover:bg-slate-50 transition';
                
                if (mesAniv < hojeMes) { statusHtml = 'Já fez'; trClass = 'bg-slate-50 opacity-75'; }
                else if (mesAniv > hojeMes) { statusHtml = 'Vai fazer'; }
                else {
                    if (diaAniv < hojeDia) { statusHtml = 'Já fez'; trClass = 'bg-slate-50 opacity-75'; }
                    else if (diaAniv > hojeDia) { statusHtml = 'Vai fazer'; }
                    else { statusHtml = 'HOJE! 🥳'; trClass = 'bg-green-100 border-l-4 border-green-500 font-bold'; }
                }

                html += `<tr class="${trClass}"><td class="px-6 py-2 font-bold">${p.nome} <span class="text-[10px] uppercase text-slate-500 ml-2 font-bold">${statusHtml}</span></td><td class="px-6 py-2">${dataFmt}</td><td class="px-6 py-2">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td><td class="px-6 py-2">${p.bairro||'-'}</td><td class="px-6 py-2">${p.indicacao||'-'}</td></tr>`;
            });
        }
    } 
    else if (tipo === 'pendentes') {
        header = `<tr><th class="px-6 py-4">Munícipe (CPF)</th><th class="px-6 py-4">Procedimento / Local</th><th class="px-6 py-4">Data Risco</th></tr>`;
        const list = todosAtendimentos.filter(a => a.status === 'PENDENTE');
        list.sort((a,b) => new Date(a.data_risco || '9999-12-31') - new Date(b.data_risco || '9999-12-31'));

        if (list.length === 0) html = `<tr><td colspan="3" class="px-6 py-4 text-center">Nenhum atendimento pendente.</td></tr>`;
        list.forEach(a => {
            const dataFmt = a.data_risco ? a.data_risco.split('-').reverse().join('/') : '-';
            html += `<tr><td class="px-6 py-2 font-bold">${a.nome_paciente || 'Desconhecido'} <span class="text-xs text-slate-400 block">${a.cpf_paciente||''}</span></td><td class="px-6 py-2">${a.procedimento||'-'}<br><span class="text-xs">${a.local||'-'}</span></td><td class="px-6 py-2 text-red-600 font-bold">${dataFmt}</td></tr>`;
        });
    }
    else if (tipo === 'bairros') {
        header = `<tr><th class="px-6 py-4">Munícipe</th><th class="px-6 py-4">Bairro / Endereço</th><th class="px-6 py-4">Telefone</th><th class="px-6 py-4">Atendimentos Consolidado</th></tr>`;
        let list = todosPacientes;
        if (texto) {
            if (texto.toUpperCase() === 'SEM BAIRRO') {
                list = list.filter(p => !p.bairro && !p.Bairro);
            } else {
                list = list.filter(p => (p.bairro && p.bairro.toUpperCase().includes(texto.toUpperCase())) || (p.Bairro && p.Bairro.toUpperCase().includes(texto.toUpperCase())));
            }
        }
        list.sort((a,b) => ((a.bairro||a.Bairro||'').localeCompare(b.bairro||b.Bairro||'') || (a.nome||'').localeCompare(b.nome||'')));

        if (list.length === 0) html = `<tr><td colspan="4" class="px-6 py-4 text-center">Nenhum resultado.</td></tr>`;
        list.forEach(p => {
            const end = p.endereco || p.logradouro || p.Endereco || p.Logradouro || '-';
            const br = p.bairro || p.Bairro || '-';
            const bairroEnd = br + '<br><span class="text-xs text-slate-400">' + end + '</span>';
            
            const atends = (window.todosAtendimentos || []).filter(a => {
                const hasCpfP = p.cpf && p.cpf.length > 4;
                const hasCpfA = a.cpf_paciente && a.cpf_paciente.length > 4;
                if (hasCpfP && hasCpfA && a.cpf_paciente === p.cpf) return true;
                
                const hasNomeP = p.nome && p.nome.trim() !== '';
                const hasNomeA = a.nome_paciente && a.nome_paciente.trim() !== '';
                if (hasNomeP && hasNomeA && a.nome_paciente.toUpperCase() === p.nome.toUpperCase()) return true;
                
                return false;
            });
            
            let cons = atends.map(a => {
                let s = [a.tipo_servico || a.tipo, a.especialidade, a.procedimento].filter(x=>x).join(' - ');
                return s ? `<div class="text-xs border-b border-slate-100 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">${s}</div>` : '';
            }).filter(x=>x).join('');
            if(!cons) cons = '-';

            html += `<tr><td class="px-6 py-2 font-bold">${p.nome}</td><td class="px-6 py-2">${bairroEnd}</td><td class="px-6 py-2">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td><td class="px-6 py-2">${cons}</td></tr>`;
        });
    }
    else if (tipo === 'indicacao') {
        header = `<tr><th class="px-6 py-4">Munícipe</th><th class="px-6 py-4">Indicação</th><th class="px-6 py-4">Bairro</th></tr>`;
        let list = todosPacientes.filter(p => p.indicacao && p.indicacao.trim() !== "");
        if (texto) {
            list = list.filter(p => p.indicacao.toUpperCase().includes(texto));
        }
        list.sort((a,b) => (a.indicacao||'').localeCompare(b.indicacao||'') || (a.nome||'').localeCompare(b.nome||''));

        if (list.length === 0) html = `<tr><td colspan="3" class="px-6 py-4 text-center">Nenhum resultado.</td></tr>`;
        list.forEach(p => {
            html += `<tr><td class="px-6 py-2 font-bold">${p.nome}</td><td class="px-6 py-2">${p.indicacao||'-'}</td><td class="px-6 py-2">${p.bairro||'-'}</td></tr>`;
        });
    }
    else if (tipo === 'lideranca') {
        header = `<tr><th class="px-6 py-4">Munícipe</th><th class="px-6 py-4">Liderança</th><th class="px-6 py-4">Telefone</th></tr>`;
        let list = todosPacientes.filter(p => p.lideranca && p.lideranca.trim() !== "");
        if (texto) {
            list = list.filter(p => p.lideranca.toUpperCase().includes(texto));
        }
        list.sort((a,b) => (a.lideranca||'').localeCompare(b.lideranca||'') || (a.nome||'').localeCompare(b.nome||''));

        if (list.length === 0) html = `<tr><td colspan="3" class="px-6 py-4 text-center">Nenhum resultado.</td></tr>`;
        list.forEach(p => {
            html += `<tr><td class="px-6 py-2 font-bold">${p.nome}</td><td class="px-6 py-2">${p.lideranca||'-'}</td><td class="px-6 py-2">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</td></tr>`;
        });
    }

    thead.innerHTML = header;
    tbody.innerHTML = html;
}

function imprimirListagem() {
    const thead = document.getElementById('tabela-listagem-head').innerHTML;
    const tbody = document.getElementById('tabela-listagem-body').innerHTML;
    const tipo = document.getElementById('listagem-tipo').options[document.getElementById('listagem-tipo').selectedIndex].text;

    if (tbody.includes("Selecione os filtros") || tbody.includes("Nenhum resultado")) {
        alert("Gere uma listagem válida primeiro!");
        return;
    }

    const html = `
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin:0; font-size: 20px;">Connecta</h2>
        <h3 style="margin:5px 0 0 0; color:#475569; font-size: 16px;">Relatório: ${tipo}</h3>
        <p style="margin:5px 0 0 0; font-size: 12px; color:#94a3b8;">Gerado em: ${new Date().toLocaleString()}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px;">
        <thead style="background: #f1f5f9; text-transform: uppercase;">
            ${thead}
        </thead>
        <tbody>
            ${tbody}
        </tbody>
    </table>
    <style>
        table, th, td { border: 1px solid #cbd5e1; }
        th { padding: 10px; text-align: left; }
        td { padding: 8px; }
    </style>
    `;

    let mywindow = window.open('', 'PRINT', 'height=600,width=800');
    mywindow.document.write('<html><head><title>Imprimir Listagem</title></head><body>');
    mywindow.document.write(html);
    mywindow.document.write('</body></html>');

    setTimeout(() => {
        mywindow.document.close();
        mywindow.focus();
        mywindow.print();
        mywindow.close();
    }, 500);
}

// ============================================================================
// XI. IMPRESSÃƒO DA FICHA DO CADASTRO
// ============================================================================

function imprimirFichaCadastro() {
    if (!pacienteAtual) {
        alert("Nenhum munícipe carregado para impressão.");
        return;
    }
    let p = pacienteAtual;

    const styleLabel = "display: block; font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px;";
    const styleData = "display: block; font-size: 13px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 12px; min-height: 18px;";
    const styleSection = "margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; break-inside: avoid;";
    const styleTitle = "margin-top: 0; font-size: 14px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px;";

    const fmtData = (d) => d ? d.split('-').reverse().join('/') : '-';

    const html = `
    <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e293b; padding-bottom: 10px;">
        <h2 style="margin: 0; font-size: 20px; color: #0f172a;">FICHA CADASTRAL</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Connecta - Gerado em: ${new Date().toLocaleString()}</p>
    </div>

    <div style="${styleSection}">
        <h3 style="${styleTitle}">Dados Pessoais</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 60%; padding-right: 15px;">
                    <span style="${styleLabel}">Nome Completo</span>
                    <span style="${styleData}">${p.nome || '-'}</span>
                </td>
                <td style="width: 40%;">
                    <span style="${styleLabel}">Data de Nascimento</span>
                    <span style="${styleData}">${fmtData(p.nascimento)}</span>
                </td>
            </tr>
            <tr>
                <td style="padding-right: 15px;">
                    <span style="${styleLabel}">Nome da Mãe</span>
                    <span style="${styleData}">${p.nome_mae || '-'}</span>
                </td>
                <td>
                    <span style="${styleLabel}">Profissão</span>
                    <span style="${styleData}">${p.profissao || '-'}</span>
                </td>
            </tr>
        </table>
    </div>

    <div style="${styleSection}">
        <h3 style="${styleTitle}">Documentação</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 33%; padding-right: 15px;">
                    <span style="${styleLabel}">CPF</span>
                    <span style="${styleData}">${p.cpf || '-'}</span>
                </td>
                <td style="width: 33%; padding-right: 15px;">
                    <span style="${styleLabel}">RG</span>
                    <span style="${styleData}">${p.rg || '-'}</span>
                </td>
                <td style="width: 33%;">
                    <span style="${styleLabel}">Cartão SUS</span>
                    <span style="${styleData}">${p.sus || '-'}</span>
                </td>
            </tr>
            <tr>
                <td style="padding-right: 15px;">
                    <span style="${styleLabel}">Título de Eleitor</span>
                    <span style="${styleData}">${p.titulo || '-'}</span>
                </td>
                <td style="padding-right: 15px;">
                    <span style="${styleLabel}">Zona</span>
                    <span style="${styleData}">${p.zona || '-'}</span>
                </td>
                <td>
                    <span style="${styleLabel}">Seção</span>
                    <span style="${styleData}">${p.secao || '-'}</span>
                </td>
            </tr>
        </table>
    </div>

    <div style="${styleSection}">
        <h3 style="${styleTitle}">Contato e Endereço</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 50%; padding-right: 15px;">
                    <span style="${styleLabel}">Telefone Principal</span>
                    <span style="${styleData}">${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</span>
                </td>
                <td style="width: 50%;">
                    <span style="${styleLabel}">Telefone Recado</span>
                    <span style="${styleData}">${p.tel2 || p.tel_recado || '-'}</span>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <span style="${styleLabel}">Endereço Completo</span>
                    <span style="${styleData}">${p.endereco || '-'}</span>
                </td>
            </tr>
            <tr>
                <td style="padding-right: 15px;">
                    <span style="${styleLabel}">Bairro</span>
                    <span style="${styleData}">${p.bairro || '-'}</span>
                </td>
                <td>
                    <span style="${styleLabel}">CEP</span>
                    <span style="${styleData}">${p.cep || '-'}</span>
                </td>
            </tr>
        </table>
    </div>

    <div style="${styleSection}">
        <h3 style="${styleTitle}">Informações Adicionais</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 50%; padding-right: 15px;">
                    <span style="${styleLabel}">Liderança</span>
                    <span style="${styleData}">${p.lideranca || '-'}</span>
                </td>
                <td style="width: 50%;">
                    <span style="${styleLabel}">Indicação</span>
                    <span style="${styleData}">${p.indicacao || '-'}</span>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <span style="${styleLabel}">Redes Sociais</span>
                    <span style="${styleData}">${p.redes_sociais || '-'}</span>
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <span style="${styleLabel}">Observações Cadastrais</span>
                    <span style="${styleData}">${p.obs_cadastro || '-'}</span>
                </td>
            </tr>
        </table>
    </div>
    `;

    let mywindow = window.open('', 'PRINT', 'height=600,width=800');
    mywindow.document.write('<html><head><title>Imprimir Cadastro</title></head><body style="font-family: sans-serif;">');
    mywindow.document.write(html);
    mywindow.document.write('</body></html>');

    setTimeout(() => {
        mywindow.document.close();
        mywindow.focus();
        mywindow.print();
        mywindow.close();
    }, 500);
}


// ============================================================================
// XII. CONTROLES DE PAGINAÇÃO
// ============================================================================

window.paginacaoPacientes = { paginaAtual: 1, itensPorPagina: 10, dadosFiltrados: [] };
window.paginacaoAtendimentos = { paginaAtual: 1, itensPorPagina: 10, dadosFiltrados: [] };

// --- PAGINAÇÃO: PACIENTES ---

function renderizarPaginaPacientes() {
    const p = window.paginacaoPacientes;
    const total = p.dadosFiltrados.length;
    const totalPaginas = Math.ceil(total / p.itensPorPagina) || 1;
    
    if (p.paginaAtual > totalPaginas) p.paginaAtual = totalPaginas;
    if (p.paginaAtual < 1) p.paginaAtual = 1;

    const inicio = (p.paginaAtual - 1) * p.itensPorPagina;
    const fim = inicio + p.itensPorPagina;
    const itensPagina = p.dadosFiltrados.slice(inicio, fim);

    if (typeof renderizarTabelaPacientes === 'function') {
        renderizarTabelaPacientes(itensPagina);
    }

    const info = document.getElementById('paginacao-pacientes-info');
    if (info) {
        info.innerText = `Mostrando ${total === 0 ? 0 : inicio + 1} a ${Math.min(fim, total)} de ${total} registros`;
    }

    renderizarControlesPaginacao('paginacao-pacientes-botoes', p.paginaAtual, totalPaginas, 'mudarPaginaPacientes');
}

function mudarPaginaPacientes(pagina) {
    const p = window.paginacaoPacientes;
    const totalPaginas = Math.ceil(p.dadosFiltrados.length / p.itensPorPagina) || 1;
    
    if (pagina === 'prev') p.paginaAtual = Math.max(1, p.paginaAtual - 1);
    else if (pagina === 'next') p.paginaAtual = Math.min(totalPaginas, p.paginaAtual + 1);
    else p.paginaAtual = parseInt(pagina);

    renderizarPaginaPacientes();
}

function mudarTamanhoPaginaPacientes(size) {
    window.paginacaoPacientes.itensPorPagina = parseInt(size);
    window.paginacaoPacientes.paginaAtual = 1;
    renderizarPaginaPacientes();
}

// --- PAGINAÇÃO: ATENDIMENTOS ---

function renderizarPaginaAtendimentos() {
    const p = window.paginacaoAtendimentos;
    const total = p.dadosFiltrados.length;
    const totalPaginas = Math.ceil(total / p.itensPorPagina) || 1;
    
    if (p.paginaAtual > totalPaginas) p.paginaAtual = totalPaginas;
    if (p.paginaAtual < 1) p.paginaAtual = 1;

    const inicio = (p.paginaAtual - 1) * p.itensPorPagina;
    const fim = inicio + p.itensPorPagina;
    const itensPagina = p.dadosFiltrados.slice(inicio, fim);

    if (typeof renderizarTabelaAtendimentos === 'function') {
        renderizarTabelaAtendimentos(itensPagina);
    }

    const info = document.getElementById('paginacao-atendimentos-info');
    if (info) {
        info.innerText = `Mostrando ${total === 0 ? 0 : inicio + 1} a ${Math.min(fim, total)} de ${total} registros`;
    }

    // Esconde contador antigo
    const oldContador = document.getElementById('contador-atendimentos');
    if (oldContador) oldContador.style.display = 'none';

    renderizarControlesPaginacao('paginacao-atendimentos-botoes', p.paginaAtual, totalPaginas, 'mudarPaginaAtendimentos');
}

function mudarPaginaAtendimentos(pagina) {
    const p = window.paginacaoAtendimentos;
    const totalPaginas = Math.ceil(p.dadosFiltrados.length / p.itensPorPagina) || 1;
    
    if (pagina === 'prev') p.paginaAtual = Math.max(1, p.paginaAtual - 1);
    else if (pagina === 'next') p.paginaAtual = Math.min(totalPaginas, p.paginaAtual + 1);
    else p.paginaAtual = parseInt(pagina);

    renderizarPaginaAtendimentos();
}

function mudarTamanhoPaginaAtendimentos(size) {
    window.paginacaoAtendimentos.itensPorPagina = parseInt(size);
    window.paginacaoAtendimentos.paginaAtual = 1;
    renderizarPaginaAtendimentos();
}

// --- UTILITÁRIO GERAL DE CONTROLES ---

function renderizarControlesPaginacao(containerId, paginaAtual, totalPaginas, nomeFuncaoMudanca) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '';

    // Botão Anterior
    const prevDisabled = paginaAtual === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-100 hover:text-blue-600';
    html += `<button onclick="${nomeFuncaoMudanca}('prev')" class="px-3 py-1 text-sm border border-slate-200 rounded text-slate-500 bg-white transition ${prevDisabled}"><i data-lucide="chevron-left" class="w-4 h-4"></i></button>`;

    // Lógica para mostrar apenas algumas páginas (ex: 1, 2, 3, ..., 10)
    let startPage = Math.max(1, paginaAtual - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
        html += `<button onclick="${nomeFuncaoMudanca}(1)" class="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-100 transition bg-white text-slate-600">1</button>`;
        if (startPage > 2) html += `<span class="px-2 text-slate-400">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === paginaAtual 
            ? 'bg-blue-600 text-white border-blue-600 font-bold' 
            : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200';
        html += `<button onclick="${nomeFuncaoMudanca}(${i})" class="px-3 py-1 text-sm border rounded transition ${activeClass}">${i}</button>`;
    }

    if (endPage < totalPaginas) {
        if (endPage < totalPaginas - 1) html += `<span class="px-2 text-slate-400">...</span>`;
        html += `<button onclick="${nomeFuncaoMudanca}(${totalPaginas})" class="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-100 transition bg-white text-slate-600">${totalPaginas}</button>`;
    }

    // Botão Próximo
    const nextDisabled = paginaAtual === totalPaginas ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-slate-100 hover:text-blue-600';
    html += `<button onclick="${nomeFuncaoMudanca}('next')" class="px-3 py-1 text-sm border border-slate-200 rounded text-slate-500 bg-white transition ${nextDisabled}"><i data-lucide="chevron-right" class="w-4 h-4"></i></button>`;

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderRecentLogins() {
    const container = document.getElementById('recent-logins');
    if(!container) return;
    
    let recents = JSON.parse(localStorage.getItem('recentLoginsCache') || '[]');
    if(recents.length === 0) {
        container.innerHTML = '';
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    let html = `<p class="text-xs text-slate-500 font-bold uppercase mb-3 text-center">Acessos Salvos (Clique para entrar)</p>
                <div class="flex flex-col gap-2">`;
                
    recents.forEach(r => {
        html += `<div class="flex items-center gap-2">
                    <button onclick="loginDiretoCache('${r.email}', '${r.token}')" type="button" class="flex-1 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-all w-full text-left">
                        <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold uppercase shrink-0">${r.email.charAt(0)}</div>
                        <span class="text-sm font-medium truncate">${r.email}</span>
                    </button>
                    <button onclick="removerLoginCache('${r.email}')" type="button" class="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all shrink-0" title="Remover acesso">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                 </div>`;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

function removerLoginCache(email) {
    let recents = JSON.parse(localStorage.getItem('recentLoginsCache') || '[]');
    recents = recents.filter(r => r.email !== email);
    localStorage.setItem('recentLoginsCache', JSON.stringify(recents));
    renderRecentLogins();
}

function loginDiretoCache(email, token) {
    document.getElementById('login_email').value = email;
    document.getElementById('login_senha').value = atob(token);
    efetuarLogin();
}

document.addEventListener('DOMContentLoaded', renderRecentLogins);



// ============================================================================
// ADMIN PANEL UI
// ============================================================================

function renderizarUsuarios(usuarios) {
    const tbody = document.getElementById('tabela-usuarios-body');
    if(!tbody) return;
    
    if(usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="px-4 py-8 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>';
        return;
    }
    
    let html = '';
    usuarios.forEach(u => {
        const email = u.email || 'Sem e-mail';
        const perfil = u.perfil || 'VISITOR';
        const isAdmin = perfil === 'ADMIN';
        
        const badgeClass = isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600';
        
        let acoes = '';
        if (email !== window.auth.currentUser?.email) {
            if (isAdmin) {
                acoes = `<button onclick="alterarCargoUsuario('${u.id}', 'VISITOR')" class="text-xs text-orange-600 hover:text-orange-800 font-bold bg-orange-50 px-3 py-1 rounded transition">Tornar Visitante</button>`;
            } else {
                acoes = `<button onclick="alterarCargoUsuario('${u.id}', 'ADMIN')" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-1 rounded transition">Tornar Admin</button>`;
            }
        } else {
            acoes = `<span class="text-xs text-slate-400 italic">Você</span>`;
        }
        
        html += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="px-4 py-3 font-medium text-slate-800">${email}</td>
                <td class="px-4 py-3 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold uppercase ${badgeClass}">${perfil}</span></td>
                <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">${acoes}</div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

window.renderizarUsuarios = renderizarUsuarios;
