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

/* ===================================================
   TEMA JS 6: ASIGNATURAS (EDICIÓN Y APUNTES EN FIREBASE)
   =================================================== */
// 1. Datos iniciales de asignaturas
const INITIAL_SUBJECTS = [
  { id: 'frances', name: 'FRANCÉS 6ºB', course: '2026/2027', prof: 'María Sánchez González', color: 'linear-gradient(135deg, #1e3c72, #2a5298)' },
  { id: 'valores', name: 'VALORES 6º', course: '2026/2027', prof: 'Mari Carmen Martín García', color: 'linear-gradient(135deg, #0d7065, #11998e)' },
  { id: 'ingles', name: 'ENGLISH GRADE 6B', course: '26-27', prof: 'Jesús Vallejo López', color: 'linear-gradient(135deg, #1f4068, #162447)' },
  { id: 'ciencias', name: 'SCIENCE GRADE 6B', course: '26-27', prof: 'Jesús Vallejo López', color: 'linear-gradient(135deg, #592576, #3f1a56)' },
  { id: 'matematicas', name: 'MATEMÁTICAS 6ºB', course: '2026/2027', prof: 'Tutor/a', color: 'linear-gradient(135deg, #e65c00, #f9d423)' },
  { id: 'lengua', name: 'LENGUA 6ºB', course: '2026/2027', prof: 'Tutor/a', color: 'linear-gradient(135deg, #c0392b, #8e44ad)' },
  { id: 'plastica', name: 'PLÁSTICA 6ºB', course: '2026/2027', prof: 'Profesor/a', color: 'linear-gradient(135deg, #f39c12, #d35400)' },
  { id: 'att', name: 'ATT 6ºB', course: '2026/2027', prof: 'Profesor/a', color: 'linear-gradient(135deg, #2c3e50, #3498db)' }
];

let currentSubjects = [...INITIAL_SUBJECTS];
let activeSubject = null;
let editingSubjectId = null;
let currentSelectedPhotoBase64 = null;
let unsubscribeNotes = null;

const classroomGrid = document.getElementById('classroom-grid');
const subjectsListScreen = document.getElementById('subjects-list-screen');
const subjectDetailScreen = document.getElementById('subject-detail-screen');
const btnBackSubjects = document.getElementById('btn-back-subjects');
const detailBanner = document.getElementById('detail-banner');
const detailTitle = document.getElementById('detail-title');
const detailCourseProf = document.getElementById('detail-course-prof');
const noteTextInput = document.getElementById('note-text');
const notePhotoInput = document.getElementById('note-photo-input');
const photoPreviewName = document.getElementById('photo-preview-name');
const btnSaveNote = document.getElementById('btn-save-note');
const subjectNotesList = document.getElementById('subject-notes-list');

// Elementos del Modal de Edición
const modalEditSubject = document.getElementById('modal-edit-subject');
const formEditSubject = document.getElementById('form-edit-subject');
const editSubName = document.getElementById('edit-sub-name');
const editSubCourse = document.getElementById('edit-sub-course');
const editSubProf = document.getElementById('edit-sub-prof');
const btnCancelEditSub = document.getElementById('btn-cancel-edit-sub');

// 2. Escuchar cambios de asignaturas en Firebase (para que se sincronicen las ediciones)
db.collection('subjects_info').onSnapshot((snapshot) => {
  const customData = {};
  snapshot.forEach(doc => {
    customData[doc.id] = doc.data();
  });

  currentSubjects = INITIAL_SUBJECTS.map(sub => {
    return customData[sub.id] ? { ...sub, ...customData[sub.id] } : sub;
  });

  renderClassroomCards();
});

// 3. Renderizar las tarjetas
function renderClassroomCards() {
  classroomGrid.innerHTML = currentSubjects.map(sub => `
    <article class="classroom-card" style="background: ${sub.color}" onclick="openSubjectDetail('${sub.id}')">
      <div class="classroom-card-top">
        <div>
          <div class="classroom-card-title">${sub.name}</div>
          <div class="classroom-card-course">${sub.course}</div>
        </div>
        <button class="btn-sub-menu" onclick="openEditModal(event, '${sub.id}')" title="Editar">⋮</button>
      </div>
      <div class="classroom-card-prof">${sub.prof}</div>
    </article>
  `).join('');
}

