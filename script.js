// URL do arquivo de nomes no GitHub
const GITHUB_URL = 'https://raw.githubusercontent.com/psydoshy/foddaci/refs/heads/main/fodacci.txt';

// Estado da aplicacao
let allNames = [];
let searchTerm = '';
let debounceTimer = null;

// Elementos do DOM
const contentContainer = document.getElementById('content');
const searchInput = document.getElementById('search-input');
const subtitleEl = document.getElementById('subtitle');
const notesButton = document.getElementById('notes-button');
const notesDropdown = document.getElementById('notes-dropdown');

// Definir CORS_PROXIES
const CORS_PROXIES = [
  url => url,
  url => `https://cors-anywhere.herokuapp.com/${url}`,
  url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
];

// Inicializacao
document.addEventListener('DOMContentLoaded', () => {
  fetchNames();
  setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
  // Busca com debounce
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchTerm = e.target.value;
      renderNames();
      updateSubtitle();
    }, 300);
  });

  // Menu de notas
  notesButton.addEventListener('click', (e) => {
    e.stopPropagation();
    notesDropdown.classList.toggle('active');
  });

  // Fechar menu ao clicar fora
  document.addEventListener('click', (e) => {
    if (!notesDropdown.contains(e.target) && e.target !== notesButton) {
      notesDropdown.classList.remove('active');
    }
  });
}

// Buscar nomes diretamente do GitHub
async function fetchNames() {
  renderLoading();
  
  try {
    const response = await fetch(GITHUB_URL);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const text = await response.text();
    const names = text
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    allNames = names;
    renderNames();
    updateSubtitle();
  } catch (error) {
    renderError('Nao foi possivel carregar os nomes. Verifique sua conexao.');
  }
}

// Agrupar nomes por letra
function groupNamesByLetter(names) {
  const grouped = {};
  
  names.forEach(name => {
    const firstLetter = name.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(name);
  });
  
  return Object.keys(grouped)
    .sort()
    .map(letter => ({
      letter,
      names: grouped[letter].sort()
    }));
}

// Filtrar nomes
function getFilteredNames() {
  if (!searchTerm.trim()) {
    return allNames;
  }
  return allNames.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

// Atualizar subtitulo
function updateSubtitle() {
  subtitleEl.textContent = searchTerm ? 'Resultados da busca' : 'Lista completa de nomes';
}

// Renderizar loading
function renderLoading() {
  contentContainer.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;
}

// Renderizar erro
function renderError(message) {
  contentContainer.innerHTML = `
    <div class="error-container">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p class="error-message">${message}</p>
      <button class="retry-button" onclick="fetchNames()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
        Tentar novamente
      </button>
    </div>
  `;
}

// Renderizar nomes
function renderNames() {
  const filteredNames = getFilteredNames();
  const groupedNames = groupNamesByLetter(filteredNames);
  
  if (groupedNames.length === 0) {
    contentContainer.innerHTML = `
      <div class="empty-state">
        <p>Nenhum nome encontrado</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  groupedNames.forEach(group => {
    html += `
      <div class="names-section">
        <h2 class="letter-heading">${group.letter}</h2>
        <div class="names-grid">
          ${group.names.map(name => `
            <div class="name-card">
              <p>${escapeHtml(name)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  // Contador total
  const totalNames = filteredNames.length;
  html += `
    <div class="total-counter">
      <p>${searchTerm ? 'Encontrados' : 'Total de'} <span>${totalNames}</span> nome${totalNames !== 1 ? 's' : ''}</p>
    </div>
  `;
  
  contentContainer.innerHTML = html;
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
