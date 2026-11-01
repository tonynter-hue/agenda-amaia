/* ===================================================
   TEMA JS 1: INICIALIZACIÓN Y FECHA CABECERA
   =================================================== */
const dateElement = document.getElementById('current-date');
const today = new Date();
dateElement.textContent = today.toLocaleDateString('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

/* ===================================================
   TEMA JS 2: GESTIÓN DE PESTAÑAS / VISTAS
   =================================================== */
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(nav => nav.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));

    item.classList.add('active');
    const targetId = item.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');
  });
});

/* ===================================================
   TEMA JS 3: ALMACENAMIENTO Y ESTADO DE TAREAS
   =================================================== */
let tasks = JSON.parse(localStorage.getItem('amaia_tasks')) || [];

function saveAndRenderTasks() {
  localStorage.setItem('amaia_tasks', JSON.stringify(tasks));
  renderTasks();
}

/* ===================================================
   TEMA JS 4: FORMULARIO Y CONTROL DE EVENTOS
   =================================================== */
const formCard = document.getElementById('task-form-card');
const openFormBtn = document.getElementById('open-form-btn');
const closeFormBtn = document.getElementById('close-form-btn');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

openFormBtn.addEventListener('click', () => {
  formCard.classList.add('visible');
  openFormBtn.style.display = 'none';
});

closeFormBtn.addEventListener('click', () => {
  formCard.classList.remove('visible');
  openFormBtn.style.display = 'flex';
  taskForm.reset();
});

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newTask = {
    id: Date.now(),
    subject: document.getElementById('task-subject').value,
    title: document.getElementById('task-title').value.trim(),
    dueDate: document.getElementById('task-due').value,
    completed: false
  };

  tasks.unshift(newTask);
  saveAndRenderTasks();

  taskForm.reset();
  formCard.classList.remove('visible');
  openFormBtn.style.display = 'flex';
});

/* ===================================================
   TEMA JS 5: ACCIONES Y RENDERIZADO DE TAREAS
   =================================================== */
window.toggleTask = function(id) {
  tasks = tasks.map(task => {
    if (task.id === id) task.completed = !task.completed;
    return task;
  });
  saveAndRenderTasks();
};

window.deleteTask = function(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveAndRenderTasks();
};

function renderTasks() {
  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <p>🎉 ¡No tienes tareas pendientes!</p>
        <p style="font-size: 0.85rem; margin-top: 6px;">Pulsa el botón superior para apuntar tareas.</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = tasks.map(task => {
    const dateFormatted = task.dueDate 
      ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      : 'Sin fecha';

    return `
      <article class="task-item ${task.completed ? 'completed' : ''}">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          ${task.completed ? 'checked' : ''} 
          onchange="toggleTask(${task.id})"
        >
        <div class="task-info">
          <span class="task-subject">${task.subject}</span>
          <div class="task-text">${task.title}</div>
          <div class="task-date">📅 Entrega: ${dateFormatted}</div>
        </div>
        <button class="btn-delete" onclick="deleteTask(${task.id})" title="Borrar">✕</button>
      </article>
    `;
  }).join('');
}

// Carga inicial
renderTasks();