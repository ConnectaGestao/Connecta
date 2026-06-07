/**
 * js/exporter.js
 * Lógica para exportação do banco de dados (Firebase) para arquivo Excel (.xlsx).
 */

async function exportarExcel() {
    const loading = document.getElementById('loading-export');
    if(loading) loading.classList.remove('hidden');
    
    try {
        // 1. Buscar todos os Pacientes
        const qPacientes = window.query(window.collection(window.db, "pacientes"));
        const snapPacientes = await window.getDocs(qPacientes);
        const pacientes = [];
        const pacientesMap = {}; // Para buscar o nome rapidamente ao exportar os atendimentos
        
        snapPacientes.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            pacientes.push(data);
            pacientesMap[data.cpf] = data.nome || data.apelido || 'Desconhecido';
        });

        // 2. Buscar todos os Atendimentos
        const qAtendimentos = window.query(window.collection(window.db, "atendimentos"));
        const snapAtendimentos = await window.getDocs(qAtendimentos);
        const atendimentos = [];
        
        snapAtendimentos.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            atendimentos.push(data);
        });

        // 3. Formatar Pacientes para Excel (Mapeamento amigável)
        const formatarData = (isoStr) => {
            if(!isoStr) return '';
            try {
                const parts = isoStr.split('T')[0].split('-');
                if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                return isoStr;
            } catch(e) { return isoStr; }
        };

        const dadosPacientes = pacientes.map(p => ({
            "Nome Completo": p.nome || '',
            "Nome Social": p.nome_social || '',
            "Referência": p.apelido || '',
            "CPF": p.cpf || '',
            "RG": p.rg || '',
            "Data Nasc.": formatarData(p.nascimento),
            "Idade": p.idade || '',
            "Sexo": p.sexo || '',
            "Telefone 1 (WhatsApp)": p.tel1 || '',
            "Telefone 2": p.tel2 || '',
            "Família": p.familia || '',
            "Cônjuge": p.conjuge || '',
            "Profissão": p.profissao || '',
            "Cargo Eclesiástico": p.cargo_eclesiastico || '',
            "Vínculos Familiares": p.parentes || '',
            "Nº Prontuário": p.prontuario || '',
            "Indicação (Liderança)": p.indicacao || '',
            "É Liderança?": p.lideranca === 'SIM' ? 'SIM' : 'NÃO',
            "Filiação (Mãe/Pai)": p.filiacao || '',
            "Cartão SUS": p.sus || '',
            "Título de Eleitor": p.titulo || '',
            "Zona Eleitoral": p.zona || '',
            "Seção Eleitoral": p.secao || '',
            "Situação Título": p.status_titulo || '',
            "Local de Votação": p.local_votacao || '',
            "Município": p.municipio || '',
            "Bairro": p.bairro || '',
            "Logradouro": p.logradouro || '',
            "CEP": p.cep || '',
            "Ponto de Referência": p.referencia || '',
            "Criado Em": formatarData(p.data_criacao)
        }));

        // 4. Formatar Atendimentos para Excel
        const dadosAtendimentos = atendimentos.map(a => ({
            "Nome Paciente": pacientesMap[a.cpf_paciente] || 'Munícipe Excluído',
            "CPF Paciente": a.cpf_paciente || '',
            "Data de Abertura": formatarData(a.data_abertura),
            "Status": a.status || '',
            "Especialidade / Pedido": a.especialidade || '',
            "Procedimento": a.procedimento || '',
            "Local do Atendimento": a.local || '',
            "Tipo de Serviço": a.tipo || '',
            "Médico / Profissional": a.medico || '',
            "UBS de Origem": a.ubs || '',
            "Data Marcada (Consulta)": formatarData(a.data_marcacao),
            "Data de Risco": formatarData(a.data_risco),
            "Nº Prontuário (Paciente)": a.prontuario || '', // It will still export if legacy data exists
            "Observações": a.observacao || ''
        }));

        // 5. Criar Workbook e Worksheets
        const wb = XLSX.utils.book_new();
        
        // Criar aba de Munícipes
        const wsPacientes = XLSX.utils.json_to_sheet(dadosPacientes);
        XLSX.utils.book_append_sheet(wb, wsPacientes, "Munícipes");
        
        // Criar aba de Atendimentos
        const wsAtendimentos = XLSX.utils.json_to_sheet(dadosAtendimentos);
        XLSX.utils.book_append_sheet(wb, wsAtendimentos, "Atendimentos");

        // 6. Configurar largura das colunas para ficar organizado
        const wscolsPacientes = [
            {wch: 35}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 6}, {wch: 10}, 
            {wch: 18}, {wch: 18}, {wch: 20}, {wch: 20}, {wch: 12}, {wch: 30}, {wch: 20},
            {wch: 15}, {wch: 10}, {wch: 10}, {wch: 15}, {wch: 30}, {wch: 20}, {wch: 20},
            {wch: 35}, {wch: 12}, {wch: 30}, {wch: 15}
        ];
        wsPacientes['!cols'] = wscolsPacientes;

        const wscolsAtendimentos = [
            {wch: 35}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 30}, {wch: 30}, 
            {wch: 25}, {wch: 20}, {wch: 25}, {wch: 25}, {wch: 15}, {wch: 15}, 
            {wch: 15}, {wch: 40}
        ];
        wsAtendimentos['!cols'] = wscolsAtendimentos;

        // 7. Salvar o arquivo
        const dataAtual = new Date();
        const strData = `${dataAtual.getFullYear()}${(dataAtual.getMonth()+1).toString().padStart(2,'0')}${dataAtual.getDate().toString().padStart(2,'0')}`;
        
        XLSX.writeFile(wb, `Backup_Gestao_Central_${strData}.xlsx`);
        
        if(loading) loading.classList.add('hidden');
        showModalAlert("Exportação concluída com sucesso! Verifique a pasta de downloads do seu navegador.");

    } catch (e) {
        console.error("Erro na exportação:", e);
        if(loading) loading.classList.add('hidden');
        showModalAlert("Ocorreu um erro ao tentar exportar os dados. Tente novamente.");
    }
}
