// --- STATE & PERSISTENCE ---
const STORAGE_KEYS = {
  USERS: 'app_users',
  SESSION: 'app_active_session',
  CARDS: 'app_cards',
  FOLDERS: 'app_folders'
};

const getStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

const getSession = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION) || 'null');
const setSession = (username) => localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ username }));
const clearSession = () => localStorage.removeItem(STORAGE_KEYS.SESSION);

// Active folder filter ID (null = 'All', 'unassigned' = cards with no folder, or specific folderId)
let activeFilterFolderId = null;

// --- DOM ELEMENTS ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

const views = {
  login: document.getElementById('login-view'),
  register: document.getElementById('register-view'),
  forgot: document.getElementById('forgot-view'),
  home: document.getElementById('home-view'),
  profile: document.getElementById('profile-view')
};

const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const pageTitle = document.getElementById('page-title');

const modals = {
  addMenu: document.getElementById('add-menu-modal'),
  card: document.getElementById('card-modal'),
  folder: document.getElementById('folder-modal'),
  assign: document.getElementById('assign-modal')
};

// --- ROUTING / VIEW NAVIGATION ---
function showAuthView(name) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[name].classList.add('active');
  authContainer.classList.remove('hidden');
  appContainer.classList.add('hidden');
}

function showAppView(name) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  views[name].classList.add('active');
  authContainer.classList.add('hidden');
  appContainer.classList.remove('hidden');
  pageTitle.textContent = name === 'home' ? 'Home' : 'Profile';
  closeSidebar();

  if (name === 'home') {
    activeFilterFolderId = null; // Reset filter to All
    renderHomeData();
  }
  if (name === 'profile') renderProfileData();
}

function checkAuthRoute() {
  const session = getSession();
  if (session && session.username) {
    showAppView('home');
  } else {
    showAuthView('login');
  }
}

// --- SIDEBAR ACTIONS ---
function toggleSidebar(open) {
  sidebar.classList.toggle('open', open);
  sidebarOverlay.classList.toggle('open', open);
}
function closeSidebar() { toggleSidebar(false); }

document.getElementById('hamburger-btn').addEventListener('click', () => toggleSidebar(true));
document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

document.getElementById('nav-home').addEventListener('click', () => showAppView('home'));
document.getElementById('nav-profile').addEventListener('click', () => showAppView('profile'));
document.getElementById('nav-logout').addEventListener('click', () => {
  clearSession();
  checkAuthRoute();
});

// --- AUTH ROUTING LINKS ---
document.getElementById('link-to-register').addEventListener('click', (e) => { e.preventDefault(); showAuthView('register'); });
document.getElementById('link-to-login').addEventListener('click', (e) => { e.preventDefault(); showAuthView('login'); });
document.getElementById('link-to-forgot').addEventListener('click', (e) => { e.preventDefault(); showAuthView('forgot'); });
document.getElementById('link-forgot-to-login').addEventListener('click', (e) => { e.preventDefault(); showAuthView('login'); });

// --- AUTH ACTIONS ---

// Register
document.getElementById('register-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const err = document.getElementById('reg-error');

  err.textContent = '';
  if (!username || !password || !confirm) {
    err.textContent = 'All fields are mandatory.';
    return;
  }
  if (password !== confirm) {
    err.textContent = 'Passwords do not match.';
    return;
  }

  const users = getStorage(STORAGE_KEYS.USERS);
  if (users.some(u => u.username === username)) {
    err.textContent = 'Username already exists.';
    return;
  }

  users.push({ username, password });
  setStorage(STORAGE_KEYS.USERS, users);
  document.getElementById('register-form').reset();
  showAuthView('login');
});

// Login
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const err = document.getElementById('login-error');

  err.textContent = '';
  if (!username || !password) {
    err.textContent = 'Username and password are required.';
    return;
  }

  const users = getStorage(STORAGE_KEYS.USERS);
  const found = users.find(u => u.username === username && u.password === password);

  if (!found) {
    err.textContent = 'Invalid username or password.';
    return;
  }

  setSession(username);
  document.getElementById('login-form').reset();
  showAppView('home');
});

