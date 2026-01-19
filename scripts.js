// URL do arquivo de nomes no GitHub (formato raw correto)
const GITHUB_URL = 'https://raw.githubusercontent.com/psydoshy/foddaci/main/fodacci.txt';

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

// Inicializacao
document.addEventListener('DOMContentLoaded', () => {
  fetchNames();
  setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
  if (searchInput) {
    // Busca com debounce
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        searchTerm = e.target.value || '';
        renderNames();
        updateSubtitle();
      }, 300);
    });
  }

  // Menu de notas
  if (notesButton && notesDropdown) {
    notesButton.setAttribute('aria-expanded', 'false');
    notesButton.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotes();
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (!notesDropdown.contains(e.target) && e.target !== notesButton) {
        closeNotes();
      }
    });

    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeNotes();
      }
    });

    // Permitir abrir/fechar com Enter/Space quando focado
    notesButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleNotes();
      }
    });
  }
}

function toggleNotes() {
  const isActive = notesDropdown.classList.toggle('active');
  notesButton.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  if (isActive) {
    // opcional: dar foco no primeiro elemento do dropdown
    const firstFocusable = notesDropdown.querySelector('button, a, [tabindex]');
    if (firstFocusable) firstFocusable.focus();
  } else {
    notesButton.focus();
  }
}

function closeNotes() {
  if (notesDropdown.classList.contains('active')) {
    notesDropdown.classList.remove('active');
    notesButton.setAttribute('aria-expanded', 'false');
  }
}

// Buscar nomes diretamente do GitHub (fetch direto, sem proxies)
async function fetchNames() {
  renderLoading();

  try {
    const response = await fetch(GITHUB_URL, { cache: 'no-cache' });

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
    console.error('fetchNames error:', error);
    renderError('Nao foi possivel carregar os nomes. Verifique sua conexao ou o URL do arquivo.');
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
      names: grouped[letter].sort((a, b) => a.localeCompare(b))
    }));
}

// Filtrar nomes
function getFilteredNames() {
  if (!searchTerm || !searchTerm.trim()) {
    return allNames;
  }
  const term = searchTerm.toLowerCase();
  return allNames.filter(name =>
    name.toLowerCase().includes(term)
  );
}

// Atualizar subtitulo
function updateSubtitle() {
  if (!subtitleEl) return;
  subtitleEl.textContent = searchTerm ? 'Resultados da busca' : 'Lista completa de nomes';
}

// Renderizar loading
function renderLoading() {
  if (!contentContainer) return;
  contentContainer.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;
}

// Renderizar erro
function renderError(message) {
  if (!contentContainer) return;
  contentContainer.innerHTML = `
    <div class="error-container">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p class="error-message">${escapeHtml(message)}</p>
      <button class="retry-button" id="retry-fetch">
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

  const retryBtn = document.getElementById('retry-fetch');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      fetchNames();
    });
  }
}

// Renderizar nomes
function renderNames() {
  if (!contentContainer) return;

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
        <h2 class="letter-heading">${escapeHtml(group.letter)}</h2>
        <div class="names-grid">
          ${group.names.map(name => `
            <div class="name-card" role="button" tabindex="0">
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

  // Opcional: adicionar comportamento para clique nas cartas de nome
  document.querySelectorAll('.name-card').forEach(card => {
    card.addEventListener('click', () => {
      const name = card.textContent.trim();
      navigator.clipboard?.writeText(name).then(() => {
        card.classList.add('copied');
        setTimeout(() => card.classList.remove('copied'), 800);
      }).catch(() => {});
    });
  });
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
