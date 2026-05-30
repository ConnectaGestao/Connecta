/**
 * js/api.js
 * Funções de comunicação com o backend (Firebase Firestore) e lógica de negócios.
 */

// ============================================================================
// 0. UTILITÁRIOS DE UI (Loading Dinâmico)
// ============================================================================

function setLoadingText(loadingId, text) {
    const label = document.getElementById('lbl-' + loadingId);
    if (label) label.innerText = text;
}

// ============================================================================
// 1. FUNÇÕES BASE
// ============================================================================

// VALORES PADRÃO HARDCODED (Para garantir que apareçam mesmo se o DB estiver vazio)
const VALORES_PADRAO = {
    'CATEGORIAS': ['JURIDICO', 'SAUDE', 'SERVIÇO', 'SOCIAL'],
    'ATENDIMENTO': ['CONSULTA AGENDADA', 'CONSULTA EMERGENCIAL', 'CONSULTA PRÉ OPERATORIA', 'ENCAMINHAMENTOS', 'EXAMES', 'INTERNAÇÃO CIRURGICA', 'ORIENTAÇÕES', 'PROCEDIMENTOS'],
    'ESPECIALIDADE': ['GINECOLOGIA', 'ORTOPEDISTA', 'CLINICO GERAL', 'PEDIATRA', 'CIRURGIÃO INFANTIL', 'CIRURGIÃO ADULTO', 'IMAGENS'],
    'PROCEDIMENTO_EXAMES': ['USG', 'TC', 'RNM', 'ECG', 'DOPLLER', 'OFTALMOLÓGICOS'],
    'TIPOS_EXAME': ['RNM CRANIO', 'RNM PELVE', 'TC FACE', 'OCT', 'MAPEAMENTO RETINA']
};

async function carregarFiltros() {
    const safety = setTimeout(() => {
        if(typeof CONFIG_SELECTS !== 'undefined') {
            CONFIG_SELECTS.forEach(cfg => {
                const sel = document.getElementById(`sel_${cfg.id}`);
                if(sel && sel.value === "" && sel.options[0].text === "Carregando...") {
                    popularSelectComPadroes(sel, cfg.key, []);
                }
            });
        }
    }, 5000);

    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, "filtros"));
        const resultData = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const cat = data.categoria;
            if(!resultData[cat]) resultData[cat] = [];
            if(!resultData[cat].includes(data.valor)) resultData[cat].push(data.valor);
        });

        clearTimeout(safety);
        opcoesFiltros = resultData;
        
        if(typeof CONFIG_SELECTS !== 'undefined') {
            CONFIG_SELECTS.forEach(cfg => {
                const sel = document.getElementById(`sel_${cfg.id}`);
                if(!sel) return;
                
                const listaDB = opcoesFiltros[cfg.key] || [];
                popularSelectComPadroes(sel, cfg.key, listaDB);
                
                // Restaura valor selecionado se houver (edição)
                const hiddenVal = document.getElementById(`field_${cfg.id}`).value;
                if(hiddenVal) {
                    let exists = false;
                    for(let i=0; i<sel.options.length; i++) {
                        if(sel.options[i].value.toUpperCase() === hiddenVal.toUpperCase()) {
                            sel.selectedIndex = i; exists = true; break;
                        }
                    }
                    if(!exists) {
                        const novaOpcao = new Option(hiddenVal, hiddenVal, true, true);
                        const lastIndex = sel.options.length - 1;
                        sel.add(novaOpcao, lastIndex >= 0 ? sel.options[lastIndex] : null);
                        sel.value = hiddenVal; 
                    }
                }
            });
        }
    } catch (err) { console.error("Erro ao carregar filtros", err); }
}

function popularSelectComPadroes(sel, key, listaExtra) {
    sel.innerHTML = '<option value="">Selecione...</option>';
    
    // 1. Pega os padrões definidos no código
    const padroes = VALORES_PADRAO[key] || [];
    
    // 2. Junta com os do banco (evitando duplicados)
    const conjuntoUnico = new Set([...padroes, ...listaExtra]);
    
    // 3. Ordena e cria as opções
    Array.from(conjuntoUnico).sort().forEach(op => {
        if(op) sel.innerHTML += `<option value="${op}">${op}</option>`;
    });
    
    sel.innerHTML += '<option value="__NEW__" class="font-bold text-blue-600 border-t">+ Cadastrar Novo</option>';
}

async function saveNewFilter(category, value) {
    if (!value || value === "") return;
    try {
        const valNorm = String(value).toUpperCase().trim();
        const catNorm = category.toUpperCase().trim();
        const q = window.query(window.collection(window.db, "filtros"), window.where("categoria", "==", catNorm), window.where("valor", "==", valNorm));
        const querySnapshot = await window.getDocs(q);
        
        if (querySnapshot.empty) {
            await window.addDoc(window.collection(window.db, "filtros"), {
                categoria: catNorm,
                valor: valNorm
            });
        }
    } catch (e) {
        console.error("Erro ao salvar novo filtro", e);
    }
}

// ============================================================================
// 2. MUNÍCIPES (ANTIGOS PACIENTES) E HISTÓRICO
// ============================================================================

