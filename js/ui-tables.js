// 7. RELATÓRIO ELEITORAL (NOVO)
// ============================================================================

function abrirRelatorioEleitoral(filtroInicial = '') {
    if (!dashboardRawData || !dashboardRawData.pacientes) {
        showModalAlert("Dados do dashboard ainda não carregados. Aguarde um momento.");
        return;
    }

    const basePacientes = window.pacientesDashboardFiltrados || dashboardRawData.pacientes;

    const modal = document.getElementById('modal-relatorio-eleitoral');
    modal.classList.remove('hidden');

    const statusSet = new Set();
    basePacientes.forEach(p => {
        const st = p.status_titulo ? p.status_titulo.trim().toUpperCase() : 'N/I';
        statusSet.add(st);
    });
    
    const sel = document.getElementById('filtro-modal-eleitoral');
    sel.innerHTML = '<option value="">Todos os Status</option>';
    Array.from(statusSet).sort().forEach(s => {
        sel.innerHTML += `<option value="${s}">${s}</option>`;
    });

    if (filtroInicial) {
        sel.value = filtroInicial;
    } else {
        sel.value = "";
    }

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

    const basePacientes = window.pacientesDashboardFiltrados || dashboardRawData.pacientes;

    const lista = basePacientes.filter(p => {
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
        showModalAlert("Aguarde o carregamento dos dados.");
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
        showModalAlert("Nenhum munícipe selecionado para impressão.");
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
                        <div style="${styleValue}">${p.nascimento ? p.nascimento.split('-').reverse().join('/') + ' (' + (window.calcularIdade ? window.calcularIdade(p.nascimento) : '') + ')' : '-'}</div>
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
        btnHistDelete.setAttribute('data-id', p.id || '');
        btnHistDelete.setAttribute('data-cpf', p.cpf || '');
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
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Data Nasc.</span> <span class="font-medium text-slate-800">${p.nascimento ? p.nascimento.split('-').reverse().join('/') + ' (' + (window.calcularIdade ? window.calcularIdade(p.nascimento) : '') + ')' : '-'}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">RG</span> <span class="font-medium text-slate-800">${p.rg || '-'}</span></div>
            
            ${p.nome_social ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Nome Social</span> <span class="font-medium text-slate-800">${p.nome_social}</span></div>` : ''}
            ${p.conjuge ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Cônjuge</span> <span class="font-medium text-slate-800">${p.conjuge}</span></div>` : ''}
            ${p.profissao ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Profissão</span> <span class="font-medium text-slate-800">${p.profissao}</span></div>` : ''}
            ${p.cargo_eclesiastico ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Cargo Ecles.</span> <span class="font-medium text-slate-800">${p.cargo_eclesiastico}</span></div>` : ''}
            ${p.prontuario ? `<div><span class="block text-xs font-bold text-slate-400 uppercase">Nº Prontuário</span> <span class="font-medium text-slate-800 font-mono text-emerald-700">${p.prontuario}</span></div>` : ''}
            
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Município</span> <span class="font-medium text-slate-800">${municipio}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Bairro</span> <span class="font-medium text-slate-800">${bairro}</span></div>
            <div class="md:col-span-2"><span class="block text-xs font-bold text-slate-400 uppercase">Endereço</span> <span class="font-medium text-slate-800">${logradouro}</span></div>
            
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Situação Eleitoral</span> <span class="font-medium text-slate-800">${situacao}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Zona/Seção</span> <span class="font-medium text-slate-800">${p.zona || '-'}/${p.secao || '-'}</span></div>
            <div><span class="block text-xs font-bold text-slate-400 uppercase">Família</span> <span class="font-medium text-slate-800">${p.familia || '-'}</span></div>
            
            ${p.parentes ? `<div class="md:col-span-3 mt-2 pt-2 border-t border-slate-100"><span class="block text-xs font-bold text-slate-400 uppercase">Vínculos Familiares</span> <p class="text-slate-800 whitespace-pre-line text-sm">${p.parentes}</p></div>` : ''}
            ${p.obs ? `<div class="md:col-span-3 mt-2 pt-2 border-t border-slate-100"><span class="block text-xs font-bold text-slate-400 uppercase">Observações</span> <p class="italic text-slate-600">${p.obs}</p></div>` : ''}
            ${p.documentos_link ? `<div class="md:col-span-3 mt-2 pt-2 border-t border-slate-100"><span class="block text-xs font-bold text-slate-400 uppercase mb-2">Documentos Anexos</span> <a href="${p.documentos_link}" target="_blank" class="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold py-2 px-4 rounded-lg transition text-sm"><i data-lucide="external-link" class="w-4 h-4"></i> Acessar Pasta de Documentos</a></div>` : ''}
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
                                ${at.data_conclusao ? `
                                <div class="col-span-2 sm:col-span-1 bg-emerald-50 p-2 rounded border border-emerald-100 mt-2">
                                    <span class="text-[10px] font-bold text-emerald-600 uppercase block">Conclusão / Prazo</span>
                                    <span class="font-bold text-emerald-800">${at.data_conclusao.split('-').reverse().join('/')} <span class="text-xs ml-1 text-emerald-600">(${Math.ceil((new Date(at.data_conclusao) - new Date(at.data_abertura)) / (1000 * 60 * 60 * 24))} dias)</span></span>
                                </div>` : ''}
                                ${at.obs_atendimento ? `
                                <div class="col-span-2 mt-2 pt-2 border-t border-slate-100">
                                    <span class="text-[10px] font-bold text-slate-400 uppercase block">Observações</span>
                                    <p class="text-slate-500 italic text-xs line-clamp-2">${at.obs_atendimento}</p>
                                </div>` : ''}
                                ${at.anexos_link ? `
                                <div class="col-span-2 mt-2 pt-2 border-t border-slate-100">
                                    <a href="${at.anexos_link}" target="_blank" class="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold py-1.5 px-3 rounded-lg transition text-xs"><i data-lucide="paperclip" class="w-3 h-3"></i> Anexos do Atendimento</a>
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
    if (!todosPacientes || todosPacientes.length === 0) {
        if (typeof carregarListaPacientes === 'function') await carregarListaPacientes();
    }
    if (!todosAtendimentos || todosAtendimentos.length === 0) {
        if (typeof carregarListaAtendimentos === 'function') await carregarListaAtendimentos();
    }

    const tipo = document.getElementById('listagem-tipo').value;
    const lblFiltro = document.getElementById('lbl-filtro-secundario');
    const selMes = document.getElementById('inp-filtro-secundario-mes');
    const txtBusca = document.getElementById('inp-filtro-secundario-texto');
    if (txtBusca) txtBusca.value = ''; // Limpa a busca anterior ao mudar de filtro
    const containerTxt = document.getElementById('container-filtro-texto') || txtBusca;
    const datalist = document.getElementById('listagens-datalist');

    if (txtBusca && !txtBusca.dataset.clickBound) {
        txtBusca.addEventListener('click', function() {
            if (this.list && typeof this.showPicker === 'function') {
                try { this.showPicker(); } catch(e) {}
            }
        });
        txtBusca.addEventListener('input', function() {
            if (this.list && this.value) {
                const isSelected = Array.from(this.list.options).some(opt => opt.value === this.value);
                if (isSelected) {
                    if (typeof gerarListagem === 'function') gerarListagem();
                }
            }
        });
        txtBusca.dataset.clickBound = "true";
    }

    selMes.classList.add('hidden');
    containerTxt.classList.add('hidden');
    if (datalist) datalist.innerHTML = '';

    if (tipo === 'aniversariantes') {
        lblFiltro.innerText = "Selecione o Mês";
        selMes.classList.remove('hidden');
    } else if (tipo === 'pendentes') {
        lblFiltro.innerText = "Filtro Automático";
        containerTxt.classList.remove('hidden');
        txtBusca.disabled = true;
        txtBusca.placeholder = "Todos os pendentes...";
    } else {
        containerTxt.classList.remove('hidden');
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
            lblFiltro.innerText = "Listagem de Lideranças";
            containerTxt.classList.add('hidden'); // Sem campo de busca
        }
        
        if (targetField && todosPacientes && datalist) {
            let uniqueValues = new Set();
            let hasEmpty = false;
            todosPacientes.forEach(p => {
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
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function gerarListagem() {
    const tipo = document.getElementById('listagem-tipo').value;
    const mes = document.getElementById('inp-filtro-secundario-mes').value;
    const texto = document.getElementById('inp-filtro-secundario-texto').value.trim().toUpperCase();
    
    const tbody = document.getElementById('tabela-listagem-body');
    const thead = document.getElementById('tabela-listagem-head');
    
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">Carregando dados...</td></tr>';
    
    if (!todosPacientes || todosPacientes.length === 0) {
        if (typeof carregarListaPacientes === 'function') await carregarListaPacientes();
    }
    if (!todosAtendimentos || todosAtendimentos.length === 0) {
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
                        let dataFmt = p.nascimento.split('-').reverse().join('/');
                        if (window.calcularIdade) dataFmt += ` (${window.calcularIdade(p.nascimento)})`;
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
                let dataFmt = p.nascimento.split('-').reverse().join('/');
                if (window.calcularIdade) dataFmt += ` (${window.calcularIdade(p.nascimento)})`;
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
                list = list.filter(p => 
                    (p.bairro && p.bairro.toUpperCase().includes(texto.toUpperCase())) || 
                    (p.Bairro && p.Bairro.toUpperCase().includes(texto.toUpperCase())) ||
                    (p.nome && p.nome.toUpperCase().includes(texto.toUpperCase()))
                );
            }
        }
        list.sort((a,b) => ((a.bairro||a.Bairro||'').localeCompare(b.bairro||b.Bairro||'') || (a.nome||'').localeCompare(b.nome||'')));

        if (list.length === 0) html = `<tr><td colspan="4" class="px-6 py-4 text-center">Nenhum resultado.</td></tr>`;
        list.forEach(p => {
            const end = p.endereco || p.logradouro || p.Endereco || p.Logradouro || '-';
            const br = p.bairro || p.Bairro || '-';
            const bairroEnd = br + '<br><span class="text-xs text-slate-400">' + end + '</span>';
            
            const atends = (todosAtendimentos || []).filter(a => {
                const cpfP = (p.cpf || '').replace(/\D/g, '');
                const cpfA = (a.cpf_paciente || a.cpf || '').replace(/\D/g, '');
                
                // Match by CPF (ignoring leading zeros)
                if (cpfP.length > 4 && cpfA.length > 4 && parseInt(cpfP, 10) === parseInt(cpfA, 10)) return true;
                
                // Match by exact Name (trimmed)
                const nomeP = (p.nome || '').trim().toUpperCase();
                const nomeA = (a.nome_paciente || a.nome || '').trim().toUpperCase();
                if (nomeP && nomeA && nomeP === nomeA) return true;
                
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
        const indicacoes = new Set();
        todosPacientes.forEach(p => {
            if (p.indicacao && p.indicacao.trim() !== '') indicacoes.add(p.indicacao.trim().toUpperCase());
        });
        
        let lideresMap = new Map();
        todosPacientes.forEach(p => {
            if (p.lideranca && p.lideranca.toUpperCase() === 'SIM') {
                const nome = (p.nome || '').trim().toUpperCase();
                if (nome) lideresMap.set(nome, p);
            }
        });
        
        indicacoes.forEach(ind => {
            if (!lideresMap.has(ind)) {
                const pac = todosPacientes.find(p => (p.nome || '').trim().toUpperCase() === ind);
                if (pac) lideresMap.set(ind, pac);
                else lideresMap.set(ind, { nome: ind, lideranca: 'NÃO', telefone: '-' });
            }
        });
        
        let list = Array.from(lideresMap.values());
        list.sort((a,b) => (a.nome||'').localeCompare(b.nome||''));
        
        header = `
        <tr class="bg-slate-100 text-slate-800 uppercase text-xs font-bold border-b border-slate-200">
            <th class="px-6 py-4 text-left">Nome da Liderança / Indicação</th>
            <th class="px-6 py-4 text-center">É Liderança Oficial?</th>
            <th class="px-6 py-4 text-center">Contatos (Qtd Indicações)</th>
            <th class="px-6 py-4 text-left">Telefone</th>
        </tr>`;

        if (list.length === 0) html = `<tr><td colspan="4" class="px-6 py-4 text-center">Nenhum resultado.</td></tr>`;
        
        list.forEach(p => {
            let tel = p.tel || p.tel1 || p.whatsapp || p.telefone || '-';
            let isLid = (p.lideranca || '').toUpperCase() === 'SIM' ? 'SIM' : 'NÃO';
            let qtdIndicados = todosPacientes.filter(x => (x.indicacao||'').trim().toUpperCase() === (p.nome||'').trim().toUpperCase()).length;
            
            html += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
                <td class="px-6 py-4 align-middle">
                    <div class="font-bold text-slate-800 uppercase">${p.nome || '-'}</div>
                </td>
                <td class="px-6 py-4 align-middle text-center">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${isLid === 'SIM' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">${isLid}</span>
                </td>
                <td class="px-6 py-4 align-middle text-center text-slate-600 font-medium">
                    ${qtdIndicados > 0 ? `<span class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs">${qtdIndicados} indicados</span>` : '-'}
                </td>
                <td class="px-6 py-4 align-middle text-slate-600">
                    ${tel}
                </td>
            </tr>`;
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
        showModalAlert("Gere uma listagem válida primeiro!");
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
        showModalAlert("Nenhum munícipe carregado para impressão.");
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
                    <span style="${styleData}">${fmtData(p.nascimento)} ${p.nascimento && window.calcularIdade ? '(' + window.calcularIdade(p.nascimento) + ')' : ''}</span>
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

// ============================================================================
// ORDENAÇÃO GENÉRICA DE TABELAS
// ============================================================================

window.sortState = {};

window.sortTable = function(tabelaId, campo, thElement) {
    if (!window.sortState[tabelaId]) window.sortState[tabelaId] = { campo: '', asc: true };

    if (window.sortState[tabelaId].campo === campo) {
        window.sortState[tabelaId].asc = !window.sortState[tabelaId].asc;
    } else {
        window.sortState[tabelaId].campo = campo;
        window.sortState[tabelaId].asc = true;
    }

    // Atualizar icones visuais
    if (thElement && thElement.parentElement) {
        const tr = thElement.parentElement;
        const allThs = tr.querySelectorAll('th.sortable');
        allThs.forEach(th => {
            const icon = th.querySelector('i') || th.querySelector('svg.lucide');
            if (icon) {
                const newIcon = document.createElement('i');
                newIcon.setAttribute('data-lucide', 'arrow-up-down');
                newIcon.className = "w-3 h-3 text-slate-400 group-hover:text-blue-500";
                icon.replaceWith(newIcon);
            }
        });
        const currentIcon = thElement.querySelector('i') || thElement.querySelector('svg.lucide');
        if (currentIcon) {
            const newIcon = document.createElement('i');
            newIcon.setAttribute('data-lucide', window.sortState[tabelaId].asc ? 'arrow-up' : 'arrow-down');
            newIcon.className = "w-3 h-3 text-slate-400 group-hover:text-blue-500";
            currentIcon.replaceWith(newIcon);
        }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();

    let dataArray = [];
    if (tabelaId === 'pacientes') dataArray = (typeof pacientesFiltrados !== 'undefined' ? pacientesFiltrados : null) || (typeof todosPacientes !== 'undefined' ? todosPacientes : []);
    if (tabelaId === 'atendimentos') dataArray = (typeof atendimentosFiltrados !== 'undefined' ? atendimentosFiltrados : null) || (typeof todosAtendimentos !== 'undefined' ? todosAtendimentos : []);
    if (tabelaId === 'aniversariantes') dataArray = (typeof niverFiltrados !== 'undefined' ? niverFiltrados : null) || (typeof todosPacientes !== 'undefined' ? todosPacientes : []);
    if (tabelaId === 'campanhas') dataArray = (typeof campanhaPessoas !== 'undefined' ? campanhaPessoas : []);

    if (!dataArray || dataArray.length === 0) return;

    dataArray.sort((a, b) => {
        let valA = a[campo] || '';
        let valB = b[campo] || '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (campo.includes('data') || campo.includes('nascimento')) {
            // Converte YYYY-MM-DD para string pura (ja ordena certo). Se for DD/MM/YYYY, precisa converter
            if (typeof valA === 'string' && valA.includes('/')) valA = valA.split('/').reverse().join('-');
            if (typeof valB === 'string' && valB.includes('/')) valB = valB.split('/').reverse().join('-');
        }

        if (valA < valB) return window.sortState[tabelaId].asc ? -1 : 1;
        if (valA > valB) return window.sortState[tabelaId].asc ? 1 : -1;
        return 0;
    });

    if (tabelaId === 'pacientes') {
        if(window.paginacaoPacientes) window.paginacaoPacientes.dadosFiltrados = dataArray;
        if(typeof renderizarPaginaPacientes === 'function') renderizarPaginaPacientes();
    }
    if (tabelaId === 'atendimentos') {
        if(window.paginacaoAtendimentos) window.paginacaoAtendimentos.dadosFiltrados = dataArray;
        if(typeof renderizarPaginaAtendimentos === 'function') renderizarPaginaAtendimentos();
    }
    if (tabelaId === 'aniversariantes' && typeof renderizarTabelaAniversariantes === 'function') renderizarTabelaAniversariantes(dataArray);
    if (tabelaId === 'campanhas' && typeof window.renderizarTabelaListagem === 'function') window.renderizarTabelaListagem(dataArray);
};
