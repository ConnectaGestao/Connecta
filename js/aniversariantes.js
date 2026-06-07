/**
 * js/aniversariantes.js
 * Lógica para o painel de aniversariantes em destaque.
 */

function renderizarPainelAniversariantes() {
    if (!dashboardRawData || !dashboardRawData.pacientes) {
        // Se ainda não carregou, tentamos carregar primeiro
        if (typeof loadDashboard === 'function') {
            loadDashboard().then(() => {
                // Apenas para não entrar em loop infinito se falhar, aguardamos 500ms
                setTimeout(renderizarPainelAniversariantes, 500);
            });
        }
        return;
    }

    const pacientes = dashboardRawData.pacientes;
    const hoje = [];
    const recentes = [];
    const proximos = [];

    const dataAtual = new Date();
    dataAtual.setHours(0, 0, 0, 0);

    pacientes.forEach(p => {
        if (!p.nascimento) return;
        
        // Formato esperado: YYYY-MM-DD
        const parts = p.nascimento.split('T')[0].split('-');
        if (parts.length !== 3) return;
        
        const m = parseInt(parts[1], 10) - 1; // 0-based
        const d = parseInt(parts[2], 10);
        
        const yAtual = dataAtual.getFullYear();
        
        // Verifica para o ano atual, ano passado e ano que vem (para bordas de dezembro/janeiro)
        const anosTeste = [yAtual - 1, yAtual, yAtual + 1];
        
        let categorizado = false;

        for (let y of anosTeste) {
            if (categorizado) break;

            const dataNiver = new Date(y, m, d);
            const diffTime = dataNiver.getTime() - dataAtual.getTime();
            const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

            if (diffDays === 0) {
                hoje.push(p);
                categorizado = true;
            } else if (diffDays === -1 || diffDays === -2) {
                recentes.push({...p, diff: diffDays});
                categorizado = true;
            } else if (diffDays >= 1 && diffDays <= 7) {
                proximos.push({...p, diff: diffDays});
                categorizado = true;
            }
        }
    });

    // Ordenar proximos do mais perto pro mais longe (1 -> 7)
    proximos.sort((a, b) => a.diff - b.diff);
    // Ordenar recentes do mais recente pro mais antigo (-1 -> -2)
    recentes.sort((a, b) => b.diff - a.diff);

    // Função auxiliar para renderizar card
    const criarCard = (p, tipo) => {
        let tagData = '';
        if (tipo === 'proximo') {
            const diasStr = p.diff === 1 ? 'Amanhã' : `Faltam ${p.diff} dias`;
            tagData = `<div class="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded w-fit mb-2">${diasStr}</div>`;
        } else if (tipo === 'recente') {
            const diasStr = p.diff === -1 ? 'Ontem' : 'Anteontem';
            tagData = `<div class="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded w-fit mb-2">${diasStr}</div>`;
        }

        const pStr = JSON.stringify(p).replace(/"/g, '&quot;');
        
        let btnWhatsHtml = '';
        
        if (tipo === 'proximo') {
            btnWhatsHtml = `<div class="flex-1 text-xs text-slate-400 italic text-center py-1.5 border border-slate-100 rounded bg-slate-50 cursor-not-allowed">Só no dia</div>`;
        } else if (p.tel1) {
            const firstName = p.nome.split(' ')[0];
            let msg = '';
            if (tipo === 'hoje') {
                msg = "Olá " + firstName + "! Parabéns pelo seu aniversário! Que o seu dia seja repleto de alegrias, saúde e paz. Um grande abraço! ( Família Tudo a Ver )";
            } else if (tipo === 'recente') {
                msg = "Olá " + firstName + "! Passando para desejar um feliz aniversário atrasado! Que você tenha muita saúde, paz e alegrias neste novo ciclo. Um grande abraço! ( Família Tudo a Ver )";
            }
            const linkWhats = "https://api.whatsapp.com/send/?phone=55" + p.tel1.replace(/\D/g, '') + "&text=" + encodeURIComponent(msg);
            btnWhatsHtml = `
            <a href="${linkWhats}" target="_blank" class="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1.5 px-2 rounded transition text-center flex justify-center items-center gap-1">
                <i data-lucide="message-circle" class="w-3 h-3"></i> Whats
            </a>`;
        } else {
            btnWhatsHtml = `<div class="flex-1 text-xs text-slate-400 italic text-center py-1.5 border border-slate-100 rounded">S/ Tel</div>`;
        }

        const age = new Date().getFullYear() - parseInt(p.nascimento.split('-')[0], 10);

        return `
        <div class="bg-white p-4 border border-slate-100 shadow-sm rounded-lg hover:shadow-md transition">
            ${tagData}
            <div class="font-bold text-slate-800 text-sm md:text-base truncate" title="${p.nome}">${p.nome}</div>
            <div class="text-xs text-slate-500 mt-1"><i data-lucide="map-pin" class="w-3 h-3 inline"></i> ${p.bairro || 'Bairro ñ info.'}</div>
            <div class="text-xs text-slate-500 mt-1"><i data-lucide="calendar" class="w-3 h-3 inline"></i> Nasc: ${p.nascimento.split('-').reverse().join('/')} <span class="font-bold text-pink-500">(${age} anos)</span></div>
            <div class="text-xs text-slate-500 mt-1"><i data-lucide="users" class="w-3 h-3 inline"></i> Indicação: <span class="font-bold text-slate-600">${p.indicacao || p.lideranca_nome || '-'}</span></div>
            
            <div class="mt-3 flex gap-2">
                <button onclick="verHistoricoCompleto(${pStr})" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-1.5 px-2 rounded transition text-center flex justify-center items-center gap-1 border border-slate-200">
                    <i data-lucide="user" class="w-3 h-3"></i> Perfil
                </button>
                ${btnWhatsHtml}
            </div>
        </div>
        `;
    };

    const cHoje = document.getElementById('lista-aniv-hoje');
    const cRecentes = document.getElementById('lista-aniv-recentes');
    const cProximos = document.getElementById('lista-aniv-proximos');

    if(cHoje) {
        if(hoje.length === 0) cHoje.innerHTML = `<div class="text-center text-pink-400 text-sm italic my-auto py-8">Nenhum aniversariante hoje.</div>`;
        else cHoje.innerHTML = hoje.map(p => criarCard(p, 'hoje')).join('');
    }

    if(cRecentes) {
        if(recentes.length === 0) cRecentes.innerHTML = `<div class="text-center text-slate-400 text-sm italic my-auto py-8">Ninguém nos últimos 2 dias.</div>`;
        else cRecentes.innerHTML = recentes.map(p => criarCard(p, 'recente')).join('');
    }

    if(cProximos) {
        if(proximos.length === 0) cProximos.innerHTML = `<div class="text-center text-blue-400 text-sm italic my-auto py-8">Ninguém nos próximos 7 dias.</div>`;
        else cProximos.innerHTML = proximos.map(p => criarCard(p, 'proximo')).join('');
    }

    if(window.lucide) window.lucide.createIcons();

    // Sincroniza a tabela mensal de aniversariantes com o mês atual e carrega
    const selMes = document.getElementById('filtro-niver-mes');
    if (selMes) {
        if (!selMes.dataset.initialized) {
            selMes.value = (dataAtual.getMonth() + 1).toString();
            selMes.dataset.initialized = 'true';
        }
        if (typeof carregarAniversarios === 'function') {
            carregarAniversarios();
        }
    }
}