async function carregarListaPacientes() {
    const tbody = document.getElementById('tabela-pacientes-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Carregando lista...</td></tr>';
    
    try {
        const q = window.query(window.collection(window.db, "pacientes"), window.orderBy("data_criacao", "desc"));
        const querySnapshot = await window.getDocs(q);
        const pacientes = [];
        querySnapshot.forEach((doc) => {
            pacientes.push({ id: doc.id, ...doc.data() });
        });
        
        todosPacientes = pacientes;
        if(typeof renderizarPaginaPacientes === 'function') {
            window.paginacaoPacientes.dadosFiltrados = todosPacientes;
            window.paginacaoPacientes.paginaAtual = 1;
            renderizarPaginaPacientes();
        }
    } catch(e) { 
        console.error(e);
        if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Erro de conexão.</td></tr>'; 
    }
}

function filtrarPacientesNaTela() {
    const termo = document.getElementById('filtro-paciente-input').value.toLowerCase();
    const filtrados = todosPacientes.filter(p => {
        const nome = p.nome ? String(p.nome).toLowerCase() : '';
        const cpf = p.cpf ? String(p.cpf) : '';
        const municipio = p.municipio ? String(p.municipio).toLowerCase() : '';
        return nome.includes(termo) || cpf.includes(termo) || municipio.includes(termo);
    });
    if(typeof renderizarPaginaPacientes === 'function') {
        window.paginacaoPacientes.dadosFiltrados = filtrados;
        window.paginacaoPacientes.paginaAtual = 1;
        renderizarPaginaPacientes();
    }
}

async function carregarAniversarios() {
    const tbody = document.getElementById('tabela-niver-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Buscando...</td></tr>';
    const mes = parseInt(document.getElementById('filtro-niver-mes').value);
    const mesStr = mes.toString().padStart(2, '0');
    
    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, "pacientes"));
        const aniversariantes = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(data.nascimento && data.nascimento !== "") {
                const parts = data.nascimento.split('-');
                if(parts.length === 3 && parts[1] === mesStr) {
                    const dia = parseInt(parts[2]);
                    aniversariantes.push({
                        id: doc.id,
                        nome: data.nome,
                        cpf: data.cpf,
                        dia: dia,
                        data_completa: data.nascimento,
                        tel: data.tel1,
                        bairro: data.bairro
                    });
                }
            }
        });

        aniversariantes.sort((a, b) => a.dia - b.dia);
        
        tbody.innerHTML = '';
        if(aniversariantes.length === 0) { tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum aniversariante neste mês.</td></tr>'; return; }
        
        const hoje = new Date();
        const diaHoje = hoje.getDate();
        const mesHoje = hoje.getMonth() + 1;

        aniversariantes.forEach(p => {
            if(p.data_completa && p.data_completa.startsWith('1900')) return;
            let statusClass = "text-slate-600";
            let rowClass = "hover:bg-blue-50 cursor-pointer transition-all border-b border-slate-100";
            let statusText = "Futuro";
            let icone = "";

            if (mes < mesHoje) {
                statusClass = "text-slate-500";
                rowClass = "bg-slate-50 hover:bg-slate-100 cursor-pointer border-b border-slate-200 transition-colors";
                statusText = "Já foi";
                icone = "check";
            } else if (mes > mesHoje) {
                statusClass = "text-blue-600 font-medium";
                rowClass = "bg-white hover:bg-blue-50 cursor-pointer border-b border-slate-100 border-l-4 border-l-blue-300 transition-colors";
                statusText = "Futuro";
                icone = "calendar-clock";
            } else {
                if (p.dia < diaHoje) {
                    statusClass = "text-slate-500 font-medium";
                    rowClass = "bg-slate-100 hover:bg-slate-200 cursor-pointer border-b border-slate-200 transition-colors";
                    statusText = "Já foi";
                    icone = "check-circle";
                } else if (p.dia === diaHoje) {
                    statusClass = "text-emerald-700 font-bold animate-pulse";
                    rowClass = "bg-emerald-50 border-2 border-emerald-400 cursor-pointer shadow-md relative z-10";
                    statusText = "HOJE!";
                    icone = "party-popper";
                } else {
                    statusClass = "text-slate-600 font-bold";
                    rowClass = "bg-white hover:bg-slate-50 cursor-pointer border-b border-slate-100 border-l-4 border-l-slate-300 transition-colors";
                    statusText = "Em breve";
                    icone = "clock";
                }
            }

            let dataFmt = `${p.dia}/${mes}`;
            if(p.data_completa) {
                const parts = p.data_completa.split('-');
                if(parts.length === 3) {
                    const ano = parseInt(parts[0]);
                    if(ano > 1901) dataFmt = `${parts[2]}/${parts[1]}/${parts[0]}`; else dataFmt = `${parts[2]}/${parts[1]}`; 
                }
            }

            const tr = document.createElement('tr');
            tr.className = rowClass;
            tr.onclick = function() { 
                if(p.cpf || p.nome) verHistoricoCompleto(p);
                else alert("Cadastro incompleto (sem CPF/Nome).");
            };
            
            tr.innerHTML = `
                <td class="px-6 py-4 font-bold ${statusClass} flex items-center gap-2">
                    ${icone ? `<i data-lucide="${icone}" class="w-4 h-4"></i>` : ''} ${dataFmt}
                </td>
                <td class="px-6 py-4 uppercase font-medium text-slate-700">${p.nome}</td>
                <td class="px-6 py-4 text-slate-500">${p.tel||'-'}</td>
                <td class="px-6 py-4 text-slate-500 uppercase">${p.bairro||'-'}</td>
                <td class="px-6 py-4 text-xs uppercase font-bold ${statusClass}">${statusText}</td>
            `;
            tbody.appendChild(tr);
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Erro ao carregar.</td></tr>'; }
}

async function verificarCpfInicial() {
    const cpf = document.getElementById('paciente_cpf_check').value;
    const msg = document.getElementById('msg_cpf_paciente');
    const loading = document.getElementById('loading-paciente');
    
    setLoadingText('loading-paciente', "Buscando...");

    if(cpf.length < 5) { msg.innerHTML = "<span class='text-red-600 font-bold'>CPF Inválido.</span>"; return; }
    loading.classList.remove('hidden'); loading.classList.add('flex');
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    document.getElementById('resto-form-paciente').classList.add('hidden');
    pacienteAtual = null;

    try {
        const searchCpf = String(cpf).replace(/\\D/g, '');
        const q = window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", searchCpf));
        const querySnapshot = await window.getDocs(q);
        
        loading.classList.add('hidden'); loading.classList.remove('flex');
        if(!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            pacienteAtual = { id: doc.id, ...doc.data() };
            msg.innerHTML = `<span class="text-blue-700 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> Encontrado: ${pacienteAtual.nome}</span>`;
            document.getElementById('opcoes-paciente-existente').classList.remove('hidden');
        } else {
            msg.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="plus" class="w-4 h-4"></i> CPF não encontrado. Iniciando novo cadastro.</span>`;
            if(typeof mostrarFormularioPaciente === 'function') mostrarFormularioPaciente(false);
        }
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { 
        loading.classList.add('hidden'); loading.classList.remove('flex'); 
        msg.innerHTML = "Erro de conexão."; 
        console.error(e);
    }
}

async function verificarPorId(id) {
    const loading = document.getElementById('loading-paciente');
    setLoadingText('loading-paciente', "Carregando dados...");
    
    loading.classList.remove('hidden'); loading.classList.add('flex');
    try {
        const docRef = window.doc(window.db, "pacientes", id);
        const docSnap = await window.getDoc(docRef);
        
        loading.classList.add('hidden'); loading.classList.remove('flex');
        if(docSnap.exists()) {
            pacienteAtual = { id: docSnap.id, ...docSnap.data() };
            
            const msgElement = document.getElementById('msg_cpf_paciente');
            const cpfStr = pacienteAtual.cpf ? String(pacienteAtual.cpf) : '';

            if (cpfStr.length > 4) {
                msgElement.innerHTML = `<span class="text-blue-700 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> Munícipe Encontrado: ${pacienteAtual.nome}</span>`;
            } else {
                msgElement.innerHTML = `<span class="text-orange-600 font-bold flex items-center gap-1"><i data-lucide="alert-circle" class="w-4 h-4"></i> Editando cadastro sem CPF (ID: ${id})</span>`;
            }

            document.getElementById('opcoes-paciente-existente').classList.remove('hidden');
            if(typeof editarPaciente === 'function') editarPaciente();
        }
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { console.error(e); }
}

function editarPaciente() { 
    if(pacienteAtual && typeof mostrarFormularioPaciente === 'function') mostrarFormularioPaciente(true, pacienteAtual); 
}

async function submitPaciente(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const rawCpf = document.getElementById('paciente_cpf_check').value;
    data.cpf = String(rawCpf).replace(/\\D/g, '');
    
    if(!data.cpf || data.cpf.length < 5) { alert("CPF obrigatório."); return; }
    
    const loading = document.getElementById('loading-paciente');
    setLoadingText('loading-paciente', "Salvando...");
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }

    // Normalize to uppercase
    for(let k in data) {
        if(typeof data[k] === 'string' && !['cpf','id'].includes(k) && !k.includes('data')) {
            data[k] = data[k].toUpperCase();
        }
    }

    try {
        let docId = data.id;
        if (!docId) {
            // New patient
            data.data_criacao = new Date().toISOString();
            const docRef = await window.addDoc(window.collection(window.db, "pacientes"), data);
            docId = docRef.id;
        } else {
            // Update patient
            const { id, ...updateData } = data; // remove id from data
            await window.updateDoc(window.doc(window.db, "pacientes", docId), updateData);
        }

        // Salva novos filtros automaticamente
        await saveNewFilter('MUNICIPIO', data.municipio);
        await saveNewFilter('BAIRRO', data.bairro);
        await saveNewFilter('STATUS_TITULO', data.status_titulo);
        await saveNewFilter('INDICACAO', data.indicacao);
        
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showMessage('Munícipe salvo com sucesso!', 'success');
        
        if(typeof resetFormPaciente === 'function') resetFormPaciente(); 
        if(typeof voltarInicio === 'function') voltarInicio(); 
    } catch (err) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        alert("Erro ao salvar: " + err);
    }
}

