/**
 * js/charts.js
 * Responsável por toda a lógica de visualização de dados usando Chart.js
 */

let chartsInstance = {};

function countByField(arr, field, limit, modo = 'atendimento') {
    const counts = {};
    const cpfsSeen = {};
    
    arr.forEach(item => {
        const val = item[field] ? item[field].trim().toUpperCase() : 'N/I';
        
        if (modo === 'municipe') {
            const cpf = item.cpf_paciente || item.cpf;
            if (cpf) {
                if (!cpfsSeen[val]) cpfsSeen[val] = new Set();
                if (cpfsSeen[val].has(cpf)) return; // Já contou este paciente para esta categoria
                cpfsSeen[val].add(cpf);
            }
        }
        
        counts[val] = (counts[val] || 0) + 1;
    });
    
    return Object.entries(counts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, limit || 1000); 
}

function renderizarGraficos(atendimentos, pacientes, modo = 'atendimento') {
    const barOptions = { 
        indexAxis: 'y', 
        responsive: true, 
        plugins: { legend: { display: false } }, 
        scales: { x: { beginAtZero: true } } 
    };
    
    // 1. Gráfico de Especialidades (Top 10)
    const especData = countByField(atendimentos, 'especialidade', 10, modo);
    createChart('chartEspecialidade', 'bar', 
        especData.map(i=>i[0]), 
        especData.map(i=>i[1]), 
        { ...barOptions, backgroundColor: '#3b82f6' } 
    );

    // 2. Gráfico de Procedimentos (Top 10)
    const procData = countByField(atendimentos, 'procedimento', 10, modo);
    createChart('chartProcedimento', 'bar', 
        procData.map(i=>i[0]), 
        procData.map(i=>i[1]), 
        { ...barOptions, backgroundColor: '#10b981' } 
    );

    // 3. Gráfico de Locais
    const localData = countByField(atendimentos, 'local', null, modo);
    createChart('chartLocal', 'bar', 
        localData.map(i=>i[0]), 
        localData.map(i=>i[1]), 
        { ...barOptions, backgroundColor: '#8b5cf6' } 
    );

    // 4. Gráfico de Tipos de Serviço
    const tipoData = countByField(atendimentos, 'tipo', null, modo);
    createChart('chartTipo', 'bar', 
        tipoData.map(i=>i[0]), 
        tipoData.map(i=>i[1]), 
        { ...barOptions, backgroundColor: '#f59e0b' } 
    );

    // 5. Gráfico de Título de Eleitor - CLICKABLE
    const tituloData = countByField(pacientes, 'status_titulo', null, modo);
    
    const towerOptions = { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }, 
        scales: { y: { beginAtZero: true } },
        // EVENTO DE CLIQUE ATUALIZADO
        onClick: (evt, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const label = tituloData.map(i => i[0])[index]; // Pega o rótulo clicado (ex: REGULAR)
                
                // Agora chama a função correta do novo relatório
                if (typeof abrirRelatorioEleitoral === 'function') {
                    // Passamos o label caso queira implementar filtro automático no futuro
                    abrirRelatorioEleitoral(label);
                }
            }
        },
        onHover: (event, chartElement) => {
            event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
        }
    };

    createChart('chartTitulo', 'bar', 
        tituloData.map(i=>i[0]), 
        tituloData.map(i=>i[1]), 
        { 
            ...towerOptions,
            backgroundColor: [
                '#22c55e', '#ef4444', '#eab308', '#94a3b8', '#3b82f6'
            ]
        }
    );
}

function createChart(canvasId, type, labels, data, options) {
    if(chartsInstance[canvasId]) chartsInstance[canvasId].destroy();
    
    const ctx = document.getElementById(canvasId).getContext('2d');
    const bg = options.backgroundColor;

    const defaultDatalabels = {
        anchor: 'end', 
        align: 'end',  
        color: '#64748b', 
        font: { weight: 'bold', size: 11 },
        formatter: (value) => value > 0 ? value : '' 
    };

    const userDatalabels = options.plugins && options.plugins.datalabels ? options.plugins.datalabels : {};
    
    const chartOptions = {
        ...options,
        layout: {
            padding: { top: 25, right: 35, left: 0, bottom: 0 }
        },
        plugins: {
            ...options.plugins,
            datalabels: { ...defaultDatalabels, ...userDatalabels }
        }
    };

    chartsInstance[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: bg,
                borderWidth: 1
            }]
        },
        options: chartOptions,
        plugins: [ChartDataLabels] 
    });
}
