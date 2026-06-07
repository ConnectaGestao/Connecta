/**
 * js/campanhas.js
 * Lógica para o disparador de WhatsApp em massa.
 */

window.carregarFiltrosCampanha = async function() {
    const selBairro = document.getElementById('filtro-camp-bairro');
    const selIndicacao = document.getElementById('filtro-camp-indicacao');
    const selSituacao = document.getElementById('filtro-camp-situacao');

    try {
        const snap = await window.getDocs(window.collection(window.db, 'config_selects'));
        
        const bairros = new Set();
        const indicacoes = new Set();
        const situacoes = new Set();

        snap.forEach(doc => {
            const d = doc.data();
            const val = d.valor ? String(d.valor).trim().toUpperCase() : '';
            if(!val) return;
            if(d.chave === 'BAIRRO') bairros.add(val);
            if(d.chave === 'INDICACAO') indicacoes.add(val);
            if(d.chave === 'STATUS_TITULO') situacoes.add(val);
        });

        // Add dynamically from patients
        if (typeof todosPacientes !== 'undefined' && todosPacientes) {
            todosPacientes.forEach(p => {
                if (p.bairro) bairros.add(String(p.bairro).toUpperCase());
                if (p.indicacao) indicacoes.add(String(p.indicacao).toUpperCase());
                if (p.status_titulo) situacoes.add(String(p.status_titulo).toUpperCase());
            });
        }

        const preencherSelect = (sel, set) => {
            if(!sel) return;
            const atuais = Array.from(sel.options).map(o => o.value);
            Array.from(set).sort().forEach(val => {
                if(!atuais.includes(val)) {
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.text = val;
                    sel.appendChild(opt);
                }
            });
        };

        preencherSelect(selBairro, bairros);
        preencherSelect(selIndicacao, indicacoes);
        preencherSelect(selSituacao, situacoes);
        
    } catch(e) {
        console.error("Erro ao carregar filtros de campanha:", e);
    }
};

window.gerarFilaCampanha = function() {
    const btn = document.getElementById('btn-gerar-campanha');
    if(btn) {
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Filtrando...';
        btn.disabled = true;
    }

    setTimeout(() => {
        try {
            const bairro = document.getElementById('filtro-camp-bairro').value;
            const indicacao = document.getElementById('filtro-camp-indicacao').value;
            const situacao = document.getElementById('filtro-camp-situacao').value;
            const sexo = document.getElementById('filtro-camp-sexo').value;
            const temZap = document.getElementById('filtro-camp-zap').value;
            
            const txtMsg = document.getElementById('campanha-msg').value;

            if (!txtMsg || txtMsg.trim() === '') {
                showModalAlert('Você precisa digitar uma mensagem para a campanha!');
                return;
            }

            let filtrados = (typeof todosPacientes !== 'undefined') ? todosPacientes : [];

            if (bairro) filtrados = filtrados.filter(p => String(p.bairro || '').toUpperCase() === bairro);
            if (indicacao) filtrados = filtrados.filter(p => String(p.indicacao || '').toUpperCase() === indicacao);
            if (situacao) filtrados = filtrados.filter(p => String(p.status_titulo || '').toUpperCase() === situacao);
            if (sexo) filtrados = filtrados.filter(p => p.sexo === sexo);
            
            if (temZap === 'sim') {
                filtrados = filtrados.filter(p => p.tel1 || p.tel2);
            }

            const container = document.getElementById('campanha-resultados');
            if(filtrados.length === 0) {
                container.innerHTML = '<p class="text-slate-500 italic p-4 text-center">Nenhum munícipe encontrado com estes filtros.</p>';
                return;
            }

            let countSemZap = 0;
            let countComZap = 0;

            let html = `
            <div class="mb-4 bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800 flex justify-between items-center">
                <span>Total Encontrado: <strong>${filtrados.length}</strong></span>
            </div>
            <div class="space-y-2">`;

            filtrados.forEach((p, idx) => {
                const tel = p.tel1 || p.tel2 || '';
                const numTel = tel.replace(/\D/g, '');
                
                if (!numTel || numTel.length < 10) {
                    countSemZap++;
                    html += `
                    <div class="flex items-center justify-between p-3 border border-slate-100 rounded bg-slate-50 opacity-60">
                        <div>
                            <p class="font-bold text-slate-700 text-sm">${p.nome}</p>
                            <p class="text-xs text-slate-500">Sem telefone válido</p>
                        </div>
                        <span class="text-xs font-bold text-slate-400">Inválido</span>
                    </div>`;
                    return;
                }

                countComZap++;
                
                // Formatar mensagem
                const primeiroNome = p.nome.split(' ')[0];
                let finalMsg = txtMsg.replace(/{nome}/g, primeiroNome).replace(/{nome_completo}/g, p.nome);
                
                const link = `https://api.whatsapp.com/send/?phone=55${numTel}&text=${encodeURIComponent(finalMsg)}`;
                const btnId = `btn-envia-${idx}`;

                html += `
                <div class="flex items-center justify-between p-3 border border-slate-200 rounded bg-white hover:bg-slate-50 transition">
                    <div>
                        <p class="font-bold text-slate-800 text-sm">${p.nome}</p>
                        <p class="text-xs text-slate-500">${tel}</p>
                    </div>
                    <a id="${btnId}" href="${link}" target="_blank" onclick="marcarComoEnviado('${btnId}')" 
                       class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-2">
                        <i data-lucide="send" class="w-3 h-3"></i> Enviar
                    </a>
                </div>`;
            });

            html += `</div>`;
            
            // Update stats
            html = html.replace('<span>Total Encontrado:', `<span>Prontos para Envio: <strong>${countComZap}</strong> | Sem Contato: ${countSemZap} | Total:`);

            container.innerHTML = html;
            if(window.lucide) window.lucide.createIcons();

        } catch(e) {
            console.error("Erro ao gerar fila:", e);
            showModalAlert("Erro ao processar: " + e.message);
        } finally {
            if(btn) {
                btn.innerHTML = '<i data-lucide="play" class="w-4 h-4"></i> Gerar Fila de Disparo';
                btn.disabled = false;
                if(window.lucide) window.lucide.createIcons();
            }
        }
    }, 100);
};

window.marcarComoEnviado = function(btnId) {
    const btn = document.getElementById(btnId);
    if(btn) {
        btn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
        btn.classList.add('bg-slate-300', 'text-slate-600', 'pointer-events-none');
        btn.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> Enviado';
        if(window.lucide) window.lucide.createIcons();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Escuta o tab switch
    const origSwitchTab = window.switchTab;
    window.switchTab = function(tabId, shouldReset) {
        origSwitchTab(tabId, shouldReset);
        if (tabId === 'campanhas') {
            carregarFiltrosCampanha();
        }
    };
});