// ============================================================================
// 3. ATENDIMENTOS E DASHBOARD
// ============================================================================

async function buscarPacienteParaAtendimento() {
    const termo = document.getElementById('busca_cpf').value;
    const resDiv = document.getElementById('resultado_busca');
    if(termo.length < 3) return; 
    
    resDiv.innerText = "Buscando..."; 
    document.getElementById('resto-form-atendimento').classList.add('hidden');
    
    try {
        const searchCpf = String(termo).replace(/\\D/g, '');
        const q = window.query(window.collection(window.db, "pacientes"), window.where("cpf", "==", searchCpf));
        const querySnapshot = await window.getDocs(q);
        
        if(!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            resDiv.innerHTML = `<span class="text-emerald-600 font-bold flex items-center gap-1"><i data-lucide="check" class="w-4 h-4"></i> ${data.nome}</span>`;
            document.getElementById('hidden_cpf').value = data.cpf || '';
            document.getElementById('hidden_nome').value = data.nome;
            document.getElementById('resto-form-atendimento').classList.remove('hidden');
        } else {
            resDiv.innerHTML = `<span class="text-red-500 font-medium">Munícipe não encontrado.</span>`;
        }
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch(e) { resDiv.innerText = "Erro na busca."; }
}

async function carregarListaAtendimentos() {
    const tbody = document.getElementById('tabela-atendimentos-body');
    const contador = document.getElementById('contador-atendimentos');
    
    if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400">Carregando histórico...</td></tr>';
    
    try {
        const q = window.query(window.collection(window.db, "atendimentos"), window.orderBy("data_abertura", "desc"));
        const querySnapshot = await window.getDocs(q);
        const atendimentos = [];
        querySnapshot.forEach((doc) => {
            atendimentos.push({ id: doc.id, ...doc.data() });
        });
        
        todosAtendimentos = atendimentos;
        atualizarFiltrosData();
        
        if(typeof renderizarPaginaAtendimentos === 'function') {
            window.paginacaoAtendimentos.dadosFiltrados = todosAtendimentos;
            window.paginacaoAtendimentos.paginaAtual = 1;
            renderizarPaginaAtendimentos();
        } else {
             if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-red-500 py-4">Erro: renderizarTabelaAtendimentos não encontrada.</td></tr>';
        }
    } catch(e) { 
        console.error(e);
        if(tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center text-red-500 py-4">Erro de conexão ao carregar atendimentos.</td></tr>'; 
    }
}

function atualizarFiltrosData() {
    if(!todosAtendimentos) return;
    
    const anos = new Set();
    const meses = [
        {v:'01',n:'Janeiro'},{v:'02',n:'Fevereiro'},{v:'03',n:'Março'},
        {v:'04',n:'Abril'},{v:'05',n:'Maio'},{v:'06',n:'Junho'},
        {v:'07',n:'Julho'},{v:'08',n:'Agosto'},{v:'09',n:'Setembro'},
        {v:'10',n:'Outubro'},{v:'11',n:'Novembro'},{v:'12',n:'Dezembro'}
    ];

    todosAtendimentos.forEach(at => {
        if(at.data_abertura) {
            anos.add(at.data_abertura.split('-')[0]);
        }
    });

    const selAno = document.getElementById('filtro-ano');
    const selMes = document.getElementById('filtro-mes');
    
    if(selAno) {
        const current = selAno.value;
        selAno.innerHTML = '<option value="">Ano</option>';
        Array.from(anos).sort().reverse().forEach(a => selAno.innerHTML += `<option value="${a}">${a}</option>`);
        selAno.value = current;
    }
    
    if(selMes && selMes.options.length <= 1) {
        selMes.innerHTML = '<option value="">Mês</option>';
        meses.forEach(m => selMes.innerHTML += `<option value="${m.v}">${m.n}</option>`);
    }
}

function filtrarAtendimentos() {
    if(!todosAtendimentos) return;
    
    const termo = document.getElementById('filtro-atendimento-input').value.toLowerCase();
    const status = document.getElementById('filtro-status').value;
    const mes = document.getElementById('filtro-mes').value;
    const ano = document.getElementById('filtro-ano').value;

    const filtrados = todosAtendimentos.filter(at => {
        const textoMatch = (at.nome_paciente && at.nome_paciente.toLowerCase().includes(termo)) ||
                           (at.cpf_paciente && String(at.cpf_paciente).includes(termo)) ||
                           (at.especialidade && at.especialidade.toLowerCase().includes(termo)) ||
                           (at.tipo_servico && at.tipo_servico.toLowerCase().includes(termo));
        
        if(!textoMatch) return false;
        if(status && at.status !== status) return false;
        
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(mes && m !== mes) return false;
        if(ano && y !== ano) return false;

        return true;
    });

    if(typeof renderizarPaginaAtendimentos === 'function') {
        window.paginacaoAtendimentos.dadosFiltrados = filtrados;
        window.paginacaoAtendimentos.paginaAtual = 1;
        renderizarPaginaAtendimentos();
    }
}

async function loadDashboard() {
    try {
        const pacSnap = await window.getDocs(window.collection(window.db, "pacientes"));
        const atendSnap = await window.getDocs(window.collection(window.db, "atendimentos"));
        
        const pacientes = [];
        pacSnap.forEach(doc => pacientes.push({id: doc.id, ...doc.data()}));
        
        const atendimentos = [];
        atendSnap.forEach(doc => atendimentos.push({id: doc.id, ...doc.data()}));
        
        dashboardRawData = { pacientes, atendimentos };
        
        if(typeof popularFiltroAno === 'function') popularFiltroAno();
        if(typeof aplicarFiltrosDashboard === 'function') aplicarFiltrosDashboard();
    } catch(e) { console.error(e); }
}

function popularFiltroAno() {
    if(!dashboardRawData) return;
    const anos = new Set();
    dashboardRawData.atendimentos.forEach(at => {
        if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]);
    });
    const sel = document.getElementById('dash-filter-ano');
    const current = sel.value;
    sel.innerHTML = '<option value="">Ano: Todos</option>';
    Array.from(anos).sort().reverse().forEach(a => sel.innerHTML += `<option value="${a}">${a}</option>`);
    if(current) sel.value = current;
}

