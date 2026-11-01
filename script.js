/* ===================================================
   TEMA JS 1: CABECERA Y CAMBIO DE FONDO (LOCALSTORAGE)
   =================================================== */
// 1. Fecha formateada
const dateElement = document.getElementById('current-date');
const today = new Date();
dateElement.textContent = today.toLocaleDateString('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

// 2. Fondo guardado en el teléfono
const heroHeader = document.getElementById('hero-header');
const coverInput = document.getElementById('cover-input');

const savedCover = localStorage.getItem('amaia_cover_image');
if (savedCover) {
  heroHeader.style.backgroundImage = `url('${savedCover}')`;
}

coverInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const base64Image = event.target.result;
      heroHeader.style.backgroundImage = `url('${base64Image}')`;
      localStorage.setItem('amaia_cover_image', base64Image);
    };
    reader.readAsDataURL(file);
  }
});

/* ===================================================
   TEMA JS 2: GESTIÓN DE PESTAÑAS (PÍLDORAS)
   =================================================== */
const pillButtons = document.querySelectorAll('.pill-btn');
const viewPanels = document.querySelectorAll('.view-panel');

pillButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    pillButtons.forEach(b => b.classList.remove('active'));
    viewPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const targetId = btn.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');
  });
});

/* ===================================================
   TEMA JS 3: ALMACENAMIENTO DE TAREAS
   =================================================== */
let tasks = JSON.parse(localStorage.getItem('amaia_tasks')) || [];

function saveAndRenderTasks() {
  localStorage.setItem('amaia_tasks', JSON.stringify(tasks));
  renderTasks();
}

/* ===================================================
   TEMA JS 4: FORMULARIO DE TAREAS
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
   TEMA JS 5: ACCIONES Y RENDERIZADO
   =================================================== */
window.toggleTask = function(id) {
  tasks = tasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t));
  saveAndRenderTasks();
};

window.deleteTask = function(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveAndRenderTasks();
};

function renderTasks() {
  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="placeholder-box">
        <p>🎉 ¡No tienes tareas pendientes!</p>
        <p style="font-size: 0.85rem; margin-top: 4px;">Pulsa el botón de arriba para apuntar deberes o exámenes.</p>
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

renderTasks();