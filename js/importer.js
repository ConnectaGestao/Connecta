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

            const names = workbook.SheetNames;
            let pessoasSheet, atendimentosSheet, filtrosSheet, parceirosSheet;

            names.forEach(name => {
                const upper = name.toUpperCase();
                if (upper.includes('PESSOA') || upper.includes('PACIENTE') || upper.includes('ELEITOR') || upper.includes('MUNÍCIPE')) pessoasSheet = workbook.Sheets[name];
                else if (upper.includes('ATENDIMENTO')) atendimentosSheet = workbook.Sheets[name];
                else if (upper.includes('FILTRO')) filtrosSheet = workbook.Sheets[name];
                else if (upper.includes('PARCEIRO')) parceirosSheet = workbook.Sheets[name];
            });

            if (!pessoasSheet && names.length > 0) pessoasSheet = workbook.Sheets[names[0]];
            if (!atendimentosSheet && names.length > 1) atendimentosSheet = workbook.Sheets[names[1]];
            if (!filtrosSheet && names.length > 2) filtrosSheet = workbook.Sheets[names[2]];
            if (!parceirosSheet && names.length > 3) parceirosSheet = workbook.Sheets[names[3]];

            const pessoas = pessoasSheet ? XLSX.utils.sheet_to_json(pessoasSheet) : [];
            const atendimentos = atendimentosSheet ? XLSX.utils.sheet_to_json(atendimentosSheet) : [];
            const filtros = filtrosSheet ? XLSX.utils.sheet_to_json(filtrosSheet) : [];
            const parceiros = parceirosSheet ? XLSX.utils.sheet_to_json(parceirosSheet) : [];

            document.getElementById('import-stats').innerText = `Lidos do Excel: ${pessoas.length} munícipes, ${atendimentos.length} atendimentos, ${filtros.length} filtros, ${parceiros.length} parceiros.`;

            await importarFiltros(filtros);
            await importarPacientes(pessoas);
            await importarAtendimentos(atendimentos);
            if (typeof importarParceiros === 'function') await importarParceiros(parceiros);

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