function aplicarFiltrosDashboard() {
    if(!dashboardRawData) return;
    
    const fStatus = document.getElementById('dash-filter-status').value;
    const fMes = document.getElementById('dash-filter-mes').value;
    const fAno = document.getElementById('dash-filter-ano').value;
    
    const temFiltroAtivo = fStatus !== "" || fMes !== "" || fAno !== "";

    const atendimentosFiltrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus && at.status !== fStatus) return false;
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        return true;
    });

    let pacientesFiltrados;
    if (temFiltroAtivo) {
        const cpfsNosAtendimentos = new Set(atendimentosFiltrados.map(at => at.cpf_paciente));
        pacientesFiltrados = dashboardRawData.pacientes.filter(p => cpfsNosAtendimentos.has(p.cpf));
    } else {
        pacientesFiltrados = dashboardRawData.pacientes;
    }

    const totalPacientes = pacientesFiltrados.length; 
    const totalAtendimentos = atendimentosFiltrados.length;
    const totalPendentes = atendimentosFiltrados.filter(at => at.status === 'PENDENTE').length;

    document.getElementById('dash-pacientes').innerText = totalPacientes;
    document.getElementById('dash-mes').innerText = totalAtendimentos;
    document.getElementById('dash-pendentes').innerText = totalPendentes;

    if(typeof renderizarGraficos === 'function') renderizarGraficos(atendimentosFiltrados, pacientesFiltrados);
    calcularMetricasTempo(atendimentosFiltrados);
    if(typeof renderizarTorreGenero === 'function') renderizarTorreGenero(pacientesFiltrados);
}

