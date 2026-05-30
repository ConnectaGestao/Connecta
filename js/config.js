/**
 * js/config.js
 * Arquivo de configuração e variáveis globais do sistema.
 * Migrado do Google Apps Script para Firebase Firestore.
 */

// ============================================================================
// 1. CONFIGURAÇÃO DO FIREBASE
// ============================================================================
const firebaseConfig = {
    apiKey: "AIzaSyDH9SwP1Tn8NKQSAhA7FB4HXdk91eaEc3U",
    authDomain: "gestaocentral-df944.firebaseapp.com",
    projectId: "gestaocentral-df944",
    storageBucket: "gestaocentral-df944.firebasestorage.app",
    messagingSenderId: "551075186296",
    appId: "1:551075186296:web:451b28c9f9b91695c84f8d",
    measurementId: "G-R8Q0JM4116"
};

// ============================================================================
// 2. CONTROLE DE ACESSO
// ============================================================================
// O nível de acesso (Administrador ou Visitante) agora é controlado pelo Firestore.
// Vá na coleção 'usuarios' e altere o 'perfil' do e-mail desejado para 'ADMIN'.

// ============================================================================
// 3. CONFIGURAÇÃO DOS SELECTS DINÂMICOS
// ============================================================================
const CONFIG_SELECTS = [
    // Formulário Munícipe
    { id: 'municipio', label: 'Município', container: 'container_municipio', key: 'MUNICIPIO' },
    { id: 'bairro', label: 'Bairro', container: 'container_bairro', key: 'BAIRRO' },
    { id: 'status_titulo', label: 'Situação do Título', container: 'container_status_titulo', key: 'STATUS_TITULO' },
    { id: 'indicacao', label: 'Indicação (Liderança)', container: 'container_indicacao', key: 'INDICACAO' },

    // Formulário Atendimento
    { id: 'tipo_servico', label: 'Categorias', container: 'container_tipo_servico', key: 'CATEGORIAS' },
    { id: 'tipo', label: 'Atendimento', container: 'container_tipo', key: 'ATENDIMENTO' },
    { id: 'especialidade', label: 'Especialidade', container: 'container_especialidade', key: 'ESPECIALIDADE' },
    { id: 'procedimento', label: 'Procedimento/Exames', container: 'container_procedimento', key: 'PROCEDIMENTO_EXAMES' },
    { id: 'local', label: 'Local de Atendimento', container: 'container_local', key: 'LOCAL' },
    { id: 'tipos_exame', label: 'Tipos (Específico HO)', container: 'container_tipos_exame', key: 'TIPOS_EXAME' },
    { id: 'parceiro', label: 'Parceiro/Médico', container: 'container_parceiro', key: 'PARCEIRO' },
    { id: 'status_atendimento', label: 'Status Inicial', container: 'container_status_atendimento', key: 'STATUS_ATENDIMENTO', nameOverride: 'status' }
];

// ============================================================================
// 3. VARIÁVEIS GLOBAIS
// ============================================================================
let pacienteAtual = null;
let histPacienteAtual = null;
let todosAtendimentos = [];
let todosPacientes = [];
let opcoesFiltros = {};
let dashboardRawData = null;

window.dadosRelatorioCache = {
    especialidade: [],
    procedimento: [],
    lideranca: []
};

let currentUserRole = null;
