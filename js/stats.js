// js/stats.js
// Lógica de Estatísticas para Paginação e Dashboard Ágil

async function atualizarEstatisticas(colecao, acao, dadosAnteriores, dadosNovos) {
    const docRef = window.doc(window.db, 'estatisticas', 'geral');
    
    try {
        await window.runTransaction(window.db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            let stats = sfDoc.exists() ? sfDoc.data() : { totalPacientes: 0, totalAtendimentos: 0, bairros: {}, sexos: {}, mesesNasc: {}, especialidades: {}, mesesAtendimento: {} };

            // Inicializações de segurança
            if(!stats.bairros) stats.bairros = {};
            if(!stats.sexos) stats.sexos = {};
            if(!stats.mesesNasc) stats.mesesNasc = {};
            if(!stats.especialidades) stats.especialidades = {};
            if(!stats.mesesAtendimento) stats.mesesAtendimento = {};

            if (colecao === 'pacientes') {
                if (acao === 'criar') {
                    stats.totalPacientes = (stats.totalPacientes || 0) + 1;
                    const bairro = dadosNovos.bairro ? dadosNovos.bairro.toUpperCase() : 'NAO INFORMADO';
                    stats.bairros[bairro] = (stats.bairros[bairro] || 0) + 1;
                    const sexo = dadosNovos.sexo ? dadosNovos.sexo.toUpperCase() : 'NAO INFORMADO';
                    stats.sexos[sexo] = (stats.sexos[sexo] || 0) + 1;
                    if (dadosNovos.nascimento) {
                        const mes = dadosNovos.nascimento.substring(5, 7);
                        stats.mesesNasc[mes] = (stats.mesesNasc[mes] || 0) + 1;
                    }
                } else if (acao === 'excluir') {
                    stats.totalPacientes = Math.max(0, (stats.totalPacientes || 0) - 1);
                    const bairro = dadosAnteriores.bairro ? dadosAnteriores.bairro.toUpperCase() : 'NAO INFORMADO';
                    stats.bairros[bairro] = Math.max(0, (stats.bairros[bairro] || 0) - 1);
                    const sexo = dadosAnteriores.sexo ? dadosAnteriores.sexo.toUpperCase() : 'NAO INFORMADO';
                    stats.sexos[sexo] = Math.max(0, (stats.sexos[sexo] || 0) - 1);
                    if (dadosAnteriores.nascimento) {
                        const mes = dadosAnteriores.nascimento.substring(5, 7);
                        stats.mesesNasc[mes] = Math.max(0, (stats.mesesNasc[mes] || 0) - 1);
                    }
                } else if (acao === 'editar') {
                    const oldBairro = dadosAnteriores.bairro ? dadosAnteriores.bairro.toUpperCase() : 'NAO INFORMADO';
                    stats.bairros[oldBairro] = Math.max(0, (stats.bairros[oldBairro] || 0) - 1);
                    const oldSexo = dadosAnteriores.sexo ? dadosAnteriores.sexo.toUpperCase() : 'NAO INFORMADO';
                    stats.sexos[oldSexo] = Math.max(0, (stats.sexos[oldSexo] || 0) - 1);
                    if (dadosAnteriores.nascimento) {
                        const mes = dadosAnteriores.nascimento.substring(5, 7);
                        stats.mesesNasc[mes] = Math.max(0, (stats.mesesNasc[mes] || 0) - 1);
                    }
                    
                    const newBairro = dadosNovos.bairro ? dadosNovos.bairro.toUpperCase() : 'NAO INFORMADO';
                    stats.bairros[newBairro] = (stats.bairros[newBairro] || 0) + 1;
                    const newSexo = dadosNovos.sexo ? dadosNovos.sexo.toUpperCase() : 'NAO INFORMADO';
                    stats.sexos[newSexo] = (stats.sexos[newSexo] || 0) + 1;
                    if (dadosNovos.nascimento) {
                        const mes = dadosNovos.nascimento.substring(5, 7);
                        stats.mesesNasc[mes] = (stats.mesesNasc[mes] || 0) + 1;
                    }
                }
            } else if (colecao === 'atendimentos') {
                if (acao === 'criar') {
                    stats.totalAtendimentos = (stats.totalAtendimentos || 0) + 1;
                    const esp = dadosNovos.especialidade ? dadosNovos.especialidade.toUpperCase() : 'NAO INFORMADO';
                    stats.especialidades[esp] = (stats.especialidades[esp] || 0) + 1;
                    if (dadosNovos.timestamp) {
                        const date = dadosNovos.timestamp.toDate ? dadosNovos.timestamp.toDate() : new Date(dadosNovos.timestamp);
                        const mes = String(date.getMonth() + 1).padStart(2, '0');
                        stats.mesesAtendimento[mes] = (stats.mesesAtendimento[mes] || 0) + 1;
                    }
                } else if (acao === 'excluir') {
                    stats.totalAtendimentos = Math.max(0, (stats.totalAtendimentos || 0) - 1);
                    const esp = dadosAnteriores.especialidade ? dadosAnteriores.especialidade.toUpperCase() : 'NAO INFORMADO';
                    stats.especialidades[esp] = Math.max(0, (stats.especialidades[esp] || 0) - 1);
                    if (dadosAnteriores.timestamp) {
                        const date = dadosAnteriores.timestamp.toDate ? dadosAnteriores.timestamp.toDate() : new Date(dadosAnteriores.timestamp);
                        const mes = String(date.getMonth() + 1).padStart(2, '0');
                        stats.mesesAtendimento[mes] = Math.max(0, (stats.mesesAtendimento[mes] || 0) - 1);
                    }
                } else if (acao === 'editar') {
                    const oldEsp = dadosAnteriores.especialidade ? dadosAnteriores.especialidade.toUpperCase() : 'NAO INFORMADO';
                    stats.especialidades[oldEsp] = Math.max(0, (stats.especialidades[oldEsp] || 0) - 1);
                    if (dadosAnteriores.timestamp) {
                        const date = dadosAnteriores.timestamp.toDate ? dadosAnteriores.timestamp.toDate() : new Date(dadosAnteriores.timestamp);
                        const mes = String(date.getMonth() + 1).padStart(2, '0');
                        stats.mesesAtendimento[mes] = Math.max(0, (stats.mesesAtendimento[mes] || 0) - 1);
                    }
                    
                    const newEsp = dadosNovos.especialidade ? dadosNovos.especialidade.toUpperCase() : 'NAO INFORMADO';
                    stats.especialidades[newEsp] = (stats.especialidades[newEsp] || 0) + 1;
                    if (dadosNovos.timestamp) {
                        const date = dadosNovos.timestamp.toDate ? dadosNovos.timestamp.toDate() : new Date(dadosNovos.timestamp);
                        const mes = String(date.getMonth() + 1).padStart(2, '0');
                        stats.mesesAtendimento[mes] = (stats.mesesAtendimento[mes] || 0) + 1;
                    }
                }
            }

            if (!sfDoc.exists()) {
                transaction.set(docRef, stats);
            } else {
                transaction.update(docRef, stats);
            }
        });
        console.log("Estatísticas atualizadas com sucesso.");
    } catch (e) {
        console.error("Erro ao atualizar estatísticas: ", e);
    }
}
window.atualizarEstatisticas = atualizarEstatisticas;

