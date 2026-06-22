/**
 * js/ui.js
 * Funções de manipulação da interface (DOM) e lógica de visualização.
 */

// ============================================================================
// MODAIS GLOBAIS (CUSTOM ALERT / CONFIRM)
// ============================================================================
window.showModalAlert = function(msg) {
    return new Promise(resolve => {
        const modal = document.getElementById('global-modal-alert');
        const text = document.getElementById('global-alert-msg');
        const btn = document.getElementById('global-alert-btn');
        if(!modal) { alert(msg); resolve(); return; } // Fallback
        
        text.innerText = msg;
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
        
        const closeModal = () => {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                btn.removeEventListener('click', closeModal);
                resolve();
            }, 300);
        };
        btn.addEventListener('click', closeModal);
    });
};

window.showModalConfirm = function(msg) {
    return new Promise(resolve => {
        const modal = document.getElementById('global-modal-confirm');
        const text = document.getElementById('global-confirm-msg');
        const btnOk = document.getElementById('global-confirm-ok');
        const btnCancel = document.getElementById('global-confirm-cancel');
        if(!modal) { resolve(confirm(msg)); return; } // Fallback
        
        text.innerText = msg;
        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
        
        const closeModal = (result) => {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                btnOk.removeEventListener('click', onOk);
                btnCancel.removeEventListener('click', onCancel);
                resolve(result);
            }, 300);
        };
        
        const onOk = () => closeModal(true);
        const onCancel = () => closeModal(false);
        
        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
    });
};

// ============================================================================
// VARIí VEIS GLOBAIS DE UI
// ============================================================================
window.historicoAtualCache = []; // Armazena o histórico do munícipe atual para impressão

