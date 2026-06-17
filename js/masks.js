/**
 * js/masks.js
 * Funções de máscara para os inputs e validação de CPF.
 */

function applyMask(input, maskFunction) {
    if(!input) return;
    input.addEventListener('input', function(e) {
        let val = e.target.value;
        e.target.value = maskFunction(val);
    });
}

function maskCPF(val) {
    val = val.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return val;
}

function maskRG(val) {
    // RG pode variar, mas vamos fazer um padrão comum 00.000.000-0 e aceitar letras (X)
    val = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (val.length > 9) val = val.slice(0, 9);
    
    if (val.length <= 2) return val;
    if (val.length <= 5) return val.replace(/^([a-zA-Z0-9]{2})([a-zA-Z0-9]+)/, '$1.$2');
    if (val.length <= 8) return val.replace(/^([a-zA-Z0-9]{2})([a-zA-Z0-9]{3})([a-zA-Z0-9]+)/, '$1.$2.$3');
    return val.replace(/^([a-zA-Z0-9]{2})([a-zA-Z0-9]{3})([a-zA-Z0-9]{3})([a-zA-Z0-9]+)/, '$1.$2.$3-$4');
}

function maskTitulo(val) {
    val = val.replace(/\D/g, '');
    if (val.length > 12) val = val.slice(0, 12);
    val = val.replace(/(\d{4})(\d)/, '$1 $2');
    val = val.replace(/(\d{4}) (\d{4})(\d)/, '$1 $2 $3');
    return val;
}

function maskSUS(val) {
    val = val.replace(/\D/g, '');
    if (val.length > 15) val = val.slice(0, 15);
    val = val.replace(/(\d{3})(\d)/, '$1 $2');
    val = val.replace(/(\d{3}) (\d{4})(\d)/, '$1 $2 $3');
    val = val.replace(/(\d{3}) (\d{4}) (\d{4})(\d)/, '$1 $2 $3 $4');
    return val;
}

function maskTelefone(val) {
    val = val.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    
    if (val.length <= 2) {
        return val.length > 0 ? `(${val}` : val;
    }
    if (val.length <= 6) {
        return `(${val.slice(0,2)}) ${val.slice(2)}`;
    }
    if (val.length <= 10) { // Fixo
        return `(${val.slice(0,2)}) ${val.slice(2,6)}-${val.slice(6)}`;
    }
    // Celular
    return `(${val.slice(0,2)}) ${val.slice(2,7)}-${val.slice(7)}`;
}

// CPF Validator
window.isValidCPF = function(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if(cpf === '') return false;
    // Elimina CPFs invalidos conhecidos
    if (cpf.length !== 11 || 
        cpf === "00000000000" || cpf === "11111111111" || 
        cpf === "22222222222" || cpf === "33333333333" || 
        cpf === "44444444444" || cpf === "55555555555" || 
        cpf === "66666666666" || cpf === "77777777777" || 
        cpf === "88888888888" || cpf === "99999999999")
            return false;
    
    let add = 0;
    for (let i = 0; i < 9; i ++)
        add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    
    add = 0;
    for (let i = 0; i < 10; i ++)
        add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    
    return true;
};

function initMasks() {
    // Busca os campos de CPF
    applyMask(document.getElementById('busca_cpf'), maskCPF);
    applyMask(document.getElementById('paciente_cpf_check'), maskCPF);
    
    // Busca os campos de RG, Titulo, SUS, Telefones
    applyMask(document.getElementById('field_rg'), maskRG);
    applyMask(document.getElementById('field_titulo'), maskTitulo);
    applyMask(document.getElementById('field_sus'), maskSUS);
    applyMask(document.getElementById('field_tel1'), maskTelefone);
    applyMask(document.getElementById('field_tel2'), maskTelefone);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMasks);
} else {
    initMasks();
}
