// Alertas e Pendências
// Responsável por buscar, classificar e exibir atendimentos pendentes há muito tempo.

async function renderizarAlertas() {
    const tbody = document.getElementById('tbody-alertas');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-slate-400"><i data-lucide="loader" class="w-6 h-6 animate-spin mx-auto mb-2"></i>Buscando pendências...</td></tr>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const q = window.query(window.collection(window.db, "atendimentos"), window.where("status", "==", "PENDENTE"));
        const snapshot = await window.getDocs(q);

        let pendencias = [];
        const hoje = new Date();

        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            
            if (data.data_abertura) {
                const [ano, mes, dia] = data.data_abertura.split('-');
                const dataAbertura = new Date(ano, mes - 1, dia);
                const diffTime = Math.abs(hoje - dataAbertura);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                data.diasEspera = diffDays;
                
                if (diffDays >= 90) {
                    pendencias.push(data);
                }
            }
        });

        // Ordenar por mais antigos primeiro
        pendencias.sort((a, b) => b.diasEspera - a.diasEspera);

        // Atualizar KPIs
        const kpi90 = pendencias.filter(p => p.diasEspera >= 90 && p.diasEspera < 180).length;
        const kpi180 = pendencias.filter(p => p.diasEspera >= 180 && p.diasEspera < 365).length;
        const kpi365 = pendencias.filter(p => p.diasEspera >= 365).length;

        document.getElementById('kpi-90d').innerText = kpi90;
        document.getElementById('kpi-180d').innerText = kpi180;
        document.getElementById('kpi-365d').innerText = kpi365;

        // Atualiza Badge do Menu se existir
        const badge = document.getElementById('badge-alertas');
        if (badge) {
            if (pendencias.length > 0) badge.classList.remove('hidden');
            else badge.classList.add('hidden');
        }

        // Filtro selecionado
        const filtro = document.getElementById('filtro-alertas-idade').value;
        let listaFiltrada = pendencias;
        if (filtro === '90') listaFiltrada = pendencias.filter(p => p.diasEspera >= 90 && p.diasEspera < 180);
        else if (filtro === '180') listaFiltrada = pendencias.filter(p => p.diasEspera >= 180 && p.diasEspera < 365);
        else if (filtro === '365') listaFiltrada = pendencias.filter(p => p.diasEspera >= 365);

        if (listaFiltrada.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-slate-400">Nenhuma pendência crítica encontrada.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        listaFiltrada.forEach(at => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-800";
            
            let corIdade = 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
            let labelIdade = 'Atenção';
            if (at.diasEspera >= 365) { corIdade = 'text-red-600 bg-red-50 dark:bg-red-900/20'; labelIdade = 'Urgente'; }
            else if (at.diasEspera >= 180) { corIdade = 'text-orange-600 bg-orange-50 dark:bg-orange-900/20'; labelIdade = 'Crítico'; }

            tr.innerHTML = `
                <td class="px-4 py-3 cursor-pointer" onclick='abrirDetalheAtendimentoCompleto(${JSON.stringify(at)})'>
                    <div class="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">${at.nome_paciente || at.nome || 'Sem Nome'}</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><i data-lucide="calendar" class="w-3 h-3"></i> Aberto em ${at.data_abertura ? at.data_abertura.split('-').reverse().join('/') : '-'}</div>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell cursor-pointer" onclick='abrirDetalheAtendimentoCompleto(${JSON.stringify(at)})'>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${corIdade} border border-current border-opacity-20">
                        ${at.diasEspera} dias (${labelIdade})
                    </span>
                </td>
                <td class="px-4 py-3 hidden md:table-cell cursor-pointer text-[11px] text-slate-500 dark:text-slate-400" onclick='abrirDetalheAtendimentoCompleto(${JSON.stringify(at)})'>
                    ${at.tipo_servico || '-'} ${at.procedimento ? `<span class="block opacity-70">${at.procedimento}</span>` : ''}
                </td>
                <td class="px-4 py-3 text-right">
                    <button onclick="contatarMunicipe('${at.id_paciente}')" class="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-2 rounded-lg transition" title="Enviar WhatsApp">
                        <i data-lucide="message-circle" class="w-5 h-5"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if(typeof lucide !== 'undefined') lucide.createIcons();

    } catch (e) {
        console.error("Erro ao carregar alertas:", e);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-6 text-red-500">Erro ao carregar pendências.</td></tr>';
    }
}

function abrirDetalheAtendimentoCompleto(at) {
    if (typeof abrirDetalheAtendimento === 'function') {
        abrirDetalheAtendimento(at);
    }
}

async function contatarMunicipe(idPaciente) {
    if (!idPaciente) {
        if(typeof showMessage === 'function') showMessage("Paciente não vinculado a este atendimento.", "error");
        return;
    }
    try {
        const docSnap = await window.getDoc(window.doc(window.db, "pacientes", idPaciente));
        if (docSnap.exists()) {
            const data = docSnap.data();
            let num = data.telefone || data.whatsapp || '';
            if (!num) {
                if(typeof showMessage === 'function') showMessage("Paciente não possui telefone cadastrado.", "error");
                return;
            }
            num = num.replace(/\D/g, '');
            if (num.length >= 10) {
                // Abrir modal do zap se existir
                if (typeof abrirModalZapPersonalizado === 'function') {
                    abrirModalZapPersonalizado(data.nome, num);
                } else {
                    window.open(`https://wa.me/55${num}`, '_blank');
                }
            } else {
                if(typeof showMessage === 'function') showMessage("Número de telefone inválido.", "error");
            }
        } else {
            if(typeof showMessage === 'function') showMessage("Cadastro do paciente não encontrado.", "error");
        }
    } catch (e) {
        console.error("Erro ao buscar contato do munícipe", e);
    }
}

// Pequena função auxiliar para zap
function abrirModalZapPersonalizado(nome, telefone) {
    // Utiliza o modal existente (zap-v2 ou similar)
    const textoBase = `Olá ${nome}, tudo bem? Aqui é do gabinete. Gostaríamos de atualizar o status da sua solicitação pendente conosco...`;
    
    // Se o modal de zap confirmação existir (usado em agenda)
    const modalConfirmacao = document.getElementById('modal-zap-confirmacao');
    if (modalConfirmacao) {
        document.getElementById('zap-data').value = "";
        document.getElementById('zap-hora').value = "";
        document.getElementById('zap-texto-final').value = textoBase;
        
        // Sobrescrever a função do botão de enviar momentaneamente
        const oldSendBtn = document.querySelector('#modal-zap-confirmacao button.bg-emerald-500');
        if (oldSendBtn) {
            const newBtn = oldSendBtn.cloneNode(true);
            oldSendBtn.parentNode.replaceChild(newBtn, oldSendBtn);
            newBtn.onclick = function() {
                const finalMsg = document.getElementById('zap-texto-final').value;
                const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(finalMsg)}`;
                window.open(url, '_blank');
                modalConfirmacao.classList.add('hidden');
            };
        }
        
        modalConfirmacao.classList.remove('hidden');
    } else {
        window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(textoBase)}`, '_blank');
    }
}