// 4. Modal para editar asignatura
window.openEditModal = function(e, subId) {
  e.stopPropagation(); // Evita abrir los apuntes de la materia
  editingSubjectId = subId;
  const sub = currentSubjects.find(s => s.id === subId);
  if (!sub) return;

  editSubName.value = sub.name;
  editSubCourse.value = sub.course;
  editSubProf.value = sub.prof;

  modalEditSubject.style.display = 'flex';
};

btnCancelEditSub.addEventListener('click', () => {
  modalEditSubject.style.display = 'none';
  editingSubjectId = null;
});

formEditSubject.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!editingSubjectId) return;

  const updatedData = {
    name: editSubName.value.trim(),
    course: editSubCourse.value.trim(),
    prof: editSubProf.value.trim()
  };

  try {
    await db.collection('subjects_info').doc(editingSubjectId).set(updatedData, { merge: true });
    modalEditSubject.style.display = 'none';
    editingSubjectId = null;
  } catch (err) {
    console.error("Error al actualizar la asignatura:", err);
  }
});

// 5. Abrir la asignatura y ver notas
window.openSubjectDetail = function(subjectId) {
  activeSubject = currentSubjects.find(s => s.id === subjectId);
  if (!activeSubject) return;

  detailTitle.textContent = activeSubject.name;
  detailCourseProf.textContent = `${activeSubject.course} • ${activeSubject.prof}`;
  detailBanner.style.background = activeSubject.color;

  subjectsListScreen.style.display = 'none';
  subjectDetailScreen.style.display = 'block';

  if (unsubscribeNotes) unsubscribeNotes();
  unsubscribeNotes = db.collection('subjects_notes')
    .where('subjectId', '==', activeSubject.id)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      const notes = [];
      snapshot.forEach(doc => notes.push({ id: doc.id, ...doc.data() }));
      renderSubjectNotes(notes);
    });
};

btnBackSubjects.addEventListener('click', () => {
  subjectDetailScreen.style.display = 'none';
  subjectsListScreen.style.display = 'block';
  if (unsubscribeNotes) unsubscribeNotes();
  activeSubject = null;
});

// 6. Optimización y compresión de fotos
notePhotoInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 900;
      let w = img.width, h = img.height;
      if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
      else if (h > maxDim) { h = Math.round((h * maxDim) / h); h = maxDim; }

      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      currentSelectedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.65);
      photoPreviewName.style.display = 'inline';
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// 7. Guardar apunte
btnSaveNote.addEventListener('click', async () => {
  const text = noteTextInput.value.trim();
  if (!text && !currentSelectedPhotoBase64) {
    alert('Escribe algo o adjunta una foto antes de publicar.');
    return;
  }

  btnSaveNote.disabled = true;
  btnSaveNote.textContent = 'Guardando...';

  try {
    await db.collection('subjects_notes').add({
      subjectId: activeSubject.id,
      text: text,
      photo: currentSelectedPhotoBase64 || null,
      dateString: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    });

    noteTextInput.value = '';
    currentSelectedPhotoBase64 = null;
    notePhotoInput.value = '';
    photoPreviewName.style.display = 'none';
  } catch (err) {
    console.error('Error al guardar nota:', err);
  } finally {
    btnSaveNote.disabled = false;
    btnSaveNote.textContent = 'Publicar en la asignatura';
  }
});

// 8. Borrar apunte
window.deleteNote = async function(noteId) {
  if (confirm('¿Eliminar este apunte?')) {
    await db.collection('subjects_notes').doc(noteId).delete();
  }
};

// 9. Pintar apuntes
function renderSubjectNotes(notes) {
  if (notes.length === 0) {
    subjectNotesList.innerHTML = `
      <div class="placeholder-box" style="padding: 25px 10px;">
        <p>📝 Todavía no hay apuntes ni fotos en esta materia.</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">Usa el recuadro superior para subir deberes o fotos de la pizarra.</p>
      </div>
    `;
    return;
  }

  subjectNotesList.innerHTML = notes.map(note => `
    <article class="note-entry-card">
      <div class="note-entry-header">
        <span>📅 ${note.dateString}</span>
        <button onclick="deleteNote('${note.id}')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-weight:bold;">✕</button>
      </div>
      ${note.text ? `<div class="note-entry-text">${note.text}</div>` : ''}
      ${note.photo ? `<img src="${note.photo}" class="note-entry-img" alt="Foto adjunta" loading="lazy">` : ''}
    </article>
  `).join('');
}