// Forgot Password
document.getElementById('forgot-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const username = document.getElementById('forgot-username').value.trim();
  const newPass = document.getElementById('forgot-new-pass').value;
  const confirmPass = document.getElementById('forgot-confirm-pass').value;
  const err = document.getElementById('forgot-error');

  err.textContent = '';
  if (!username || !newPass || !confirmPass) {
    err.textContent = 'All fields are mandatory.';
    return;
  }
  if (newPass !== confirmPass) {
    err.textContent = 'Passwords do not match.';
    return;
  }

  const users = getStorage(STORAGE_KEYS.USERS);
  const userIdx = users.findIndex(u => u.username === username);

  if (userIdx === -1) {
    err.textContent = 'Username does not exist.';
    return;
  }

  users[userIdx].password = newPass;
  setStorage(STORAGE_KEYS.USERS, users);
  document.getElementById('forgot-form').reset();
  showAuthView('login');
});

// --- MODALS TOGGLING ---
function openModal(modal) { modal.classList.add('open'); }
function closeModal(modal) { modal.classList.remove('open'); }

document.getElementById('global-add-btn').addEventListener('click', () => openModal(modals.addMenu));
document.getElementById('menu-close').addEventListener('click', () => closeModal(modals.addMenu));

document.getElementById('menu-add-card').addEventListener('click', () => {
  closeModal(modals.addMenu);
  openModal(modals.card);
});
document.getElementById('menu-add-folder').addEventListener('click', () => {
  closeModal(modals.addMenu);
  openModal(modals.folder);
});

document.getElementById('btn-open-card-modal').addEventListener('click', () => openModal(modals.card));
document.getElementById('btn-open-folder-modal').addEventListener('click', () => openModal(modals.folder));

document.getElementById('card-cancel-btn').addEventListener('click', () => closeModal(modals.card));
document.getElementById('folder-cancel-btn').addEventListener('click', () => closeModal(modals.folder));
document.getElementById('assign-cancel-btn').addEventListener('click', () => closeModal(modals.assign));

// --- CARD & FOLDER CREATION ---

// Card Form Submission
document.getElementById('card-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const session = getSession();
  if (!session) return;

  const holder = document.getElementById('card-holder').value.trim();
  const bank = document.getElementById('bank-name').value.trim();
  const number = document.getElementById('card-number').value.trim();
  const expiry = document.getElementById('card-expiry').value.trim();
  const cvv = document.getElementById('card-cvv').value.trim();
  const err = document.getElementById('card-error');

  err.textContent = '';

  if (!holder || !bank || !number || !expiry || !cvv) {
    err.textContent = 'All fields are mandatory.';
    return;
  }
  if (!/^\d{16}$/.test(number)) {
    err.textContent = 'Card number must be exactly 16 digits.';
    return;
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    err.textContent = 'Expiry must follow MM/YY format.';
    return;
  }
  if (!/^\d{3,4}$/.test(cvv)) {
    err.textContent = 'CVV must be 3 or 4 digits.';
    return;
  }

  const cards = getStorage(STORAGE_KEYS.CARDS);
  cards.push({
    id: Date.now(),
    username: session.username,
    holder,
    bank,
    number,
    expiry,
    folderId: null // default unassigned
  });

  setStorage(STORAGE_KEYS.CARDS, cards);
  document.getElementById('card-form').reset();
  closeModal(modals.card);
  renderHomeData();
});

// Folder Form Submission
document.getElementById('folder-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const session = getSession();
  if (!session) return;

  const name = document.getElementById('folder-name').value.trim();
  const err = document.getElementById('folder-error');

  err.textContent = '';
  if (!name) {
    err.textContent = 'Folder name is mandatory.';
    return;
  }

  const folders = getStorage(STORAGE_KEYS.FOLDERS);
  folders.push({
    id: Date.now(),
    username: session.username,
    name
  });

  setStorage(STORAGE_KEYS.FOLDERS, folders);
  document.getElementById('folder-form').reset();
  closeModal(modals.folder);
  renderHomeData();
});

// --- ASSIGN TO FOLDER WORKFLOW ---

