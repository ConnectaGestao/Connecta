const DB_SEED = {
  "CATEGORIAS": [
    "Consulta", "Exame", "Cirurgia", "Procedimento", "Internação", "Medicamento", "Tratamento", "Reabilitação", "TFD (Tratamento Fora do Domicílio)", "Terapia"
  ],
  "ESPECIALIDADE": [
    "Acupuntura", "Alergia e Imunologia", "Angiologia", "Cardiologia", "Cirurgia Cardíaca", "Cirurgia Geral", "Cirurgia Pediátrica", "Cirurgia Plástica", "Cirurgia Torácica", "Cirurgia Vascular", "Clínica Geral", "Coloproctologia", "Dermatologia", "Endocrinologia", "Endocrinologia Pediátrica", "Fisiatria", "Fisioterapia", "Fonoaudiologia", "Gastroenterologia", "Geriatria", "Ginecologia", "Hematologia", "Hepatologia", "Infectologia", "Mastologia", "Medicina da Dor", "Medicina do Trabalho", "Nefrologia", "Neurologia", "Neurocirurgia", "Nutrição", "Obstetrícia", "Oftalmologia", "Oncologia", "Oncologia Pediátrica", "Ortopedia", "Otorrinolaringologia", "Pediatria", "Pneumologia", "Proctologia", "Psicologia", "Psiquiatria", "Radioterapia", "Reumatologia", "Serviço Social", "Terapia Ocupacional", "Urologia"
  ],
  "PROCEDIMENTO_EXAMES": [
    "Angiorressonância", "Arteriografia", "Densitometria Óssea", "Mamografia", "Ressonância Magnética", "Tomografia Computadorizada", "Ultrassonografia", "Raio-X", "PET Scan", "Cintilografia",
    "Colonoscopia", "Endoscopia", "Ecocardiograma", "Eletrocardiograma", "Eletroneuromiografia", "Holter 24h", "MAPA 24h", "Teste Ergométrico", "Cateterismo Cardíaco", "Broncoscopia", "Videolaringoscopia",
    "Exames de Sangue", "Exames Hormonais", "Exames Genéticos", "Biópsias", "Anatomopatológico",
    "Infiltração", "Bloqueio Neurológico", "Punção", "Hemodiálise", "Quimioterapia", "Radioterapia", "Fisioterapia", "Terapia Ocupacional", "Fonoaudiologia",
    "[CIRURGIA] Bariátrica", "[CIRURGIA] Catarata", "[CIRURGIA] Cardíaca", "[CIRURGIA] Hérnia", "[CIRURGIA] Vesícula", "[CIRURGIA] Histerectomia", "[CIRURGIA] Ortopédica", "[CIRURGIA] Coluna", "[CIRURGIA] Joelho", "[CIRURGIA] Quadril", "[CIRURGIA] Ombro", "[CIRURGIA] Vascular", "[CIRURGIA] Neurocirurgia", "[CIRURGIA] Prostatectomia", "[CIRURGIA] Oncológica", "[CIRURGIA] Oftalmológica", "[CIRURGIA] Geral", "[CIRURGIA] Plástica Reparadora"
  ],
  "PRIORIDADE": [
    "Baixa", "Média", "Alta", "Urgente", "Acamado", "Cadeirante", "Pessoa com Deficiência", "Gestante", "Idoso", "Criança", "Paciente Oncológico", "Doença Rara", "Alto Risco", "Judicializado", "Vulnerabilidade Social", "Beneficiário de Programa Social"
  ],
  "STATUS_ATENDIMENTO": [
    "Recebido", "Em Análise", "Encaminhado", "Aguardando Vaga", "Aguardando Retorno", "Agendado", "Em Tratamento", "Resolvers", "Resolvido", "Indeferido", "Cancelado"
  ]
};

window.seedInitialData = async function() {
    console.log("Iniciando seedInitialData via botão ou auto...");
    localStorage.setItem('seed_run', 'false'); // reset the local storage just in case
    if(!window.db) {
        alert("Firebase DB não carregado!");
        return;
    }
    try {
        if(typeof showMessage === 'function') showMessage('Iniciando injeção de dados. Por favor, aguarde...', 'info');
        console.log("Iniciando seed de dados oficiais...");
        for (let chave of Object.keys(DB_SEED)) {
            const q = window.query(window.collection(window.db, 'config_selects'), window.where('chave', '==', chave));
            const snap = await window.getDocs(q);
            
            const inDb = new Set();
            snap.forEach(d => { if(d.data().valor) inDb.add(d.data().valor.toUpperCase().trim()); });
            
            let added = 0;
            for (let val of DB_SEED[chave]) {
                const normVal = String(val).toUpperCase().trim();
                if (!inDb.has(normVal)) {
                    await window.addDoc(window.collection(window.db, 'config_selects'), {
                        chave: chave,
                        valor: normVal,
                        criacao: new Date().toISOString()
                    });
                    added++;
                }
            }
            if(added > 0) {
                console.log(`[SEED] ${chave}: Adicionados ${added} novos itens oficiais.`);
            }
        }
        console.log("Seed finalizado com sucesso!");
        if(typeof showMessage === 'function') showMessage('Listas iniciais inseridas com sucesso! Recarregando a página...', 'success');
        setTimeout(() => window.location.reload(), 2000);
    } catch(e) {
        console.error("Erro no seed:", e);
        if(typeof showModalAlert === 'function') showModalAlert('Erro ao inserir: ' + e.message);
    }
}
// Executar automaticamente após o carregamento da página
setTimeout(() => {
    if (localStorage.getItem('seed_run') !== 'true') {
        if (typeof seedInitialData === 'function') {
            seedInitialData().then(() => {
                localStorage.setItem('seed_run', 'true');
            });
        }
    }
}, 5000); // aguarda 5s para garantir que Firebase e configs carregaram