// Normaliza as chaves do objeto (remove acentos, deixa tudo maiúsculo e remove espaços nas pontas)
function normalizeRow(row) {
    const normalized = {};
    for (let key in row) {
        let normKey = String(key).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
        normalized[normKey] = row[key];
    }
    return normalized;
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
    
    // DEBUG: Alert first row keys
    try {
        const firstRowNormalized = normalizeRow(pessoasRaw[0]);
        const keys = Object.keys(firstRowNormalized).join(" | ");
        alert("CHAVES RECONHECIDAS:\n" + keys);
    } catch(e) { console.error("Erro no debug", e); }
    
    const chunkSize = 500;
    for (let i = 0; i < pessoasRaw.length; i += chunkSize) {
        const chunk = pessoasRaw.slice(i, i + chunkSize);
        const batch = window.writeBatch(window.db);
        const pacientesRef = window.collection(window.db, "pacientes");
        
        chunk.forEach(rawRow => {
            const row = normalizeRow(rawRow);
            const docRef = window.doc(pacientesRef, String(row.ID || window.doc(pacientesRef).id));
            batch.set(docRef, {
                nome: String(row.NOME || row['NOME COMPLETO'] || ''),
                nome_social: String(row.NOME_SOCIAL || row['NOME SOCIAL'] || ''),
                apelido: String(row.APELIDO || row.REFERENCIA || ''),
                cpf: String(row.CPF || '').replace(/\D/g, ''),
                rg: String(row.RG || ''),
                nascimento: parseExcelDate(row.NASCIMENTO || row['DATA NASC.']),
                sexo: String(row.SEXO || '').toUpperCase().trim(),
                familia: String(row.FAMILIA || ''),
                conjuge: String(row.CONJUGE || ''),
                tel1: String(row.TEL1 || row.TELEFONE_1 || row.TELEFONE || row['TELEFONE 1 (WHATSAPP)'] || ''),
                tel2: String(row.TEL2 || row.TELEFONE_2 || row['TELEFONE 2'] || ''),
                profissao: String(row.PROFISSAO || ''),
                cargo_eclesiastico: String(row.CARGO_ECLESIASTICO || row['CARGO ECLESIASTICO'] || ''),
                parentes: String(row.PARENTES || row['VINCULOS FAMILIARES'] || ''),
                prontuario: String(row.PRONTUARIO || row['Nº PRONTUARIO'] || ''),
                filiacao: String(row.FILIACAO || row['FILIACAO (MAE/PAI)'] || ''),
                cep: String(row.CEP || ''),
                logradouro: String(row.LOGRADOURO || row.ENDERECO || ''),
                bairro: String(row.BAIRRO || ''),
                municipio: String(row.MUNICIPIO || row.CIDADE || ''),
                referencia: String(row.PONTO_DE_REFERENCIA || row.REFERENCIA || ''),
                sus: String(row.SUS || row['CARTAO SUS'] || ''),
                titulo: String(row.TITULO_ELEITOR || row.TITULO || row['TITULO DE ELEITOR'] || ''),
                zona: String(row.ZONA || row['ZONA ELEITORAL'] || ''),
                secao: String(row.SECAO || row['SECAO ELEITORAL'] || ''),
                status_titulo: String(row.STATUS_TITULO || row.SITUACAO_ELEITORAL || row.SITUACAO || row['SITUACAO TITULO'] || ''),
                municipio_titulo: String(row.MUNICIPIO_TITULO || row.VOTA_NO_MUNICIPIO || row['LOCAL DE VOTACAO'] || ''),
                indicacao: String(row.INDICACAO || row.QUEM_INDICOU || row['INDICACAO (LIDERANCA)'] || ''),
                lideranca: String(row.LIDERANCA || row['E LIDERANCA?'] || '').toUpperCase().trim(),
                obs: String(row.OBS || row.OBSERVACOES || row.OBSERVACAO || ''),
                data_criacao: row.DATA_CADASTRO ? parseExcelDate(row.DATA_CADASTRO) : (row['CRIADO EM'] ? parseExcelDate(row['CRIADO EM']) : new Date().toISOString())
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
        
        chunk.forEach(rawRow => {
            const row = normalizeRow(rawRow);
            const docRef = window.doc(atendimentosRef, String(row.ID_ATENDIMENTO || row.ID || window.doc(atendimentosRef).id));
            batch.set(docRef, {
                cpf_paciente: String(row.CPF_ELEITOR || row.CPF || '').replace(/\D/g, ''),
                nome_paciente: String(row.NOME_ELEITOR || row.NOME || ''),
                data_abertura: parseExcelDate(row.DATA_ABERTURA || row.DATA),
                prontuario: String(row.PRONTUARIO || ''),
                tipo_servico: String(row.TIPO_SERVICO || row.TIPO || ''),
                parceiro: String(row.PARCEIRO || ''),
                local: String(row.LOCAL || row.LOCAL_ATENDIMENTO || ''),
                especialidade: String(row.ESPECIALIDADE || ''),
                tipo: String(row['TIPO/DETALHE'] || row.DETALHE || ''),
                procedimento: String(row.PROCEDIMENTO || ''),
                data_marcacao: parseExcelDate(row.DATA_MARCACAO),
                data_risco: parseExcelDate(row.DATA_RISCO || row.DATA_LIMITE),
                data_conclusao: parseExcelDate(row.DATA_CONCLUSAO),
                status: String(row.STATUS || 'PENDENTE'),
                obs_atendimento: String(row.OBS || row.OBSERVACAO || row.OBSERVACOES || ''),
                valor: String(row.VALOR || '')
            });
        });
        await batch.commit();
    }
    console.log("Atendimentos importados");
}