window.openAssignModal = function(cardId) {
  const session = getSession();
  if (!session) return;

  const cards = getStorage(STORAGE_KEYS.CARDS);
  const card = cards.find(c => c.id === cardId && c.username === session.username);
  if (!card) return;

  const folders = getStorage(STORAGE_KEYS.FOLDERS).filter(f => f.username === session.username);
  const select = document.getElementById('assign-folder-select');
  document.getElementById('assign-card-id').value = cardId;

  // Build options
  select.innerHTML = `
    <option value="">-- No Folder (Unassigned) --</option>
    ${folders.map(f => `
      <option value="${f.id}" ${card.folderId === f.id ? 'selected' : ''}>
        ${escapeHtml(f.name)}
      </option>
    `).join('')}
  `;

  openModal(modals.assign);
};

document.getElementById('assign-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const cardId = Number(document.getElementById('assign-card-id').value);
  const selectedFolderVal = document.getElementById('assign-folder-select').value;
  const folderId = selectedFolderVal ? Number(selectedFolderVal) : null;

  // Immutable update on cards list
  const cards = getStorage(STORAGE_KEYS.CARDS);
  const updatedCards = cards.map(card => {
    if (card.id === cardId) {
      return { ...card, folderId };
    }
    return card;
  });

  setStorage(STORAGE_KEYS.CARDS, updatedCards);
  closeModal(modals.assign);
  renderHomeData();
});

// --- FILTER SELECTION ---
window.setFolderFilter = function(filterVal) {
  activeFilterFolderId = filterVal;
  renderHomeData();
};

// --- RENDER DOM VIEWS ---
function maskCardNumber(num) {
  return `**** **** **** ${num.slice(-4)}`;
}

function renderHomeData() {
  const session = getSession();
  if (!session) return;

  const folders = getStorage(STORAGE_KEYS.FOLDERS).filter(f => f.username === session.username);
  const allCards = getStorage(STORAGE_KEYS.CARDS).filter(c => c.username === session.username);

  // Render Folders Filter Chips
  const folderList = document.getElementById('folder-list');
  const chipsHtml = [
    `<div class="folder-chip ${activeFilterFolderId === null ? 'active' : ''}" onclick="setFolderFilter(null)">All Cards</div>`,
    `<div class="folder-chip ${activeFilterFolderId === 'unassigned' ? 'active' : ''}" onclick="setFolderFilter('unassigned')">Unassigned</div>`,
    ...folders.map(f => `
      <div class="folder-chip ${activeFilterFolderId === f.id ? 'active' : ''}" onclick="setFolderFilter(${f.id})">
        &#128194; ${escapeHtml(f.name)}
      </div>
    `)
  ];
  folderList.innerHTML = chipsHtml.join('');

  // Apply Filter to Cards
  let filteredCards = allCards;
  const cardsTitle = document.getElementById('cards-title');

  if (activeFilterFolderId === 'unassigned') {
    filteredCards = allCards.filter(c => !c.folderId);
    cardsTitle.textContent = 'Unassigned Cards';
  } else if (activeFilterFolderId !== null) {
    filteredCards = allCards.filter(c => c.folderId === activeFilterFolderId);
    const activeFolder = folders.find(f => f.id === activeFilterFolderId);
    cardsTitle.textContent = activeFolder ? `${activeFolder.name} Cards` : 'Cards';
  } else {
    cardsTitle.textContent = 'All Cards';
  }

  // Render Cards
  const cardList = document.getElementById('card-list');
  if (!filteredCards.length) {
    cardList.innerHTML = '<p style="font-size: 0.85rem; color: #888;">No cards found in this view.</p>';
    return;
  }

  cardList.innerHTML = filteredCards.map(c => {
    const assignedFolder = folders.find(f => f.id === c.folderId);
    const folderLabel = assignedFolder ? assignedFolder.name : 'Unassigned';

    return `
      <div class="card-item">
        <div class="card-top">
          <div>
            <div class="card-bank">${escapeHtml(c.bank)}</div>
            <span class="card-folder-tag">&#128194; ${escapeHtml(folderLabel)}</span>
          </div>
          <button class="card-action-btn" onclick="openAssignModal(${c.id})">Folder &#9662;</button>
        </div>
        <div class="card-num">${maskCardNumber(c.number)}</div>
        <div class="card-footer">
          <span>${escapeHtml(c.holder)}</span>
          <span>Expires: ${escapeHtml(c.expiry)}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderProfileData() {
  const session = getSession();
  if (session) {
    document.getElementById('profile-username').textContent = session.username;
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// Initialize
checkAuthRoute();