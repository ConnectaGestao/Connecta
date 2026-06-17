let listaProcedimentosTemp = []; // Armazena os itens adicionados antes de salvar
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
    const dataAbertura = document.getElementById('data_abertura')?.value || '';
    const prontuario = document.getElementById('field_prontuario')?.value || '';
    const tipoServico = document.getElementById('field_tipo_servico')?.value || '';
    const parceiro = document.getElementById('field_parceiro')?.value || '';
    const especialidade = document.getElementById('field_especialidade')?.value || '';
    const procedimento = document.getElementById('field_procedimento')?.value || '';
    const local = document.getElementById('field_local')?.value || '';
    const tipoDetalhe = document.getElementById('field_tipo')?.value || '';
    const valor = document.getElementById('field_valor')?.value || '';
    const dataMarcacao = document.getElementById('field_data_marcacao')?.value || '';
    const dataRisco = document.getElementById('field_data_risco')?.value || '';
    const status = document.getElementById('field_status_atendimento')?.value || ''; 
    const obs = document.getElementById('field_obs_atendimento')?.value || '';
    const prioridade = document.getElementById('field_prioridade')?.value || '';

    if (!tipoServico && !procedimento && !especialidade) {
        showModalAlert("Preencha pelo menos o Tipo de Serviço, Especialidade ou Procedimento.");
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
        status: status || 'RECEBIDO',
        obs_atendimento: obs,
        prioridade: prioridade,
        anexos_link: document.getElementById('field_anexos_link') ? document.getElementById('field_anexos_link').value : '',
        arquivos_anexos: (() => {
            try { return JSON.parse(document.getElementById('field_arquivos_json_atendimento')?.value || '[]'); }
            catch(e) { return []; }
        })()
    };

    listaProcedimentosTemp.push(item);
    renderizarTabelaProcedimentos();
    
    // Limpa campos do card
    ['field_especialidade', 'field_procedimento', 'field_local', 'field_tipo', 
     'field_valor', 'field_data_marcacao', 'field_data_risco', 
     'field_obs_atendimento', 'field_anexos_link', 'field_arquivos_json_atendimento', 'file_upload_atendimento'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            if(el.type === 'hidden' && id.includes('json')) el.value = '[]';
            else el.value = '';
        }
    });
    
    if(typeof renderizarListaArquivos === 'function') renderizarListaArquivos([], 'lista_arquivos_atendimento', 'field_arquivos_json_atendimento');
    
    ['especialidade', 'procedimento', 'local', 'tipo'].forEach(k => {
        const sel = document.getElementById(`sel_${k}`);
        if(sel) sel.value = "";
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

async function submitAtendimento(e) {
    if(e) e.preventDefault(); 
    const id = document.getElementById('atend_id_hidden').value;

    // --- MODO EDIÇÃƒÆ’O (Single) ---
    if (id) {
        const data = {
            id: id,
            cpf_paciente: document.getElementById('hidden_cpf')?.value || '',
            nome_paciente: document.getElementById('hidden_nome')?.value || '',
            data_abertura: document.getElementById('data_abertura')?.value || '',
            prontuario: document.getElementById('field_prontuario')?.value || '',
            tipo_servico: document.getElementById('field_tipo_servico')?.value || '',
            parceiro: document.getElementById('field_parceiro')?.value || '',
            especialidade: document.getElementById('field_especialidade')?.value || '',
            procedimento: document.getElementById('field_procedimento')?.value || '',
            local: document.getElementById('field_local')?.value || '',
            tipo: document.getElementById('field_tipo')?.value || '',
            valor: document.getElementById('field_valor')?.value || '',
            data_marcacao: document.getElementById('field_data_marcacao')?.value || '',
            data_risco: document.getElementById('field_data_risco')?.value || '',
            status: document.getElementById('field_status_atendimento')?.value || '',
            obs_atendimento: document.getElementById('field_obs_atendimento')?.value || '',
            anexos_link: document.getElementById('field_anexos_link')?.value || ''
        };

        if(await sendData('registerService', data, 'loading-atendimento')) { 
            if(typeof resetFormAtendimento === 'function') resetFormAtendimento(); 
            switchTab('lista-atendimentos');
        }
        return;
    }

    // --- MODO CRIAÇÃƒÆ’O (Lote/Batch) ---
    if (typeof listaProcedimentosTemp === 'undefined' || listaProcedimentosTemp.length === 0) {
        showModalAlert("Adicione pelo menos um procedimento í  lista antes de salvar.");
        return;
    }

    const cpf = document.getElementById('hidden_cpf').value;
    const nome = document.getElementById('hidden_nome').value;

    if(!cpf && !nome) { showModalAlert("Busque o munícipe."); return; }

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
        // 1. LIMPEZA EXPLí CITA IMEDIATA PARA EVITAR DUPLICIDADE
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
// 5. FORMULí RIOS E PREENCHIMENTO
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
                    <input type="hidden" name="${fieldName}" id="field_${cfg.id}">
                </div>`;
        }
    });
}

function checkSelectNew(id) {
    const sel = document.getElementById(`sel_${id}`);
    if (sel) {
        document.getElementById(`field_${id}`).value = sel.value;
        if (id === 'procedimento' && typeof aplicarValorPadraoProc === 'function') {
            aplicarValorPadraoProc(sel.value);
        }
        
        // Verifica se devemos mostrar os campos de Data Marcação e Risco
        const tipoServico = document.getElementById('field_tipo_servico') ? document.getElementById('field_tipo_servico').value.toUpperCase() : '';
        const procedimento = document.getElementById('field_procedimento') ? document.getElementById('field_procedimento').value.toUpperCase() : '';
        const tipo = document.getElementById('field_tipo') ? document.getElementById('field_tipo').value.toUpperCase() : '';
        const especialidade = document.getElementById('field_especialidade') ? document.getElementById('field_especialidade').value.toUpperCase() : '';
        const prioridade = document.getElementById('field_prioridade') ? document.getElementById('field_prioridade').value.toUpperCase() : '';
        
        const isCirurgia = (tipoServico.includes('CIRURG')) || (procedimento.includes('CIRURG')) || (tipo.includes('CIRURG')) || (especialidade.includes('CIRURG')) || (prioridade.includes('CIRURG'));
        
        const wrapMarcacao = document.getElementById('container_data_marcacao');
        const wrapRisco = document.getElementById('container_data_risco');
        if(wrapMarcacao) {
            if(isCirurgia) wrapMarcacao.classList.remove('hidden'); else { wrapMarcacao.classList.add('hidden'); document.getElementById('field_data_marcacao').value = ''; }
        }
        if(wrapRisco) {
            if(isCirurgia) wrapRisco.classList.remove('hidden'); else { wrapRisco.classList.add('hidden'); document.getElementById('field_data_risco').value = ''; }
        }
    }
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

window.tipoCadastroAtual = 'COMPLETO'; // 'COMPLETO' ou 'PRE'

function abrirModalTipoCadastro() {
    const modal = document.getElementById('modal-tipo-cadastro');
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    }
}

function fecharModalTipoCadastro() {
    const modal = document.getElementById('modal-tipo-cadastro');
    if(modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    }
}

function iniciarCadastroCompleto() {
    fecharModalTipoCadastro();
    window.tipoCadastroAtual = 'COMPLETO';
    switchTab('form-paciente');
}

function iniciarPreCadastro() {
    fecharModalTipoCadastro();
    window.tipoCadastroAtual = 'PRE';
    switchTab('form-paciente');
}

function resetFormPaciente() {
    document.getElementById('frmPaciente').reset();
    document.getElementById('paciente_id_hidden').value = "";
    document.getElementById('msg_cpf_paciente').innerText = '';
    document.getElementById('opcoes-paciente-existente').classList.add('hidden');
    document.getElementById('btn-imprimir').classList.add('hidden');
    
    const divCpfInicial = document.getElementById('paciente_cpf_check').closest('.mb-8');
    
    if (window.tipoCadastroAtual === 'PRE') {
        if(divCpfInicial) divCpfInicial.classList.add('hidden');
        document.getElementById('resto-form-paciente').classList.remove('hidden');
    } else {
        if(divCpfInicial) divCpfInicial.classList.remove('hidden');
        document.getElementById('resto-form-paciente').classList.add('hidden');
    }
    
    const btnDelete = document.getElementById('btn-delete-paciente');
    if(btnDelete) btnDelete.classList.add('hidden');
    
    document.getElementById('field_arquivos_json').value = '[]';
    if(typeof renderizarListaArquivos === 'function') renderizarListaArquivos([], 'lista_arquivos_paciente', 'field_arquivos_json');
    
    CONFIG_SELECTS.forEach(cfg => {
        const sel = document.getElementById(`sel_${cfg.id}`);
        if(sel && cfg.id !== 'status_atendimento') sel.value = "";
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
    
    const wrapMarcacao = document.getElementById('container_data_marcacao');
    const wrapRisco = document.getElementById('container_data_risco');
    if(wrapMarcacao) wrapMarcacao.classList.add('hidden');
    if(wrapRisco) wrapRisco.classList.add('hidden');
    
    const dataAb = document.getElementById('data_abertura');
    if(dataAb) dataAb.valueAsDate = new Date();
    
    // RESTAURA MODO PADRÃƒÆ’O (NOVO)
    toggleModoEdicao(false);

    // RESET DO PRONTUí RIO (Volta a ficar bloqueado)
    const prontuarioInput = document.getElementById('field_prontuario');
    if(prontuarioInput) {
        prontuarioInput.value = '';
        prontuarioInput.disabled = true;
        prontuarioInput.classList.add('bg-slate-100', 'cursor-not-allowed');
        prontuarioInput.classList.remove('bg-white');
        prontuarioInput.placeholder = "Selecione Local HO...";
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
            'sus', 'referencia', 'lideranca', 'nome_social', 'conjuge',
            'parentes', 'titulo', 'documentos_link'
        ];
        
        fields.forEach(k => { const el = document.getElementById(`field_${k}`); if(el) el.value = dados[k] || ''; });
        
        const elPront = document.getElementById('field_prontuario_paciente');
        if(elPront) elPront.value = dados['prontuario'] || '';
        
        const elCpfForm = document.getElementById('field_cpf_form');
        if(elCpfForm) elCpfForm.value = dados['cpf'] || '';
        
        // Mostrar idade automaticamente ao editar
        if(typeof calcularIdadeFormulario === 'function') calcularIdadeFormulario();
        
        const elMunicipio = document.getElementById('field_municipio');
        if (elMunicipio) elMunicipio.value = dados.municipio || dados.cidade || dados.Municipio || dados.Cidade || '';
        
        const elBairro = document.getElementById('field_bairro');
        if (elBairro) elBairro.value = dados.bairro || dados.Bairro || '';
        
        ['status_titulo', 'indicacao', 'profissao', 'cargo_eclesiastico', 'segmento'].forEach(k => { 
            let val = dados[k];
            if (k === 'status_titulo') val = val || dados.situacao_eleitoral || dados.situacaoEleitoral || dados.municipio_titulo;
            if (k === 'indicacao') val = val || dados.quem_indicou || dados.QuemIndicou;
            if (typeof preencherSelectInteligente === 'function') preencherSelectInteligente(k, val); 
        });
        
        const elDocumentos = document.getElementById('field_documentos_link'); if(elDocumentos) elDocumentos.value = dados.documentos_link || '';
        const elTitulo = document.getElementById('field_titulo'); if(elTitulo) elTitulo.value = dados.titulo || '';
        const elLogra = document.getElementById('field_logradouro'); if(elLogra) elLogra.value = dados.logradouro || dados.endereco || dados.Endereco || dados.Logradouro || ''; 
        
        const elArquivosJson = document.getElementById('field_arquivos_json');
        if (elArquivosJson) {
            const arr = dados.arquivos_anexos || [];
            elArquivosJson.value = JSON.stringify(arr);
            if(typeof renderizarListaArquivos === 'function') renderizarListaArquivos(arr, 'lista_arquivos_paciente', 'field_arquivos_json');
        }
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
    // CORREÇÃƒÆ’O CRí TICA: Passa false para NÃƒÆ’O resetar o formulário
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
    
    // LOGICA DO PRONTUí RIO NA EDIÇÃƒÆ’O
    const prontuarioInput = document.getElementById('field_prontuario');
    const localVal = at.local ? at.local.toUpperCase() : '';
    
    if (prontuarioInput) {
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
    }

    document.getElementById('field_tipo').value = at.tipo || ''; 
    document.getElementById('field_data_marcacao').value = at.data_marcacao || '';
    document.getElementById('field_data_risco').value = at.data_risco || '';
    let valFinal = at.valor || 'valor não definido na base';
    if (valFinal == 0 || valFinal === '0' || valFinal === '0.00') valFinal = 'valor não definido na base';
    document.getElementById('field_valor').value = valFinal;
    document.getElementById('field_obs_atendimento').value = at.obs_atendimento || '';
    if (document.getElementById('field_anexos_link')) document.getElementById('field_anexos_link').value = at.anexos_link || '';

    ['tipo_servico','parceiro','especialidade','procedimento','local','tipo','status_atendimento'].forEach(k => {
        const val = k === 'status_atendimento' ? at.status : at[k];
        if (typeof preencherSelectInteligente === 'function') preencherSelectInteligente(k, val);
    });
    
    // Toggle containers conditionally
    const isCirurgia = (at.tipo_servico || '').toUpperCase().includes('CIRURG') || 
                       (at.procedimento || '').toUpperCase().includes('CIRURG') ||
                       (at.tipo || '').toUpperCase().includes('CIRURG') ||
                       (at.especialidade || '').toUpperCase().includes('CIRURG') ||
                       (at.prioridade || '').toUpperCase().includes('CIRURG');
    const wrapMarcacao = document.getElementById('container_data_marcacao');
    const wrapRisco = document.getElementById('container_data_risco');
    if(wrapMarcacao) {
        if(isCirurgia) wrapMarcacao.classList.remove('hidden'); else { wrapMarcacao.classList.add('hidden'); document.getElementById('field_data_marcacao').value = ''; }
    }
    if(wrapRisco) {
        if(isCirurgia) wrapRisco.classList.remove('hidden'); else { wrapRisco.classList.add('hidden'); document.getElementById('field_data_risco').value = ''; }
    }
    
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
    if(!cpf || cpf.length < 5) { showModalAlert("Munícipe sem CPF. Edite o cadastro primeiro."); abrirEdicaoDireta(cpf, id); return; }
    
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
        
        // Foca no primeiro campo útil
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

// submitPaciente is defined in api.js (handles both create and update correctly)

function calcularDataRisco() {
    const dataMarcacao = document.getElementById('field_data_marcacao').value;
    const campoEspec = document.getElementById('field_especialidade');
    if(!dataMarcacao) return;

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
async function confirmarExclusaoPaciente(forceId = null, forceNome = null) {
    let finalId = forceId;
    let nome = forceNome || 'este munícipe';
    let cpf = '';

    if(!finalId) {
        const hiddenId = document.getElementById('paciente_id_hidden') ? document.getElementById('paciente_id_hidden').value : '';
        finalId = hiddenId;
    }
    
    if (!finalId && typeof pacienteAtual !== 'undefined' && pacienteAtual && pacienteAtual.id) {
        finalId = pacienteAtual.id;
        nome = pacienteAtual.nome || nome;
        cpf = pacienteAtual.cpf || cpf;
    }
    
    if (!finalId && typeof histPacienteAtual !== 'undefined' && histPacienteAtual && histPacienteAtual.id) {
        finalId = histPacienteAtual.id;
        nome = histPacienteAtual.nome || nome;
        cpf = histPacienteAtual.cpf || cpf;
    }

    if (!finalId) {
        const btnHistDelete = document.getElementById('btn-hist-delete');
        if (btnHistDelete && !btnHistDelete.closest('.hidden')) {
            finalId = btnHistDelete.getAttribute('data-id');
            cpf = btnHistDelete.getAttribute('data-cpf');
            const hNome = document.getElementById('hist-nome');
            if(hNome) nome = hNome.innerText;
        }
    }

    if (!finalId && !cpf) {
        // Tenta buscar o CPF direto do campo na tela como último recurso (Nível Apelão)
        const cpfNaTela = document.getElementById('paciente_cpf_check');
        if (cpfNaTela && cpfNaTela.value && cpfNaTela.value.length > 5) {
            cpf = cpfNaTela.value;
        }
    }

    if (!finalId && !cpf) {
        showModalAlert("Erro: Não foi possível identificar o ID ou CPF do munícipe na página. Feche a tela e tente novamente.");
        return;
    }

    const confirmacao = await showModalConfirm(`ATENÇÃO: Você está prestes a excluir ${nome}.\n\nISSO APAGARÁ TAMBÉM TODOS OS ATENDIMENTOS DELE.\n\nTem certeza absoluta?`);
    if(confirmacao) {
        if(typeof excluirPacienteAPI === 'function') excluirPacienteAPI(finalId, cpf);
    }
}

async function confirmarExclusaoAtendimento() {
    const id = document.getElementById('atend_id_hidden').value;
    if(!id) return;
    const confirmacao = await showModalConfirm("Tem certeza que deseja excluir este atendimento?");
    if(confirmacao) {
        if(typeof excluirAtendimentoAPI === 'function') excluirAtendimentoAPI(id);
    }
}

// ============================================================================

window.irParaAtendimento = function() {
    const cpf = document.getElementById('paciente_cpf_check').value;
    let id = document.getElementById('paciente_id_hidden').value;
    const cpfNum = document.getElementById('paciente_cpf_check').value;
    if(!id && window.pacienteExclusaoTemporaria) {
        id = window.pacienteExclusaoTemporaria;
    }
    if(typeof abrirAtendimentoDireto === 'function') {
        abrirAtendimentoDireto(cpf, id);
    }
};

window.gerarCpfAutomatico = function() {
    const min = 100000000;
    const max = 999999999;
    const randomFicticio = Math.floor(Math.random() * (max - min + 1)) + min;
    const ficticioCpf = "00" + randomFicticio;
    const formatado = ficticioCpf.substring(0,3) + "." + ficticioCpf.substring(3,6) + "." + ficticioCpf.substring(6,9) + "-" + ficticioCpf.substring(9,11);
    const input = document.getElementById('paciente_cpf_check');
    if(input) {
        input.value = formatado;
        if(typeof verificarCpfInicial === 'function') verificarCpfInicial();
    }
};

window.destravarEndereco = function() {
    ['field_municipio', 'field_bairro'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.readOnly = false;
            el.classList.remove('bg-slate-100', 'cursor-not-allowed');
            el.classList.add('bg-white');
        }
    });
};

window.calcularIdadeFormulario = function() {
    const campoData = document.getElementById('field_nascimento').value;
    const spanIdade = document.getElementById('idade_calc');
    if(!campoData || !spanIdade) return;
    const nac = new Date(campoData);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nac.getFullYear();
    const m = hoje.getMonth() - nac.getMonth();
    if(m < 0 || (m === 0 && hoje.getDate() < nac.getDate())) {
        idade--;
    }
    spanIdade.innerText = ( anos);
};

// ============================================================================
// 7. DETECTOR DE DUPLICIDADE
// ============================================================================

window.abrirDetectorDuplicidade = async function() {
    const modal = document.getElementById('modal-detector-duplicidade');
    const container = document.getElementById('container-duplicidades');
    const info = document.getElementById('info-duplicidades');
    
    modal.classList.remove('hidden');
    container.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400"><div class="text-center"><i data-lucide="loader" class="w-8 h-8 animate-spin mx-auto mb-3"></i><p>Analisando base de dados...</p></div></div>';
    if(typeof lucide !== 'undefined') lucide.createIcons();

    // Aguarda um pequeno instante para renderizar o loader
    await new Promise(r => setTimeout(r, 100));

    const grupos = {};
    if (typeof todosPacientes === 'undefined' || !todosPacientes) return;
    
    todosPacientes.forEach(p => {
        if (!p.cpf) return;
        const cpfLimpo = String(p.cpf).replace(/\D/g, '');
        if (cpfLimpo.length < 11) return;
        
        if (!grupos[cpfLimpo]) grupos[cpfLimpo] = [];
        grupos[cpfLimpo].push(p);
    });

    const duplicidades = [];
    for (let cpf in grupos) {
        if (grupos[cpf].length > 1) {
            duplicidades.push(grupos[cpf]);
        }
    }

    if (duplicidades.length === 0) {
        container.innerHTML = '<div class="flex items-center justify-center h-full text-slate-400"><div class="text-center"><i data-lucide="check-circle" class="w-12 h-12 text-emerald-500 mx-auto mb-3"></i><p class="text-lg font-bold text-slate-600">Tudo certo!</p><p>Nenhum CPF duplicado foi encontrado na base.</p></div></div>';
        info.innerText = '0 duplicidades encontradas';
        if(typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    info.innerText = `${duplicidades.length} CPF(s) com multiplicidade encontrados`;
    renderizarDuplicidades(duplicidades);
};

function calcularScorePaciente(p) {
    let score = 0;
    const camposImportantes = [
        'nome', 'nascimento', 'rg', 'sexo', 'tel1', 'tel2', 'whatsapp', 
        'cep', 'logradouro', 'numero', 'bairro', 'municipio', 
        'sus', 'titulo', 'zona', 'secao', 'status_titulo',
        'profissao', 'lideranca', 'referencia', 'parentes', 'obs'
    ];
    
    camposImportantes.forEach(c => {
        if (p[c] && String(p[c]).trim() !== '' && p[c] !== 'undefined') score++;
    });
    
    // Dar um bônus forte se o nome for mais longo (menos chance de ser apelido)
    if (p.nome && String(p.nome).length > 10) score += 2;
    
    return score;
}

window.renderizarDuplicidades = function(duplicidades) {
    const container = document.getElementById('container-duplicidades');
    container.innerHTML = '';
    
    window.duplicidadesCache = duplicidades;

    duplicidades.forEach((grupo, index) => {
        // Calcula o score de cada um
        grupo.forEach(p => p._score = calcularScorePaciente(p));
        
        // Ordena do maior score pro menor
        grupo.sort((a, b) => b._score - a._score);
        
        const principal = grupo[0];
        const formatedCpf = principal.cpf || 'N/I';

        const divGrupo = document.createElement('div');
        divGrupo.className = 'bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden';
        
        let html = `<div class="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <i data-lucide="users" class="w-5 h-5 text-amber-500"></i>
                <h3 class="font-bold text-slate-700">CPF: ${formatedCpf}</h3>
                <span class="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">${grupo.length} cadastros</span>
            </div>
        </div><div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;

        grupo.forEach((p, pIndex) => {
            const isPrincipal = pIndex === 0;
            const cardClass = isPrincipal ? 'border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-amber-300';
            const badge = isPrincipal ? '<span class="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1"><i data-lucide="star" class="w-3 h-3"></i> Sugerido</span>' : '';
            
            const dCria = p.data_criacao ? p.data_criacao.split('T')[0].split('-').reverse().join('/') : 'N/I';
            const safeNomeHtml = p.nome ? String(p.nome).replace(/'/g, "\\'").replace(/"/g, "&quot;") : 'SEM NOME';
            const safeCpf = formatedCpf.replace(/\D/g, '');
            
            html += `
                <div class="border rounded-lg p-4 relative transition-all ${cardClass}">
                    ${badge}
                    <div class="font-bold text-slate-800 text-sm uppercase mb-1">${p.nome || 'SEM NOME'}</div>
                    <div class="text-xs text-slate-500 mb-3 space-y-1">
                        <div><i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i> ${p.nascimento ? p.nascimento.split('-').reverse().join('/') : '-'}</div>
                        <div><i data-lucide="phone" class="w-3 h-3 inline mr-1"></i> ${p.tel || p.tel1 || p.whatsapp || p.telefone || '-'}</div>
                        <div><i data-lucide="map-pin" class="w-3 h-3 inline mr-1"></i> ${p.bairro || '-'}</div>
                        <div><i data-lucide="clock" class="w-3 h-3 inline mr-1"></i> Criado: ${dCria}</div>
                    </div>
                    <div class="flex justify-between items-center mt-4 border-t pt-3">
                        <span class="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded border">${p._score} pts</span>
                        ${!isPrincipal ? `<button onclick="executarExclusaoDuplicata(this, '${p.id}', '${principal.id}', '${safeNomeHtml}', '${safeCpf}')" class="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 transition px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm"><i data-lucide="trash-2" class="w-3 h-3"></i> Excluir</button>` : `<span class="text-xs font-bold text-emerald-600 flex items-center gap-1"><i data-lucide="check" class="w-4 h-4 inline"></i> Principal</span>`}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        divGrupo.innerHTML = html;
        container.appendChild(divGrupo);
    });
    
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.executarExclusaoDuplicata = async function(btn, idFraco, idPrincipal, nomeFraco, cpf) {
    if ((!idFraco || idFraco === 'undefined') && !cpf) {
        showModalAlert("Erro: IDs inválidos para exclusão e mesclagem. Recarregue a página.");
        return;
    }
    
    const safeNome = nomeFraco ? String(nomeFraco).replace(/&quot;/g, '"').replace(/\\'/g, "'") : 'Desconhecido';
    const confirmacao = await showModalConfirm(`Você está prestes a excluir o cadastro de:\n\n${safeNome}\n\nTodos os Atendimentos vinculados a este cadastro serão MERGEADOS (transferidos) para o cadastro Principal.\n\nTem certeza absoluta?`);
    
    if(confirmacao) {
        let originalHtml = '';
        try {
            originalHtml = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader" class="w-3 h-3 animate-spin"></i>';
            btn.disabled = true;
            
            if(typeof mesclarExcluirDuplicataAPI === 'function') {
                await mesclarExcluirDuplicataAPI(idFraco, idPrincipal, cpf);
                showMessage("Cadastro duplicado excluído e histórico migrado com sucesso!", "success");
                
                // Remove o elemento da interface imediatamente para dar feedback rápido
                const card = btn.closest('.relative');
                if(card) {
                    card.classList.add('opacity-50', 'pointer-events-none');
                    card.innerHTML = '<div class="absolute inset-0 flex items-center justify-center bg-white/80"><span class="text-red-500 font-bold text-sm">Excluído</span></div>';
                }
                
                // Recarrega os dados globais em background
                setTimeout(() => {
                    if(typeof carregarListaPacientes === 'function') carregarListaPacientes();
                }, 1000);
            } else {
                throw new Error("Função de mesclagem não encontrada na API.");
            }
        } catch(e) {
            console.error("Erro no executarExclusaoDuplicata:", e);
            if (btn && originalHtml) {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
            showModalAlert("Erro ao limpar duplicidade: " + (e.message || e));
        }
    }
};
