/* ===================================================
   TEMA JS 1: CABECERA, MENÚ 3 PUNTOS Y FONDO
   =================================================== */
// 1. Registro del Service Worker para PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
}

// 2. Fecha formateada
const dateElement = document.getElementById('current-date');
const today = new Date();
dateElement.textContent = today.toLocaleDateString('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

// 3. Menú de 3 puntos
const menuDotsBtn = document.getElementById('menu-dots-btn');
const menuDropdown = document.getElementById('menu-dropdown');

menuDotsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle('show');
});

// Cerrar el menú si pulsa fuera
document.addEventListener('click', () => {
  menuDropdown.classList.remove('show');
});

// 4. Guardar y cargar fondo de cabecera
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
      menuDropdown.classList.remove('show');
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
   TEMA JS 3: CONEXIÓN CON FIREBASE CLOUD
   =================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyAjklSkVXN1bM-mJUArpi6-YP-wmY7DZn8",
  authDomain: "agenda-amaia.firebaseapp.com",
  projectId: "agenda-amaia",
  storageBucket: "agenda-amaia.firebasestorage.app",
  messagingSenderId: "791939976390",
  appId: "1:791939976390:web:cb6dc70856388b4040dbc7"
};

// Iniciar Firebase y la base de datos Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Activar persistencia sin conexión (funciona aunque no haya cobertura)
db.enablePersistence().catch(() => {});

let tasks = [];

// Sincronización en tiempo real: cualquier cambio en la nube se dibuja al instante
db.collection('tasks').orderBy('id', 'desc').onSnapshot((snapshot) => {
  tasks = [];
  snapshot.forEach((doc) => {
    tasks.push(doc.data());
  });
  renderTasks();
});

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

// Guardar nueva tarea en la nube de Google
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newTask = {
    id: Date.now(),
    subject: document.getElementById('task-subject').value,
    title: document.getElementById('task-title').value.trim(),
    dueDate: document.getElementById('task-due').value,
    completed: false
  };

  try {
    await db.collection('tasks').doc(String(newTask.id)).set(newTask);
    taskForm.reset();
    formCard.classList.remove('visible');
    openFormBtn.style.display = 'flex';
  } catch (error) {
    console.error("Error al guardar en la nube:", error);
  }
});

/* ===================================================
   TEMA JS 5: ACCIONES Y RENDERIZADO (CON SINCRONIZACIÓN)
   =================================================== */
window.toggleTask = async function(id) {
  const currentTask = tasks.find(t => t.id === id);
  if (currentTask) {
    await db.collection('tasks').doc(String(id)).update({
      completed: !currentTask.completed
    });
  }
};

window.deleteTask = async function(id) {
  if (confirm('¿Eliminar esta tarea?')) {
    await db.collection('tasks').doc(String(id)).delete();
  }
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