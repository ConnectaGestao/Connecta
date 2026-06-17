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
                    <td class="px-3 py-2 text-right flex flex-col gap-1 justify-end items-end">
                    <button onclick="autoAjustarDocs(${index})" class="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded border border-indigo-200 transition" title="Tenta formatar automaticamente (aplica a máscara) aos valores atuais">Auto-Ajuste</button>
                    <button onclick="salvarCorrecaoDocs('${inv.id}', ${index})" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-sm transition">Salvar Correção</button>
                </td>
            </tr>`;
            });
            tbody.innerHTML = html;
            
            // Aplica as máscaras nos inputs para que a digitação já saia certa
            if (invalidos.length > 0) {
                setTimeout(() => {
                    invalidos.forEach((inv, index) => {
                        const elCpf = document.getElementById(`audit-cpf-${index}`);
                        const elSus = document.getElementById(`audit-sus-${index}`);
                        const elTit = document.getElementById(`audit-titulo-${index}`);
                        const elTel1 = document.getElementById(`audit-tel1-${index}`);
                        const elTel2 = document.getElementById(`audit-tel2-${index}`);
                        
                        if (typeof applyMask === 'function') {
                            if(elCpf) applyMask(elCpf, window.maskCPF || maskCPF);
                            if(elSus) applyMask(elSus, window.maskSUS || maskSUS);
                            if(elTit) applyMask(elTit, window.maskTitulo || maskTitulo);
                            if(elTel1) applyMask(elTel1, window.maskTelefone || maskTelefone);
                            if(elTel2) applyMask(elTel2, window.maskTelefone || maskTelefone);
                        }
                    });
                }, 100);
            }
        }
        
        if(typeof lucide !== 'undefined') lucide.createIcons();
        
        document.getElementById('loading-auditoria-docs').classList.add('hidden');
        document.getElementById('resultado-auditoria-docs').classList.remove('hidden');

    } catch(e) {
        document.getElementById('resultado-auditoria-docs').innerHTML = `<tr><td colspan="6" class="text-rose-500 text-center p-4">Erro: ${e.message}</td></tr>`;
    }
};

window.autoAjustarDocs = function(index) {
    const elCpf = document.getElementById(`audit-cpf-${index}`);
    const elSus = document.getElementById(`audit-sus-${index}`);
    const elTit = document.getElementById(`audit-titulo-${index}`);
    const elTel1 = document.getElementById(`audit-tel1-${index}`);
    const elTel2 = document.getElementById(`audit-tel2-${index}`);
    
    let changed = false;

    const applyInline = (el, type) => {
        if(!el || !el.value) return false;
        const original = el.value;
        let nums = original.replace(/\D/g, '');
        if(!nums) return false;
        let v = nums;

        if (type === 'cpf') {
            if (nums.length === 10) v = '0' + nums;
            if (nums.length === 9) v = '00' + nums;
            if (v.length > 11) v = v.slice(0, 11);
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d)/, '$1.$2');
            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } 
        else if (type === 'sus') {
            if (nums.length < 15) v = nums.padStart(15, '0');
            // Não corta se tiver mais de 15, para que o usuário veja o erro
            v = v.replace(/(\d{3})(\d)/, '$1 $2');
            v = v.replace(/(\d{4})(\d)/, '$1 $2');
            v = v.replace(/(\d{4})(\d)/, '$1 $2');
        }
        else if (type === 'titulo') {
            if (nums.length < 12) v = nums.padStart(12, '0');
            // Não corta se tiver mais de 12, para que o usuário veja o erro
            v = v.replace(/(\d{4})(\d)/, '$1 $2');
            v = v.replace(/(\d{4})(\d)/, '$1 $2');
        }
        else if (type === 'tel') {
            if (nums.length === 10) v = nums.slice(0,2) + '9' + nums.slice(2);
            if (v.length > 11) v = v.slice(0, 11);
            if (v.length === 11) {
                v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (v.length === 10) {
                v = v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
            }
        }

        if (v !== original) {
            el.value = v;
            el.classList.add('bg-yellow-50', 'border-yellow-400');
            return true;
        }
        return false;
    };

    try {
        if(applyInline(elCpf, 'cpf')) changed = true;
        if(applyInline(elSus, 'sus')) changed = true;
        if(applyInline(elTit, 'titulo')) changed = true;
        if(applyInline(elTel1, 'tel')) changed = true;
        if(applyInline(elTel2, 'tel')) changed = true;
    } catch(e) {
        console.error('Erro inlining mask', e);
    }
    
    return changed;
};

window.autoAjustarTodosDocs = function() {
    const trs = document.querySelectorAll('#tabela-auditoria-docs-body tr');
    let adjusted = 0;
    trs.forEach((tr, index) => {
        if(document.getElementById(`audit-cpf-${index}`)) {
            try {
                const mudou = window.autoAjustarDocs(index);
                if (mudou) adjusted++;
            } catch(e) {
                console.error("Erro ao ajustar linha", index, e);
            }
        }
    });
    
    if (adjusted > 0) {
        window.showModalAlert(`Foram pré-formatados ${adjusted} registros visíveis (marcados em amarelo).\n\nRevise as alterações e clique em "Salvar Correção" em cada um, ou você pode continuar editando manualmente.`);
    } else {
        window.showModalAlert("Nenhuma formatação automática pôde ser aplicada. Verifique se os números estão muito incompletos.");
    }
};

window.salvarTodosAjustadosDocs = async function(btnSalvarTodos) {
    const trs = document.querySelectorAll('#tabela-auditoria-docs-body tr');
    
    // 1. Roda o auto-ajuste em todas as linhas silenciosamente
    trs.forEach((tr, index) => {
        if(document.getElementById(`audit-cpf-${index}`)) {
            try { window.autoAjustarDocs(index); } catch(e) {}
        }
    });

    let toSaveList = [];
    
    // 2. Coleta os amarelos
    trs.forEach((tr, index) => {
        const inputsAmarelos = tr.querySelectorAll('input.bg-yellow-50');
        if(inputsAmarelos.length > 0) {
            const btnSalvar = tr.querySelector('button[onclick^="salvarCorrecaoDocs"]');
            if(btnSalvar) {
                const match = btnSalvar.getAttribute('onclick').match(/salvarCorrecaoDocs\('([^']+)',\s*(\d+)\)/);
                if(match && match[1] && match[2]) {
                    toSaveList.push({ id: match[1], index: parseInt(match[2]) });
                }
            }
        }
    });

    if (toSaveList.length === 0) {
        window.showModalAlert("Nenhum registro recém-ajustado para ser salvo.\nLinhas não formatadas precisam ser corrigidas manualmente.");
        return;
    }

    const oldText = btnSalvarTodos.innerHTML;
    btnSalvarTodos.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Salvando ${toSaveList.length}...`;
    btnSalvarTodos.disabled = true;

    try {
        let partialFails = 0;
        const promises = toSaveList.map(async (item) => {
            const result = await window.salvarCorrecaoDocs(item.id, item.index, true);
            if(result && !result.allOk) partialFails++;
        });
        
        await Promise.all(promises);

        if(partialFails > 0) {
            window.showModalAlert(`Foram salvos os campos válidos, mas ${partialFails} paciente(s) ainda têm campos incorretos (marcados em vermelho) que precisam de correção manual.`);
        }

        btnSalvarTodos.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Concluído!';
        btnSalvarTodos.classList.replace('bg-emerald-600', 'bg-emerald-500');
        
        setTimeout(() => {
            btnSalvarTodos.innerHTML = oldText;
            btnSalvarTodos.disabled = false;
            btnSalvarTodos.classList.replace('bg-emerald-500', 'bg-emerald-600');
            if(typeof lucide !== 'undefined') lucide.createIcons();
        }, 2500);

    } catch(e) {
        console.error("Erro no Auto-Salvar:", e);
        window.showModalAlert("Ocorreu um erro ao salvar um ou mais registros: " + e.message);
        btnSalvarTodos.innerHTML = oldText;
        btnSalvarTodos.disabled = false;
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
};

