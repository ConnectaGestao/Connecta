/**
 * js/importer.js
 * Script para importar os dados do Excel antigo para o Firestore.
 * Depende do CDN do SheetJS (xlsx) carregado no index.html.
 */

async function iniciarImportacao() {
    const fileInput = document.getElementById('input-excel');
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Por favor, selecione um arquivo Excel primeiro.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    const loadingImport = document.getElementById('loading-import');
    loadingImport.classList.remove('hidden');

    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const pessoasSheet = workbook.Sheets['Pessoas'];
            const atendimentosSheet = workbook.Sheets['Atendimentos'];
            const filtrosSheet = workbook.Sheets['Filtros'];

            const pessoas = pessoasSheet ? XLSX.utils.sheet_to_json(pessoasSheet) : [];
            const atendimentos = atendimentosSheet ? XLSX.utils.sheet_to_json(atendimentosSheet) : [];
            const filtros = filtrosSheet ? XLSX.utils.sheet_to_json(filtrosSheet) : [];

            document.getElementById('import-stats').innerText = `Lidos do Excel: ${pessoas.length} munícipes, ${atendimentos.length} atendimentos, ${filtros.length} filtros.`;

            await importarFiltros(filtros);
            await importarPacientes(pessoas);
            loadingImport.classList.add('hidden');
            showMessage("Importação concluída com sucesso! Atualizando sistema...", "success");
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error(error);
            loadingImport.classList.add('hidden');
            alert("Erro durante a importação: " + error.message);
        }
    };

    reader.readAsArrayBuffer(file);
}

// Converte a data do Excel (número de série) para o formato YYYY-MM-DD
function parseExcelDate(excelSerialDate) {
    if (!excelSerialDate) return "";
    if (typeof excelSerialDate === "string") return excelSerialDate; // Caso já seja string formatada
    const jsDate = new Date(Math.round((excelSerialDate - 25569) * 86400 * 1000));
    return jsDate.toISOString().split('T')[0];
}

async function importarFiltros(filtrosRaw) {
    if (filtrosRaw.length === 0) return;
    
    // Chunk in batches of 500
    const chunkSize = 500;
    for (let i = 0; i < filtrosRaw.length; i += chunkSize) {
        const chunk = filtrosRaw.slice(i, i + chunkSize);
        const batch = window.writeBatch(window.db);
        const filtrosRef = window.collection(window.db, "filtros");
        
        chunk.forEach(row => {
            if (row.CATEGORIA && row.VALOR) {
                const docRef = window.doc(filtrosRef);
                batch.set(docRef, {
                    categoria: String(row.CATEGORIA).toUpperCase().trim(),
                    valor: String(row.VALOR).toUpperCase().trim()
                });
            }
        });
        await batch.commit();
    }
    console.log("Filtros importados");
}

async function importarPacientes(pessoasRaw) {
    if (pessoasRaw.length === 0) return;
    
    const chunkSize = 500;
    for (let i = 0; i < pessoasRaw.length; i += chunkSize) {
        const chunk = pessoasRaw.slice(i, i + chunkSize);
        const batch = window.writeBatch(window.db);
        const pacientesRef = window.collection(window.db, "pacientes");
        
        chunk.forEach(row => {
            const docRef = window.doc(pacientesRef, String(row.ID || window.doc(pacientesRef).id));
            batch.set(docRef, {
                nome: String(row.NOME || ''),
                apelido: String(row.APELIDO || ''),
                cpf: String(row.CPF || '').replace(/\\D/g, ''),
                rg: String(row.RG || ''),
                nascimento: parseExcelDate(row.NASCIMENTO),
                sexo: String(row.SEXO || ''),
                familia: String(row.FAMILIA || ''),
                tel1: String(row.TEL1 || ''),
                tel2: String(row.TEL2 || ''),
                cep: String(row.CEP || ''),
                logradouro: String(row.LOGRADOURO || ''),
                bairro: String(row.BAIRRO || ''),
                municipio: String(row.MUNICIPIO || ''),
                referencia: String(row.PONTO_DE_REFERENCIA || ''),
                sus: String(row.SUS || ''),
                titulo: String(row.TITULO_ELEITOR || ''),
                zona: String(row.ZONA || ''),
                secao: String(row.SECAO || ''),
                status_titulo: String(row.STATUS_TITULO || ''),
                municipio_titulo: String(row.MUNICIPIO_TITULO || ''),
                indicacao: String(row.INDICACAO || ''),
                lideranca: String(row.LIDERANCA || ''),
                obs: String(row.OBS || ''),
                data_criacao: row.DATA_CADASTRO ? parseExcelDate(row.DATA_CADASTRO) : new Date().toISOString()
            });
        });
        await batch.commit();
    }
    console.log("Pacientes importados");
}

async function importarAtendimentos(atendimentosRaw) {
    if (atendimentosRaw.length === 0) return;
    
    const chunkSize = 500;
    for (let i = 0; i < atendimentosRaw.length; i += chunkSize) {
        const chunk = atendimentosRaw.slice(i, i + chunkSize);
        const batch = window.writeBatch(window.db);
        const atendimentosRef = window.collection(window.db, "atendimentos");
        
        chunk.forEach(row => {
            const docRef = window.doc(atendimentosRef, String(row.ID_ATENDIMENTO || window.doc(atendimentosRef).id));
            batch.set(docRef, {
                cpf_paciente: String(row.CPF_ELEITOR || '').replace(/\\D/g, ''),
                nome_paciente: String(row.NOME_ELEITOR || ''),
                data_abertura: parseExcelDate(row.DATA_ABERTURA),
                prontuario: String(row.PRONTUARIO || ''),
                tipo_servico: String(row.TIPO_SERVICO || ''),
                parceiro: String(row.PARCEIRO || ''),
                local: String(row.LOCAL || ''),
                especialidade: String(row.ESPECIALIDADE || ''),
                tipo: String(row['TIPO/DETALHE'] || ''),
                procedimento: String(row.PROCEDIMENTO || ''),
                data_marcacao: parseExcelDate(row.DATA_MARCACAO),
                data_risco: parseExcelDate(row.DATA_RISCO),
                data_conclusao: parseExcelDate(row.DATA_CONCLUSAO),
                status: String(row.STATUS || 'PENDENTE'),
                obs_atendimento: String(row.OBS || ''),
                valor: String(row.VALOR || '')
            });
        });
        await batch.commit();
    }
    console.log("Atendimentos importados");
}