window.extrairDadosParaListas = async function() {
    try {
        if(!window.db) return;
        if(typeof showMessage === 'function') showMessage('Extraindo dados antigos para listas genéricas. Aguarde...', 'info');
        
        const inDb = new Set();
        const snapConfig = await window.getDocs(window.collection(window.db, 'config_selects'));
        snapConfig.forEach(d => {
            const data = d.data();
            if(data.chave && data.valor) {
                inDb.add(`${data.chave}_${data.valor.toUpperCase().trim()}`);
            }
        });

        async function addIfNew(chave, valor) {
            if(!valor || typeof valor !== 'string') return;
            const normVal = valor.toUpperCase().trim();
            if(normVal === '' || normVal === 'SELECIONE...' || normVal === 'NÃO' || normVal === 'SIM') return;
            const uid = `${chave}_${normVal}`;
            if(!inDb.has(uid)) {
                await window.addDoc(window.collection(window.db, 'config_selects'), {
                    chave: chave,
                    valor: normVal,
                    criacao: new Date().toISOString()
                });
                inDb.add(uid);
            }
        }

        // 1. Lideranças (da coleção antiga)
        try {
            const snapLider = await window.getDocs(window.collection(window.db, 'liderancas'));
            for(let doc of snapLider.docs) {
                await addIfNew('LIDERANCA', doc.data().nome);
            }
        } catch(e) { console.log('Sem coleção liderancas'); }

        // 2. Pacientes (STATUS_TITULO)
        const snapPac = await window.getDocs(window.collection(window.db, 'pacientes'));
        for(let doc of snapPac.docs) {
            await addIfNew('STATUS_TITULO', doc.data().status_titulo);
            // also try to get lideranca from paciente
            if (doc.data().indicacao) await addIfNew('LIDERANCA', doc.data().indicacao);
        }

        // 3. Atendimentos (LOCAL e PARCEIRO)
        const snapAtend = await window.getDocs(window.collection(window.db, 'atendimentos'));
        for(let doc of snapAtend.docs) {
            await addIfNew('LOCAL', doc.data().local);
            await addIfNew('PARCEIRO', doc.data().parceiro);
            if (doc.data().indicacao) await addIfNew('LIDERANCA', doc.data().indicacao);
        }

        if(typeof showMessage === 'function') showMessage('Extração concluída com sucesso! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 2000);
    } catch(e) {
        console.error(e);
        if(typeof showModalAlert === 'function') showModalAlert('Erro ao extrair: ' + e.message);
    }
};

setTimeout(() => {
    if (localStorage.getItem('extracao_run') !== 'true') {
        if (typeof extrairDadosParaListas === 'function') {
            extrairDadosParaListas().then(() => {
                localStorage.setItem('extracao_run', 'true');
            });
        }
    }
}, 7000);

window.limparDuplicadas = async function() {
  if(!confirm('Deseja limpar itens duplicados nas listas?')) return;
  try {
    if(typeof showMessage === 'function') showMessage('Limpando duplicadas. Aguarde...', 'info');
    const snap = await window.getDocs(window.collection(window.db, 'config_selects'));
    const unicos = new Set();
    let removidos = 0;
    for(let doc of snap.docs) {
      const d = doc.data();
      const ch = String(d.chave || d.tipo || '').trim().toUpperCase();
      const val = String(d.valor || d.nome || '').trim().toUpperCase();
      if(!ch || !val) continue;
      const hash = ch + '_' + val;
      if(unicos.has(hash)) {
        await window.deleteDoc(doc.ref);
        removidos++;
      } else {
        unicos.add(hash);
      }
    }
    if(typeof showMessage === 'function') showMessage(`Limpeza concluída! ${removidos} itens duplicados removidos.`, 'success');
    if(typeof carregarListaAdmin === 'function') carregarListaAdmin();
  } catch(e) {
    alert('Erro: ' + e.message);
  }
};