window.salvarCorrecaoDocs = async function(id, index, silent = false) {
    const elCpf = document.getElementById(`audit-cpf-${index}`);
    const elSus = document.getElementById(`audit-sus-${index}`);
    const elTit = document.getElementById(`audit-titulo-${index}`);
    const elTel1 = document.getElementById(`audit-tel1-${index}`);
    const elTel2 = document.getElementById(`audit-tel2-${index}`);
    
    let updates = {};
    let allOk = true;
    let anyValid = false;
    
    const checkField = (el, name, len, exato) => {
        if(!el) return;
        let val = el.value.trim();
        
        // Remove cores antigas
        el.classList.remove('bg-yellow-50', 'border-yellow-400', 'bg-red-50', 'border-red-400', 'bg-emerald-50', 'border-emerald-400');
        
        if(val === '' || val.toUpperCase() === 'NÃO TEM' || val.toUpperCase() === 'NAO TEM') {
            updates[name] = val.toUpperCase();
            anyValid = true;
            return;
        }
        
        let cl = val.replace(/[^\d]+/g, '');
        let isFieldOk = true;
        
        if (exato) {
            if(cl.length !== len) isFieldOk = false;
            if(name === 'cpf' && !window.isValidCPF(cl)) isFieldOk = false;
        } else {
            if(cl.length < len) isFieldOk = false;
        }
        
        if(isFieldOk) {
            updates[name] = val;
            anyValid = true;
        } else {
            el.classList.add('bg-red-50', 'border-red-400');
            allOk = false;
        }
    };
    
    checkField(elCpf, 'cpf', 11, true);
    checkField(elSus, 'cartao_sus', 15, true);
    checkField(elTit, 'titulo_eleitor', 12, true);
    checkField(elTel1, 'telefone', 10, false);
    checkField(elTel2, 'telefone2', 10, false);
    
    if(!anyValid || Object.keys(updates).length === 0) {
        if(!silent) window.showModalAlert("Nenhum campo válido para salvar. Corrija os campos em vermelho.");
        return { allOk: false, saved: false };
    }
    
    try {
        await window.updateDoc(window.doc(window.db, 'pacientes', id), updates);
        
        if (allOk) {
            // Remove a linha da tabela se TUDO estiver ok
            const tr = document.getElementById(`tr-audit-${index}`);
            if(tr) {
                tr.classList.add('bg-emerald-50', 'opacity-50');
                setTimeout(() => {
                    tr.remove();
                    let total = document.querySelectorAll('#tabela-auditoria-docs-body tr').length;
                    document.getElementById('total-docs-invalidos').innerText = total;
                    if(total === 0) {
                        document.getElementById('tabela-auditoria-docs-body').innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-emerald-600 font-bold"><i data-lucide="check-circle" class="w-8 h-8 mx-auto mb-2"></i>Tudo corrigido!</td></tr>';
                        if(typeof lucide !== 'undefined') lucide.createIcons();
                    }
                }, 500);
            }
        } else {
            // Pinta de verde só os que deram certo
            [elCpf, elSus, elTit, elTel1, elTel2].forEach(el => {
                if(el && !el.classList.contains('bg-red-50')) {
                    el.classList.add('bg-emerald-50', 'border-emerald-400');
                }
            });
            if(!silent) window.showModalAlert("Os campos válidos foram salvos! Mas preste atenção: alguns campos em vermelho ainda continuam inválidos e precisam de correção.");
        }
        
        return { allOk, saved: true };
    } catch(e) {
        if(!silent) window.showModalAlert("Erro ao salvar: " + e.message);
        return { allOk: false, saved: false };
    }
};