function calcularMetricasTempo(atendimentos) {
    const hoje = new Date();
    let totalDiasEspera = 0;
    let countEspera = 0;
    let totalDiasMarcacao = 0;
    let countMarcacao = 0;

    atendimentos.forEach(at => {
        if(!at.data_abertura) return;
        const dAbertura = new Date(at.data_abertura);
        
        if(at.status === 'PENDENTE') {
            const diffTime = Math.abs(hoje - dAbertura);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            totalDiasEspera += diffDays;
            countEspera++;
        } else if (at.data_marcacao) {
            const dMarcacao = new Date(at.data_marcacao);
            const diffTime = Math.abs(dMarcacao - dAbertura);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            totalDiasEspera += diffDays;
            countEspera++;
            totalDiasMarcacao += diffDays;
            countMarcacao++;
        }
    });

    const mediaEspera = countEspera > 0 ? Math.round(totalDiasEspera / countEspera) : 0;
    const mediaMarcacao = countMarcacao > 0 ? Math.round(totalDiasMarcacao / countMarcacao) : 0;

    document.getElementById('dash-tempo-espera').innerText = mediaEspera;
    document.getElementById('dash-tempo-marcacao').innerText = mediaMarcacao;
    document.getElementById('dash-tempo-total').innerText = mediaEspera;
}

