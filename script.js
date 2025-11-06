// script.js
// Lógica completa: tarefas, filtros, pesquisa, sidebar, dark mode persistente e toasts.

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'EsToDoList_tasks';
  const THEME_KEY = 'EsToDoList_theme';

  // elementos
  const taskInput = document.getElementById('taskInput');
  const addTaskBtn = document.getElementById('addTask');
  const taskList = document.getElementById('taskList');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const filterActive = document.getElementById('filterActive');
  const filterCompleted = document.getElementById('filterCompleted');
  const filterAll = document.getElementById('filterAll');
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');
  const darkModeBtn = document.getElementById('darkMode');
  const toastContainer = document.getElementById('toastContainer');

  // estado
  let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let filter = 'all';
  let overlay = null;

  // ---------------- utilitários ----------------
  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function showToast(msg, colorClass = 'bg-green-500') {
    const toast = document.createElement('div');
    toast.className = `toast ${colorClass} text-white px-4 py-2 rounded-lg shadow`;
    toast.style.minWidth = '160px';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }

  // ---------------- theme (dark mode) ----------------
  function applyThemeFromStorage() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    updateThemeButton();
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    updateThemeButton();
  }

  function updateThemeButton() {
    // muda o ícone do botão
    if (!darkModeBtn) return;
    const isDark = document.documentElement.classList.contains('dark');
    darkModeBtn.textContent = isDark ? '☀️' : '🌙';
  }

  // ---------------- sidebar mobile overlay ----------------
  function openSidebarMobile() {
    sidebar.classList.remove('-translate-x-full');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/40 z-20 md:hidden';
      overlay.addEventListener('click', closeSidebarMobile);
      document.body.appendChild(overlay);
    }
  }

  function closeSidebarMobile() {
    // só fecha no mobile: adicionamos a classe novamente
    if (!sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.add('-translate-x-full');
    }
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function toggleSidebarMobile() {
    // se visível -> fechar, se fechado -> abrir
    const isHidden = sidebar.classList.contains('-translate-x-full');
    if (isHidden) openSidebarMobile();
    else closeSidebarMobile();
  }

  // fecha sidebar se o viewport aumentar para desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      // remove overlay se houver
      if (overlay) { overlay.remove(); overlay = null; }
      // garante que a sidebar esteja visível em desktop (tailwind já cuida com md:translate-x-0)
      sidebar.classList.remove('-translate-x-full');
    } else {
      // mobile: por padrão manter fechada (se quiser)
      // não forçar nada aqui
    }
  });

  // ---------------- tarefas (CRUD) ----------------
  function createId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) {
      showToast('Digite uma tarefa!', 'bg-yellow-500');
      return;
    }
    tasks.push({ id: createId(), text: trimmed, done: false });
    saveTasks();
    renderTasks();
    showToast('Tarefa adicionada');
  }

  function editTask(id, newText) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    tasks[idx].text = newText;
    saveTasks();
    renderTasks();
    showToast('Tarefa editada');
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    showToast('Tarefa excluída', 'bg-red-500');
  }

  function toggleDone(id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    tasks[idx].done = !tasks[idx].done;
    saveTasks();
    renderTasks();
  }

  // ---------------- render ----------------
  function updateFilterButtonsUI() {
    const btns = [filterActive, filterCompleted, filterAll];
    btns.forEach(b => {
      if (!b) return;
      b.classList.remove('ring-2', 'ring-green-500', 'scale-105');
    });
    if (filter === 'active') filterActive.classList.add('ring-2', 'ring-green-500', 'scale-105');
    else if (filter === 'completed') filterCompleted.classList.add('ring-2', 'ring-green-500', 'scale-105');
    else if (filter === 'all') filterAll.classList.add('ring-2', 'ring-green-500', 'scale-105');
  }

  function renderTasks() {
    taskList.innerHTML = '';
    updateFilterButtonsUI();

    let filtered = tasks;
    if (filter === 'active') filtered = tasks.filter(t => !t.done);
    if (filter === 'completed') filtered = tasks.filter(t => t.done);

    const search = (searchInput?.value || '').toLowerCase().trim();
    if (search) filtered = filtered.filter(t => t.text.toLowerCase().includes(search));

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-center text-gray-500 dark:text-gray-400 p-4';
      empty.textContent = 'Nenhuma tarefa encontrada';
      taskList.appendChild(empty);
      return;
    }

    filtered.forEach(task => {
      const li = document.createElement('li');
      li.dataset.id = task.id;
      li.className = 'flex justify-between items-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 rounded-xl shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition';

      const span = document.createElement('span');
      span.className = `flex-1 cursor-pointer ${task.done ? 'line-through text-gray-400 italic' : ''}`;
      span.textContent = '# ' + task.text;

      span.addEventListener('click', () => toggleDone(task.id));

      const btns = document.createElement('div');
      btns.className = 'flex gap-2';

      const editBtn = document.createElement('button');
      editBtn.className = 'edit text-yellow-600 hover:text-yellow-800';
      editBtn.title = 'Editar';
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => {
        const newText = prompt('Editar tarefa:', task.text);
        if (newText != null) {
          const trimmed = newText.trim();
          if (trimmed === '') {
            showToast('Texto inválido', 'bg-yellow-500');
            return;
          }
          editTask(task.id, trimmed);
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete text-red-600 hover:text-red-800';
      deleteBtn.title = 'Excluir';
      deleteBtn.textContent = '🗑️';
      deleteBtn.addEventListener('click', () => {
        if (confirm('Deseja excluir essa tarefa?')) deleteTask(task.id);
      });

      btns.appendChild(editBtn);
      btns.appendChild(deleteBtn);

      li.appendChild(span);
      li.appendChild(btns);
      taskList.appendChild(li);
    });
  }

  // ---------------- eventos ----------------
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => addTask(taskInput.value));
  }

  if (taskInput) {
    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addTask(taskInput.value);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderTasks);
    if (searchBtn) searchBtn.addEventListener('click', renderTasks);
  }

  if (filterActive) filterActive.addEventListener('click', () => { filter = 'active'; renderTasks(); });
  if (filterCompleted) filterCompleted.addEventListener('click', () => { filter = 'completed'; renderTasks(); });
  if (filterAll) filterAll.addEventListener('click', () => { filter = 'all'; renderTasks(); });

  if (menuBtn) menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // toggle comportamento mobile
    toggleSidebarMobile();
  });

  // fecha sidebar ao clicar em ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebarMobile();
  });

  if (darkModeBtn) darkModeBtn.addEventListener('click', toggleTheme);

  // clique fora da sidebar fecha no mobile
  document.addEventListener('click', (e) => {
    // se clicou fora e sidebar está aberta no mobile, fecha
    if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
      const inside = sidebar.contains(e.target) || (menuBtn && menuBtn.contains(e.target));
      if (!inside) closeSidebarMobile();
    }
  });

  // ---------------- inicialização ----------------
  applyThemeFromStorage();
  renderTasks();
});
