/**
 * js/main.js
 * Ponto de entrada da aplicação.
 * Inicializa bibliotecas e configura eventos globais.
 */

window.onload = function() {
    // 1. Inicializa ícones (Lucide)
    if(typeof lucide !== 'undefined') lucide.createIcons();

    // 2. Define valores padrão nos formulários (Data de hoje, Mês atual)
    const dataAbertura = document.getElementById('data_abertura');
    if(dataAbertura) dataAbertura.valueAsDate = new Date();

    const filtroNiver = document.getElementById('filtro-niver-mes');
    if(filtroNiver) filtroNiver.value = new Date().getMonth() + 1; 

    // 3. Renderiza a estrutura vazia dos selects (loading state)
    if(typeof renderizarSelectsVazios === 'function') renderizarSelectsVazios();

    // 4. Busca as opções do Google Sheets para preencher os selects
    if(typeof carregarFiltros === 'function') carregarFiltros();
};


// ============================================================================
// EVENT LISTENERS GLOBAIS
// ============================================================================

// 1. Monitora digitação nos inputs de "Cadastrar Novo" (switched-input)
document.addEventListener('input', function(e) {
    if(e.target.classList.contains('switched-input')) {
        const id = e.target.id.replace('inp_', '');
        const hiddenField = document.getElementById(`field_${id}`);
        if(hiddenField) {
            // Garante que o valor salvo seja sempre maiúsculo
            hiddenField.value = e.target.value.toUpperCase();
        }
    }
});

// 2. Monitora mudanças globais (Data Risco e Regra do Prontuário)
document.addEventListener('change', function(e) {
    const targetId = e.target.id;

    // A. Regra do Prontuário (Só habilita se Local == HO)
    if (targetId === 'sel_local' || targetId === 'inp_local') {
        const prontuarioInput = document.getElementById('field_prontuario');
        // Pega o valor do select ou do input de novo cadastro
        const valorLocal = e.target.value ? e.target.value.toUpperCase() : '';
        
        // Verifica se é HO (no select ou digitado manualmente)
        if (valorLocal === 'HO') {
            prontuarioInput.disabled = false;
            prontuarioInput.classList.remove('bg-slate-100', 'cursor-not-allowed');
            prontuarioInput.classList.add('bg-white');
            prontuarioInput.placeholder = "Digite o número...";
            prontuarioInput.focus();
        } else {
            prontuarioInput.disabled = true;
            prontuarioInput.value = ''; // Limpa se mudar para outro local
            prontuarioInput.classList.add('bg-slate-100', 'cursor-not-allowed');
            prontuarioInput.classList.remove('bg-white');
            prontuarioInput.placeholder = "Apenas para Local HO";
        }
    }

    // B. Cálculo de Data de Risco
    const idsRisco = ['sel_especialidade', 'inp_especialidade', 'field_data_marcacao'];
    if(idsRisco.includes(targetId)) {
        if(typeof calcularDataRisco === 'function') {
            setTimeout(calcularDataRisco, 100);
        }
    }
});