// Função para gerar as estatísticas iniciais se o DB de estatísticas estiver vazio
async function inicializarEstatisticas() {
    const docRef = window.doc(window.db, 'estatisticas', 'geral');
    const docSnap = await window.getDoc(docRef);
    if (docSnap.exists()) return; // Já existe, não faz nada
    
    console.log("Gerando estatísticas iniciais (apenas primeira vez)...");
    
    let stats = { totalPacientes: 0, totalAtendimentos: 0, bairros: {}, sexos: {}, mesesNasc: {}, especialidades: {}, mesesAtendimento: {} };
    
    // Contar pacientes
    const pacQuery = await window.getDocs(window.collection(window.db, "pacientes"));
    stats.totalPacientes = pacQuery.size;
    pacQuery.forEach(doc => {
        const d = doc.data();
        const bairro = d.bairro ? d.bairro.toUpperCase() : 'NAO INFORMADO';
        stats.bairros[bairro] = (stats.bairros[bairro] || 0) + 1;
        const sexo = d.sexo ? d.sexo.toUpperCase() : 'NAO INFORMADO';
        stats.sexos[sexo] = (stats.sexos[sexo] || 0) + 1;
        if (d.nascimento) {
            const mes = d.nascimento.substring(5, 7);
            stats.mesesNasc[mes] = (stats.mesesNasc[mes] || 0) + 1;
        }
    });
    
    // Contar atendimentos
    const atQuery = await window.getDocs(window.collection(window.db, "atendimentos"));
    stats.totalAtendimentos = atQuery.size;
    atQuery.forEach(doc => {
        const d = doc.data();
        const esp = d.especialidade ? d.especialidade.toUpperCase() : 'NAO INFORMADO';
        stats.especialidades[esp] = (stats.especialidades[esp] || 0) + 1;
        if (d.timestamp) {
            const date = d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp);
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            stats.mesesAtendimento[mes] = (stats.mesesAtendimento[mes] || 0) + 1;
        }
    });
    
    await window.setDoc(docRef, stats);
    console.log("Estatísticas iniciais salvas!");
}
window.inicializarEstatisticas = inicializarEstatisticas;