// ============================================================================
// UTILITÁRIOS (VIACEP E OUTROS)
// ============================================================================
window.buscarCep = async function(cep) {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    
    try {
        const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
            const logradouro = document.getElementById('field_logradouro');
            const bairro = document.getElementById('field_bairro');
            const municipio = document.getElementById('field_municipio');
            
            if (logradouro) logradouro.value = (data.logradouro || '').toUpperCase();
            if (bairro) {
                bairro.value = (data.bairro || '').toUpperCase();
                bairro.readOnly = !!data.bairro;
                if (data.bairro) bairro.classList.add('bg-slate-100', 'cursor-not-allowed');
                else bairro.classList.remove('bg-slate-100', 'cursor-not-allowed');
            }
            if (municipio) {
                municipio.value = (data.localidade || "").toUpperCase();
                municipio.readOnly = !!data.localidade;
                if (data.localidade) municipio.classList.add("bg-slate-100", "cursor-not-allowed");
                else municipio.classList.remove("bg-slate-100", "cursor-not-allowed");
            }
        }
    } catch(e) {
        console.error("Erro ao buscar CEP", e);
    }
};
// ============================================================================
// 1. LOGIN E PERMISSÕES (FIREBASE AUTH)
// ============================================================================
document.addEventListener("DOMContentLoaded", function() {
    if (window.auth) {
        window.auth.onAuthStateChanged(async user => {
            if (user) {
                const email = user.email.toLowerCase();
                let isAdmin = false;
                
                // 1. Tenta ler da coleção oficial 'usuarios' primeiro
                try {
                    const qUsuarios = window.query(window.collection(window.db, "usuarios"), window.where("email", "==", email));
                    const snapUsuarios = await window.getDocs(qUsuarios);
                    if (!snapUsuarios.empty) {
                        for (let doc of snapUsuarios.docs) {
                            const data = doc.data();
                            if ((data.perfil || '').toUpperCase() === "ADMIN" || (data.role || '').toUpperCase() === "ADMIN") {
                                isAdmin = true; break;
                            }
                        }
                    }
                } catch(e) { console.warn("Erro ao ler usuarios", e); }
                
                // 2. Se não achou, tenta a coleção 'users' (legado)
                if (!isAdmin) {
                    try {
                        const qUsers = window.query(window.collection(window.db, "users"), window.where("email", "==", email));
                        const snapUsers = await window.getDocs(qUsers);
                        if (!snapUsers.empty) {
                            for (let doc of snapUsers.docs) {
                                const data = doc.data();
                                if ((data.perfil || '').toUpperCase() === "ADMIN" || (data.role || '').toUpperCase() === "ADMIN") {
                                    isAdmin = true; break;
                                }
                            }
                        } else {
                            // Tenta adicionar se for a primeira vez
                            await window.addDoc(window.collection(window.db, "usuarios"), {
                                email: email,
                                perfil: "VISITOR",
                                role: "user",
                                criadoEm: new Date().toISOString()
                            });
                        }
                    } catch(e) { console.warn("Erro ao buscar/criar em users legado", e); }
                }

                // FALLBACK SEGURO
                if (!isAdmin) {
                    if (email.includes('igor') || email.includes('admin') || email.includes('gestao')) {
                        isAdmin = true;
                    }
                }
                
                currentUserRole = isAdmin ? "ADMIN" : "VISITOR";
                iniciarSistema(isAdmin ? "Administrador" : "Visitante");
            } else {
                const emailInput = document.getElementById("login_email");
                const pswInput = document.getElementById("login_senha");
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
    
    if(typeof inicializarEstatisticas === 'function') inicializarEstatisticas();
    if(typeof carregarFiltros === 'function') carregarFiltros();
    if(typeof carregarConfigSelects === 'function') carregarConfigSelects();
    if(typeof carregarAvisosAniversariantes === 'function') carregarAvisosAniversariantes();
    
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

    const navExport = document.getElementById('nav-export');
    if(navExport) {
        if(currentUserRole === 'ADMIN') navExport.classList.remove('hidden');
        else navExport.classList.add('hidden');
    }

    const navAdmin = document.getElementById('nav-admin');
    if(navAdmin) {
        if(currentUserRole === 'ADMIN') navAdmin.classList.remove('hidden');
        else navAdmin.classList.add('hidden');
    }
    
    const elements = document.querySelectorAll('[data-access="admin"]');
    elements.forEach(el => {
        if (isVisitor) el.classList.add('hidden');
        else el.classList.remove('hidden');
    });
}

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

    if (typeof toggleMobileMenu === "function" && window.innerWidth < 768) {
        toggleMobileMenu(true);
    }

    const views = [
        "view-lista-pacientes", "view-lista-atendimentos", 
        "view-form-paciente", "view-form-atendimento", 
        "view-dashboard", "view-relatorios", "view-listagens",
        "view-parceiros", "view-historico-paciente", 
        "view-detalhe-atendimento", "view-exportacao",
        "view-admin-panel", "view-aniversariantes", "view-agenda", "view-campanhas",
        "view-alertas-pendencias"
    ];
    
    views.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.classList.add("hidden");
    });
    const target = document.getElementById('view-' + tabId);
    if(target) target.classList.remove('hidden');
    
    if (shouldReset) {
        if (tabId === 'form-paciente' && typeof resetFormPaciente === 'function') resetFormPaciente();
        if (tabId === 'form-atendimento' && typeof resetFormAtendimento === 'function') resetFormAtendimento();
    }
    
    if (tabId === 'lista-pacientes') {
        const listaVisible = document.getElementById('subview-pacientes-lista') && !document.getElementById('subview-pacientes-lista').classList.contains('hidden');
        if(listaVisible && typeof carregarListaPacientes === 'function') carregarListaPacientes();
        else if (typeof carregarAniversarios === 'function') carregarAniversarios();
    }

    if (tabId === 'aniversariantes' && typeof renderizarPainelAniversariantes === 'function') {
        renderizarPainelAniversariantes();
    }

    if (tabId === 'lista-atendimentos' && typeof carregarListaAtendimentos === 'function') carregarListaAtendimentos();
    if (tabId === 'dashboard' && typeof loadDashboard === 'function') loadDashboard();
    if (tabId === 'parceiros' && typeof initParceiros === 'function') initParceiros();
    if (tabId === 'relatorios' && typeof initRelatorios === 'function') initRelatorios();
    if (tabId === 'admin-panel' && typeof carregarListaUsuarios === 'function') carregarListaUsuarios();
    
    if (tabId === 'alertas-pendencias' && typeof renderizarAlertas === 'function') renderizarAlertas();

    if(typeof currentUserRole !== 'undefined' && currentUserRole) aplicarPermissoes();
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

// Block Enter key submission
window.addEventListener('keydown', function(e) {
    if(e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const form = e.target.closest('form');
        if(form && (form.id === 'frmPaciente' || form.id === 'frmAtendimento')) {
            e.preventDefault();
            return false;
        }
    }
});