async function initParceiros() {
    if(!dashboardRawData) {
        await loadDashboard();
    }
    if(!dashboardRawData) return;

    const selAno = document.getElementById('parc-filter-ano');
    if(selAno.options.length <= 1) {
        const anos = new Set();
        dashboardRawData.atendimentos.forEach(at => { if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]); });
        Array.from(anos).sort().reverse().forEach(a => selAno.innerHTML += `<option value="${a}">${a}</option>`);
    }

    const fStatus = document.getElementById('parc-filter-status').value;
    const fMes = document.getElementById('parc-filter-mes').value;
    const fAno = document.getElementById('parc-filter-ano').value;
    const hoje = new Date();

    const filtrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus && at.status !== fStatus) return false;
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        return true;
    });

    if(typeof createChart === 'function' && typeof countByField === 'function') {
        const dadosParceiros = countByField(filtrados, 'parceiro');
        createChart('chartParceirosRanking', 'bar', 
            dadosParceiros.map(d => d[0]), 
            dadosParceiros.map(d => d[1]), 
            { 
                indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true } }, backgroundColor: '#10b981'
            }
        );
        
        const dadosProc = countByField(filtrados, 'procedimento');
        const topProc = dadosProc;
        createChart('chartProcedimentosGeral', 'bar', 
            topProc.map(d => d[0]), topProc.map(d => d[1]), 
            { 
                responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }, backgroundColor: '#8b5cf6'
            }
        );
    }

    const mapPacientes = {};
    if (dashboardRawData.pacientes) {
        dashboardRawData.pacientes.forEach(p => mapPacientes[p.cpf] = p);
    }

    const liderancaStats = {};
    
    // Contar total de pacientes indicados primeiro
    if (dashboardRawData.pacientes) {
        dashboardRawData.pacientes.forEach(p => {
            let ind = p.indicacao;
            let isLider = (p.lideranca === 'SIM');
            
            if (!ind || ind.trim() === '' || ind === 'null' || ind === 'undefined') {
                ind = 'SEM INDICAÇÃO';
            } else {
                ind = ind.trim().toUpperCase();
            }
            
            if(!liderancaStats[ind]) {
                liderancaStats[ind] = { nome: ind, total_pacientes: 0, total: 0, concluido: 0, pendente: 0, qtd: 0, isLider: false, lista: [] };
            }
            
            liderancaStats[ind].total_pacientes++;
            if(isLider) liderancaStats[ind].isLider = true;
        });
    }
    
    filtrados.forEach(at => {
        let ind = null;
        let isLider = false;
        
        if (at.cpf_paciente && mapPacientes[at.cpf_paciente]) {
            const p = mapPacientes[at.cpf_paciente];
            ind = p.indicacao || at.indicacao;
            isLider = (p.lideranca === 'SIM' || at.lideranca === 'SIM');
        } else {
            ind = at.indicacao;
            isLider = (at.lideranca === 'SIM');
        }
        
        if (!ind || ind.trim() === '' || ind === 'null' || ind === 'undefined') {
            ind = 'SEM INDICAÇÃO';
        } else {
            ind = ind.trim().toUpperCase();
        }
        
        if(!liderancaStats[ind]) {
            liderancaStats[ind] = { nome: ind, total_pacientes: 0, total: 0, concluido: 0, pendente: 0, qtd: 0, isLider: false, lista: [] };
        }
        
        const stat = liderancaStats[ind];
        if(isLider) stat.isLider = true;
        stat.total++;
        stat.qtd++;
        if(at.status === 'CONCLUIDO') stat.concluido++; else stat.pendente++;
        
        let dias = 0;
        if(at.data_abertura) {
            const inicio = new Date(at.data_abertura);
            let fim = hoje;
            if(at.data_marcacao) fim = new Date(at.data_marcacao);
            const diffTime = Math.abs(fim - inicio);
            dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        stat.lista.push({ 
            ...at, 
            id: at.id, 
            cpf: at.cpf_paciente || at.cpf, 
            nome: at.nome_paciente || at.nome || 'Nome não carregado', 
            diasEspera: dias 
        });
    });

    const listaLideranca = Object.values(liderancaStats).sort((a,b) => b.total - a.total);
    window.dadosRelatorioCache['lideranca'] = listaLideranca;

    const tbody = document.getElementById('tabela-lideranca-body');
    tbody.innerHTML = '';
    
    if(listaLideranca.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-slate-400 text-xs">Sem dados com estes filtros.</td></tr>';
    } else {
        listaLideranca.forEach((stat, index) => {
            const perc = Math.round((stat.concluido / stat.total) * 100) || 0;
            const corBarra = perc > 70 ? 'bg-emerald-500' : (perc > 40 ? 'bg-blue-500' : 'bg-orange-400');
            
            tbody.innerHTML += `
                <tr class="hover:bg-blue-50 border-b border-slate-50 transition cursor-pointer group" onclick="abrirListaRelatorio('lideranca', ${index})">
                    <td class="px-2 py-2 font-bold text-slate-700 text-xs truncate max-w-[120px] group-hover:text-blue-700" title="${stat.nome}">
                        ${stat.nome} 
                        ${stat.isLider ? '<span class="ml-1 bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Líder</span>' : ''}
                        <i data-lucide="search" class="w-3 h-3 inline opacity-0 group-hover:opacity-100 ml-1"></i>
                    </td>
                    <td class="px-2 py-2 text-center font-mono font-bold text-blue-700">${stat.total_pacientes}</td>
                    <td class="px-2 py-2 text-center font-mono font-bold text-indigo-700">${stat.total}</td>
                    <td class="px-2 py-2 text-center font-mono text-emerald-600">${stat.concluido}</td>
                    <td class="px-2 py-2 text-center font-mono text-orange-600">${stat.pendente}</td>
                    <td class="px-2 py-2 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <span class="text-[10px] font-bold text-slate-500">${perc}%</span>
                            <div class="w-8 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div class="h-full ${corBarra}" style="width: ${perc}%"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        });
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
}

async function initRelatorios() {
    if(!dashboardRawData) {
        await loadDashboard();
    }
    
    const selAno = document.getElementById('rel-filter-ano');
    if(selAno && selAno.options.length <= 1 && dashboardRawData) {
        const anos = new Set();
        dashboardRawData.atendimentos.forEach(at => {
            if(at.data_abertura) anos.add(at.data_abertura.split('-')[0]);
        });
        Array.from(anos).sort().reverse().forEach(a => selAno.innerHTML += `<option value="${a}">${a}</option>`);
    }

    carregarRelatorioRisco();
    atualizarGraficosRelatorios();
}

function carregarRelatorioRisco() {
    const tbody = document.getElementById('tabela-risco-body');
    if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Calculando...</td></tr>';
    
    if(todosAtendimentos.length === 0) {
        if(typeof carregarListaAtendimentos === 'function') {
            carregarListaAtendimentos().then(() => renderizarRelatorioRisco());
        } else {
            renderizarRelatorioRisco();
        }
    } else {
        renderizarRelatorioRisco();
    }
}

function renderizarRelatorioRisco() {
    const tbody = document.getElementById('tabela-risco-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const hoje = new Date();
    const trintaDias = new Date();
    trintaDias.setDate(hoje.getDate() + 30);

    const listaRisco = todosAtendimentos.filter(at => {
        if(!at.data_risco || at.status === 'CONCLUIDO' || at.status === 'CANCELADO') return false;
        const dRisco = new Date(at.data_risco);
        return dRisco <= trintaDias;
    }).sort((a,b) => new Date(a.data_risco) - new Date(b.data_risco));

    if(listaRisco.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Nenhum atendimento em risco próximo.</td></tr>';
        return;
    }

    listaRisco.forEach(at => {
        const dRisco = new Date(at.data_risco);
        const diasRestantes = Math.ceil((dRisco - hoje) / (1000 * 60 * 60 * 24));
        
        let badgeClass = "bg-orange-100 text-orange-700";
        let textoPrazo = `${diasRestantes} dias`;
        
        if(diasRestantes < 0) {
            badgeClass = "bg-red-100 text-red-700 font-bold";
            textoPrazo = `VENCIDO (${Math.abs(diasRestantes)} dias)`;
        } else if(diasRestantes <= 7) {
            badgeClass = "bg-red-50 text-red-600 font-bold";
        }

        const tempId = 'risco_' + Math.random().toString(36).substr(2, 9);
        window[tempId] = at;

        const tr = document.createElement('tr');
        tr.className = "border-b border-slate-100 hover:bg-red-50 transition-colors cursor-pointer";
        tr.innerHTML = `
            <td class="px-6 py-4 text-sm font-medium text-slate-800">
                ${at.data_risco.split('-').reverse().join('/')}
                <div class="text-xs ${badgeClass} inline-block px-2 py-0.5 rounded mt-1">${textoPrazo}</div>
            </td>
            <td class="px-6 py-4 text-slate-700 uppercase text-xs font-bold">${at.nome_paciente || at.nome || '-'}</td>
            <td class="px-6 py-4 text-slate-600 text-xs uppercase">${at.procedimento || at.tipo_servico || '-'}<br>${at.local || ''}</td>
            <td class="px-6 py-4 text-xs font-bold text-slate-500">${at.status}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="event.stopPropagation(); abrirEdicaoAtendimentoId('${at.id}')" class="btn-action bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition" title="Editar"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
            </td>
        `;
        tr.onclick = () => abrirDetalheAtendimento(window[tempId]);
        tbody.appendChild(tr);
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
    if(typeof aplicarPermissoes === 'function' && typeof currentUserRole !== 'undefined') aplicarPermissoes();
}

function atualizarGraficosRelatorios() {
    if(!dashboardRawData) return;

    const fStatus = document.getElementById('rel-filter-status').value;
    const fMes = document.getElementById('rel-filter-mes').value;
    const fAno = document.getElementById('rel-filter-ano').value;
    const hoje = new Date();

    const dadosFiltrados = dashboardRawData.atendimentos.filter(at => {
        const [y, m, d] = at.data_abertura ? at.data_abertura.split('-') : ['','',''];
        if(fStatus && at.status !== fStatus) return false;
        if(fMes && m !== fMes) return false;
        if(fAno && y !== fAno) return false;
        return true;
    });

    const calcularDias = (at) => {
        if(!at.data_abertura) return 0;
        const inicio = new Date(at.data_abertura);
        let fim = hoje; 
        if(at.data_marcacao) {
            fim = new Date(at.data_marcacao);
        } else if (at.status === 'CONCLUIDO') {
            return null; 
        }
        const diffTime = Math.abs(fim - inicio);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const processarMedia = (campo) => {
        const grupos = {};
        dadosFiltrados.forEach(at => {
            const chave = at[campo] ? at[campo].trim().toUpperCase() : 'N/I';
            const dias = calcularDias(at);
            if(dias !== null) {
                if(!grupos[chave]) grupos[chave] = { total: 0, qtd: 0, lista: [] };
                grupos[chave].total += dias;
                grupos[chave].qtd++;
                const atNormalizado = { ...at, id: at.id, cpf: at.cpf_paciente, nome: at.nome_paciente || 'Nome não carregado', diasEspera: dias };
                grupos[chave].lista.push(atNormalizado);
            }
        });
        return Object.entries(grupos)
            .map(([nome, dados]) => ({ 
                nome, mediaDias: Math.round(dados.total / dados.qtd), qtd: dados.qtd, lista: dados.lista.sort((a,b) => b.diasEspera - a.diasEspera) 
            }))
            .sort((a,b) => b.mediaDias - a.mediaDias) 
            .slice(0, 10); 
    };

    const dadosEspecialidade = processarMedia('especialidade');
    const dadosProcedimento = processarMedia('procedimento');

    window.dadosRelatorioCache['especialidade'] = dadosEspecialidade;
    window.dadosRelatorioCache['procedimento'] = dadosProcedimento;

    renderizarTabelaGrafica('listaRelEspecialidade', dadosEspecialidade, 'bg-rose-500', 'especialidade');
    renderizarTabelaGrafica('listaRelProcedimento', dadosProcedimento, 'bg-violet-500', 'procedimento');
}

function renderizarTabelaGrafica(containerId, dados, corBarra, tipo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if(dados.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-sm italic text-center py-4">Sem dados para o período.</p>';
        return;
    }

    const maxDias = Math.max(...dados.map(d => d.mediaDias)) || 1;

    dados.forEach((d, index) => {
        const porcentagem = (d.mediaDias / maxDias) * 100;
        const meses = (d.mediaDias / 30).toFixed(1); 
        
        const html = `
            <div class="group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition" onclick="abrirListaRelatorio('${tipo}', ${index})">
                <div class="flex justify-between text-xs mb-1 text-slate-700">
                    <span class="font-bold truncate pr-2 w-1/2 flex items-center gap-1 group-hover:text-blue-600 transition">
                        ${d.nome} <i data-lucide="chevron-right" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition"></i>
                    </span>
                    <span class="text-slate-500 font-mono bg-white px-1 rounded border border-slate-100">${d.qtd} atd.</span>
                </div>
                <div class="flex items-center gap-2 h-6" title="Média exata: ${d.mediaDias} dias">
                    <div class="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div class="h-full rounded-full ${corBarra} opacity-80 group-hover:opacity-100 transition-all" style="width: ${porcentagem}%"></div>
                    </div>
                    <span class="text-xs font-bold text-slate-600 w-16 text-right">${meses} meses</span>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

// ============================================================================
// 6. FUNÇÕES DE EXCLUSÃO (API) E CADASTRO DE ATENDIMENTO
// ============================================================================

async function excluirPacienteAPI(id, cpf) {
    const loading = document.getElementById('loading-paciente');
    setLoadingText('loading-paciente', "Excluindo...");
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }

    try {
        await window.deleteDoc(window.doc(window.db, "pacientes", id));
        
        // Cascading delete for atendimentos
        const searchCpf = String(cpf).replace(/\\D/g, '');
        const q = window.query(window.collection(window.db, "atendimentos"), window.where("cpf_paciente", "==", searchCpf));
        const querySnapshot = await window.getDocs(q);
        
        const batch = window.writeBatch(window.db);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showMessage("Munícipe e atendimentos excluídos.", 'success');
        
        if(typeof resetFormPaciente === 'function') resetFormPaciente();
        if(typeof voltarInicio === 'function') voltarInicio();
    } catch(e) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        alert("Erro ao excluir: " + e);
    }
}

async function excluirAtendimentoAPI(id) {
    const loading = document.getElementById('loading-atendimento');
    setLoadingText('loading-atendimento', "Excluindo...");
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }

    try {
        await window.deleteDoc(window.doc(window.db, "atendimentos", id));
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        showMessage("Atendimento excluído.", 'success');
        
        if(typeof resetFormAtendimento === 'function') resetFormAtendimento();
        if(typeof voltarInicio === 'function') voltarInicio();
    } catch(e) {
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        alert("Erro ao excluir: " + e);
    }
}

// O restante do submitAtendimento está no ui.js, porém ui.js chamava sendData('registerServiceBatch' ou 'registerService')
// Vamos criar essas funções globais de wrapper aqui para ui.js continuar usando como sendData,
// ou alterar ui.js. Para ser menos intrusivo, farei o `sendData` atuar como ponte
async function sendData(action, data, loadingId) {
    const loading = document.getElementById(loadingId);
    setLoadingText(loadingId, "Salvando...");
    if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }
    
    const normalize = (obj) => {
        for(let k in obj) {
            if(typeof obj[k] === 'string' && !['cpf','cpf_paciente','id'].includes(k) && !k.includes('data')) {
                obj[k] = obj[k].toUpperCase();
            }
        }
    };

    if (Array.isArray(data)) {
        data.forEach(normalize);
    } else {
        normalize(data);
    }

    try {
        if (action === 'registerService') {
            const { id, ...updateData } = data;
            if (id) {
                await window.updateDoc(window.doc(window.db, "atendimentos", id), updateData);
            } else {
                await window.addDoc(window.collection(window.db, "atendimentos"), updateData);
            }
            await saveNewFilter('CATEGORIAS', data.tipo_servico);
            await saveNewFilter('PARCEIRO', data.parceiro);
            await saveNewFilter('LOCAL', data.local);
            await saveNewFilter('ESPECIALIDADE', data.especialidade);
            await saveNewFilter('ATENDIMENTO', data.tipo);
            await saveNewFilter('PROCEDIMENTO_EXAMES', data.procedimento);

            if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
            showMessage('Atendimento atualizado com sucesso!', 'success');
            return true;
        }
        else if (action === 'registerServiceBatch') {
            const batch = window.writeBatch(window.db);
            const atendimentosRef = window.collection(window.db, "atendimentos");
            
            data.forEach(item => {
                const docRef = window.doc(atendimentosRef); // Auto-generate ID
                batch.set(docRef, item);
                
                // Fire-and-forget filter save
                saveNewFilter('CATEGORIAS', item.tipo_servico);
                saveNewFilter('PARCEIRO', item.parceiro);
                saveNewFilter('LOCAL', item.local);
                saveNewFilter('ESPECIALIDADE', item.especialidade);
                saveNewFilter('ATENDIMENTO', item.tipo);
                saveNewFilter('PROCEDIMENTO_EXAMES', item.procedimento);
            });
            await batch.commit();

            if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
            showMessage(`${data.length} atendimentos salvos!`, 'success');
            return true;
        }
        else if (action === 'registerPatient') {
             // Already handled in submitPaciente directly, but adding just in case
             // fallback to original api.js usage
             const { id, ...updateData } = data;
             if (id) {
                 await window.updateDoc(window.doc(window.db, "pacientes", id), updateData);
             } else {
                 updateData.data_criacao = new Date().toISOString();
                 await window.addDoc(window.collection(window.db, "pacientes"), updateData);
             }
             if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
             showMessage('Munícipe salvo com sucesso!', 'success');
             return true;
        }
        
    } catch(e) { 
        if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
        console.error("Erro na operação:", e);
        alert("Erro de conexão: " + e); 
        return false; 
    }
}
