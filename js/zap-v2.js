const templateZapDefault = decodeURIComponent("%E2%9C%A8%20CONFIRMA%C3%87%C3%83O%20DE%20AGENDAMENTO%20%E2%9C%A8%0A%0ABom%20dia%20!!%0A%0AMe%20chamo%20Simone%20e%20sou%20secret%C3%A1ria%20do%20Gabinete%20Paulinho%20Tudo%20a%20Ver.%0A%0AEstamos%20entrando%20em%20contato%20para%20confirmar%20o%20agendamento%20da%20sua%20visita%2C%20conforme%20abaixo%3A%0A%0A%F0%9F%97%B3%20*Data%3A*%20%7BDATA%7D%0A%E2%8F%B0%20*Hor%C3%A1rio%3A*%20%7BHORA%7D%0A%0A%E2%9A%A0%EF%B8%8FCaso%20tenha%20alguma%20desist%C3%AAncia%20%2C%20estaremos%20avisando%20%0A%0A%F0%9F%93%8C%20Informamos%20que%20nossa%20agenda%20regular%20est%C3%A1%20com%20disponibilidade%20apenas%20para%20Agosto%2F26%0A%0ANo%20entanto%2C%20a%20pedido%20do%20Chefe%20de%20Gabinete%2C%20Rominho%20Tudo%20a%20Ver%2C%20seu%20atendimento%20foi%20priorizado%20e%20antecipado.%0A%0A%F0%9F%93%8D%20Local%3A%20C%C3%A2mara%20dos%20Vereadores%0A%F0%9F%93%8D%20Endere%C3%A7o%3A%20Rua%20Helo%C3%ADsa%2C%20n%C2%BA%2022%0A%0A%F0%9F%94%8E%20Pontos%20de%20refer%C3%AAncia%3A%0A%E2%96%AA%EF%B8%8F%20Rua%20da%20Feira%0A%E2%96%AA%EF%B8%8F%20Queimad%C3%A3o%20das%20Telhas%0A%E2%96%AA%EF%B8%8F%20Comil%C3%A3o%20Ra%C3%A7%C3%B5es%0A%0A%F0%9F%9A%A8%20ATEN%C3%87%C3%83O%20%F0%9F%9A%A8%0A%C3%89%20proibido%20o%20atendimento%20no%20gabinete%20com%20o%20uso%20de%20bermuda.%0A%0AOs%20atendimentos%20no%20gabinete%20devem%20ser%20agendados%20exclusivamente%20pelo%20n%C3%BAmero%3A%0A%F0%9F%93%B2%20(21)%2099250-8080%0A%F0%9F%91%89%20Chefe%20de%20Gabinete%20Rominho%20Tudo%20a%20Ver");

window.abrirModalZapConfirmacao = function() {
    if (typeof histPacienteAtual === 'undefined' || !histPacienteAtual) {
        if(typeof showModalAlert === 'function') showModalAlert("Selecione um munícipe primeiro.");
        return;
    }

    
    // Resetar campos
    const inputData = document.getElementById('zap-data');
    const inputHora = document.getElementById('zap-hora');
    
    // Tenta pegar a data de marcação do primeiro atendimento pendente, se houver
    let dataMarcada = "";
    if (typeof histAtendimentos !== 'undefined' && histAtendimentos && histAtendimentos.length > 0) {
        // Pega o mais recente que não esteja concluído
        const pendentes = histAtendimentos.filter(a => a.status !== 'CONCLUIDO');
        if (pendentes.length > 0) {
            const at = pendentes[0];
            if (at.data_marcacao) {
                // Formata de YYYY-MM-DD para DD/MM
                const parts = at.data_marcacao.split('-');
                if(parts.length === 3) dataMarcada = parts[2] + '/' + parts[1];
            }
        }
    }
    
    inputData.value = dataMarcada;
    inputHora.value = "";
    
    atualizarTextoZap();
    
    document.getElementById('modal-zap-confirmacao').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
};

window.atualizarTextoZap = function() {
    const dataVal = document.getElementById('zap-data').value || "...";
    const horaVal = document.getElementById('zap-hora').value || "...";
    
    let novoTexto = templateZapDefault.replace('{DATA}', dataVal).replace('{HORA}', horaVal);
    document.getElementById('zap-texto-final').value = novoTexto;
};

window.enviarZapConfirmacao = function() {
    if (typeof histPacienteAtual === 'undefined' || !histPacienteAtual) return;
    
    const p = histPacienteAtual;
    const tel = p.tel1 || p.tel2 || '';
    const numTel = tel.replace(/\D/g, '');
    
    if (!numTel || numTel.length < 10) {
        if(typeof showModalAlert === 'function') showModalAlert("O munícipe não possui um telefone válido cadastrado.");
        return;
    }
    
    const textoFinal = document.getElementById('zap-texto-final').value;
    
    const link = `https://api.whatsapp.com/send/?phone=55${numTel}&text=${encodeURIComponent(textoFinal)}`;
    window.open(link, '_blank');
    
    document.getElementById('modal-zap-confirmacao').classList.add('hidden');
};
