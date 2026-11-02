/* ===================================================
   TEMA JS 1: CABECERA, MENÚ 3 PUNTOS Y FONDO
   =================================================== */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
}

const dateElement = document.getElementById('current-date');
const today = new Date();
dateElement.textContent = today.toLocaleDateString('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
});

const menuDotsBtn = document.getElementById('menu-dots-btn');
const menuDropdown = document.getElementById('menu-dropdown');

if (menuDotsBtn && menuDropdown) {
  menuDotsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    menuDropdown.classList.remove('show');
  });
}

const heroHeader = document.getElementById('hero-header');
const coverInput = document.getElementById('cover-input');

const savedCover = localStorage.getItem('amaia_cover_image');
if (savedCover && heroHeader) {
  heroHeader.style.backgroundImage = `url('${savedCover}')`;
}

if (coverInput && heroHeader) {
  coverInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const base64Image = event.target.result;
        heroHeader.style.backgroundImage = `url('${base64Image}')`;
        localStorage.setItem('amaia_cover_image', base64Image);
        if (menuDropdown) menuDropdown.classList.remove('show');
      };
      reader.readAsDataURL(file);
    }
  });
}

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
    const targetView = document.getElementById(targetId);
    if (targetView) targetView.classList.add('active');

    // Si entra en Asignaturas, volver siempre a la lista principal
    if (targetId === 'view-asignaturas') {
      const listScreen = document.getElementById('subjects-list-screen');
      const detailScreen = document.getElementById('subject-detail-screen');
      if (listScreen) listScreen.style.display = 'block';
      if (detailScreen) detailScreen.style.display = 'none';
    }
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
db.enablePersistence().catch(() => {});

let tasks = [];

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

if (openFormBtn && formCard) {
  openFormBtn.addEventListener('click', () => {
    formCard.classList.add('visible');
    openFormBtn.style.display = 'none';
  });
}

if (closeFormBtn && formCard && openFormBtn && taskForm) {
  closeFormBtn.addEventListener('click', () => {
    formCard.classList.remove('visible');
    openFormBtn.style.display = 'flex';
    taskForm.reset();
  });
}

if (taskForm) {
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
      console.error("Error al guardar tarea:", error);
    }
  });
}

/* ===================================================
   TEMA JS 5: ACCIONES Y RENDERIZADO DE TAREAS
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
  if (!taskList) return;
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
   TEMA JS 6: ASIGNATURAS, APUNTES AISLADOS Y ORDEN
   =================================================== */
const DEFAULT_SUBJECTS = [
  { id: 'frances', name: 'FRANCÉS 6ºB', course: '2026/2027', prof: 'María Sánchez González', color: 'linear-gradient(135deg, #1e3c72, #2a5298)' },
  { id: 'valores', name: 'VALORES 6ºB', course: '2026/2027', prof: 'Mari Carmen Martín García', color: 'linear-gradient(135deg, #0d7065, #11998e)' },
  { id: 'ingles', name: 'ENGLISH GRADE 6B', course: '26-27', prof: 'Jesús Vallejo López', color: 'linear-gradient(135deg, #1f4068, #162447)' },
  { id: 'ciencias', name: 'SCIENCE GRADE 6B', course: '26-27', prof: 'Jesús Vallejo López', color: 'linear-gradient(135deg, #592576, #3f1a56)' },
  { id: 'matematicas', name: 'MATEMÁTICAS 6ºB', course: '2026/2027', prof: 'Tutor/a', color: 'linear-gradient(135deg, #e65c00, #f9d423)' },
  { id: 'lengua', name: 'LENGUA 6ºB', course: '2026/2027', prof: 'Tutor/a', color: 'linear-gradient(135deg, #c0392b, #8e44ad)' },
  { id: 'plastica', name: 'PLÁSTICA 6ºB', course: '2026/2027', prof: 'Profesor/a', color: 'linear-gradient(135deg, #f39c12, #d35400)' },
  { id: 'att', name: 'ATT 6ºB', course: '2026/2027', prof: 'Profesor/a', color: 'linear-gradient(135deg, #2c3e50, #3498db)' }
];

const PRESET_COLORS = [
  'linear-gradient(135deg, #1e3c72, #2a5298)',
  'linear-gradient(135deg, #0d7065, #11998e)',
  'linear-gradient(135deg, #1f4068, #162447)',
  'linear-gradient(135deg, #592576, #3f1a56)',
  'linear-gradient(135deg, #e65c00, #f9d423)',
  'linear-gradient(135deg, #c0392b, #8e44ad)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #2c3e50, #3498db)'
];

let subjectsList = [...DEFAULT_SUBJECTS];
let activeSubject = null;
let editingSubjectId = null;
let editingIndex = -1;
let selectedColorValue = '';
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

const modalPhotoViewer = document.getElementById('modal-photo-viewer');
const modalExpandedImg = document.getElementById('modal-expanded-img');
const btnClosePhoto = document.getElementById('btn-close-photo');

const modalEditSubject = document.getElementById('modal-edit-subject');
const formEditSubject = document.getElementById('form-edit-subject');
const editSubName = document.getElementById('edit-sub-name');
const editSubCourse = document.getElementById('edit-sub-course');
const editSubProf = document.getElementById('edit-sub-prof');
const btnCancelEditSub = document.getElementById('btn-cancel-edit-sub');
const colorPalette = document.getElementById('color-palette');
const editSubColorPicker = document.getElementById('edit-sub-color-picker');
const btnMoveUp = document.getElementById('btn-move-up');
const btnMoveDown = document.getElementById('btn-move-down');

function renderClassroomCards() {
  if (!classroomGrid) return;
  classroomGrid.innerHTML = subjectsList.map((sub, index) => `
    <article class="classroom-card" style="background: ${sub.color}" onclick="openSubjectDetail('${sub.id}')">
      <div class="classroom-card-top">
        <div>
          <div class="classroom-card-title">${sub.name}</div>
          <div class="classroom-card-course">${sub.course}</div>
        </div>
        <button class="btn-sub-menu" onclick="openEditModal(event, '${sub.id}', ${index})" title="Personalizar">⋮</button>
      </div>
      <div class="classroom-card-prof">${sub.prof}</div>
    </article>
  `).join('');
}

// Pintar de inmediato sin esperar red
renderClassroomCards();

db.collection('config').doc('subjects_list').onSnapshot((doc) => {
  if (doc.exists && doc.data().items && doc.data().items.length > 0) {
    subjectsList = doc.data().items;
  } else {
    db.collection('config').doc('subjects_list').set({ items: DEFAULT_SUBJECTS });
  }
  renderClassroomCards();
});

window.openSubjectDetail = function(subjectId) {
  activeSubject = subjectsList.find(s => s.id === subjectId);
  if (!activeSubject) return;

  if (subjectNotesList) {
    subjectNotesList.innerHTML = '<div class="placeholder-box"><p>Cargando apuntes...</p></div>';
  }

  if (detailTitle) detailTitle.textContent = activeSubject.name;
  if (detailCourseProf) detailCourseProf.textContent = `${activeSubject.course} • ${activeSubject.prof}`;
  if (detailBanner) detailBanner.style.background = activeSubject.color;

  if (subjectsListScreen) subjectsListScreen.style.display = 'none';
  if (subjectDetailScreen) subjectDetailScreen.style.display = 'block';

  if (unsubscribeNotes) unsubscribeNotes();

  unsubscribeNotes = db.collection('notes_' + activeSubject.id)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snapshot) => {
      const notes = [];
      snapshot.forEach(doc => {
        notes.push({ id: doc.id, ...doc.data() });
      });
      renderSubjectNotes(notes);
    }, (err) => {
      console.error("Error al escuchar notas:", err);
    });
};

if (btnBackSubjects) {
  btnBackSubjects.addEventListener('click', () => {
    if (subjectDetailScreen) subjectDetailScreen.style.display = 'none';
    if (subjectsListScreen) subjectsListScreen.style.display = 'block';
    if (unsubscribeNotes) unsubscribeNotes();
    activeSubject = null;
  });
}

if (notePhotoInput) {
  notePhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 850;
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }

        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        currentSelectedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.60);
        if (photoPreviewName) photoPreviewName.style.display = 'inline';
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

if (btnSaveNote) {
  btnSaveNote.addEventListener('click', async () => {
    const text = noteTextInput ? noteTextInput.value.trim() : '';
    if (!text && !currentSelectedPhotoBase64) {
      alert('Escribe algo o saca una foto antes de publicar.');
      return;
    }

    btnSaveNote.disabled = true;
    btnSaveNote.textContent = 'Guardando...';

    try {
      await db.collection('notes_' + activeSubject.id).add({
        text: text,
        photo: currentSelectedPhotoBase64 || null,
        dateString: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      });

      if (noteTextInput) noteTextInput.value = '';
      currentSelectedPhotoBase64 = null;
      if (notePhotoInput) notePhotoInput.value = '';
      if (photoPreviewName) photoPreviewName.style.display = 'none';
    } catch (err) {
      console.error('Error al guardar nota:', err);
      alert('No se pudo guardar la nota.');
    } finally {
      btnSaveNote.disabled = false;
      btnSaveNote.textContent = 'Publicar en la asignatura';
    }
  });
}

window.deleteNote = async function(e, noteId) {
  if (e) e.stopPropagation();
  if (confirm('¿Eliminar este apunte de forma definitiva?')) {
    await db.collection('notes_' + activeSubject.id).doc(noteId).delete();
  }
};

window.expandPhoto = function(photoSrc) {
  if (modalExpandedImg && modalPhotoViewer) {
    modalExpandedImg.src = photoSrc;
    modalPhotoViewer.style.display = 'flex';
  }
};

if (btnClosePhoto && modalPhotoViewer && modalExpandedImg) {
  btnClosePhoto.addEventListener('click', () => {
    modalPhotoViewer.style.display = 'none';
    modalExpandedImg.src = '';
  });

  modalPhotoViewer.addEventListener('click', (e) => {
    if (e.target !== modalExpandedImg) {
      modalPhotoViewer.style.display = 'none';
      modalExpandedImg.src = '';
    }
  });
}

function renderSubjectNotes(notes) {
  if (!subjectNotesList) return;
  if (notes.length === 0) {
    subjectNotesList.innerHTML = `
      <div class="placeholder-box" style="padding: 25px 10px;">
        <p>📝 No hay apuntes en esta materia todavía.</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">Usa el recuadro superior para apuntar o fotografiar la pizarra.</p>
      </div>
    `;
    return;
  }

  subjectNotesList.innerHTML = notes.map(note => `
    <article class="note-entry-card">
      <div class="note-entry-header">
        <span>📅 ${note.dateString}</span>
        <button class="btn-delete-note" onclick="deleteNote(event, '${note.id}')">Eliminar</button>
      </div>
      ${note.text ? `<div class="note-entry-text">${note.text}</div>` : ''}
      ${note.photo ? `
        <div class="note-entry-img-container">
          <img src="${note.photo}" class="note-entry-img" alt="Apunte" onclick="expandPhoto('${note.photo}')">
        </div>
      ` : ''}
    </article>
  `).join('');
}

window.openEditModal = function(e, subId, index) {
  e.stopPropagation();
  editingSubjectId = subId;
  editingIndex = index;
  const sub = subjectsList[index];
  if (!sub) return;

  if (editSubName) editSubName.value = sub.name;
  if (editSubCourse) editSubCourse.value = sub.course;
  if (editSubProf) editSubProf.value = sub.prof;
  selectedColorValue = sub.color;

  if (colorPalette) {
    colorPalette.innerHTML = PRESET_COLORS.map(c => `
      <div class="color-circle ${c === sub.color ? 'selected' : ''}" style="background: ${c}" onclick="selectPresetColor('${c}', this)"></div>
    `).join('');
  }

  if (modalEditSubject) modalEditSubject.style.display = 'flex';
};

window.selectPresetColor = function(color, el) {
  selectedColorValue = color;
  document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
};

if (editSubColorPicker) {
  editSubColorPicker.addEventListener('input', (e) => {
    selectedColorValue = e.target.value;
    document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
  });
}

if (btnMoveUp) {
  btnMoveUp.addEventListener('click', async () => {
    if (editingIndex > 0) {
      const temp = subjectsList[editingIndex];
      subjectsList[editingIndex] = subjectsList[editingIndex - 1];
      subjectsList[editingIndex - 1] = temp;
      editingIndex--;
      renderClassroomCards();
      await db.collection('config').doc('subjects_list').set({ items: subjectsList });
    }
  });
}

if (btnMoveDown) {
  btnMoveDown.addEventListener('click', async () => {
    if (editingIndex < subjectsList.length - 1) {
      const temp = subjectsList[editingIndex];
      subjectsList[editingIndex] = subjectsList[editingIndex + 1];
      subjectsList[editingIndex + 1] = temp;
      editingIndex++;
      renderClassroomCards();
      await db.collection('config').doc('subjects_list').set({ items: subjectsList });
    }
  });
}

if (btnCancelEditSub && modalEditSubject) {
  btnCancelEditSub.addEventListener('click', () => {
    modalEditSubject.style.display = 'none';
    editingSubjectId = null;
  });
}

if (formEditSubject) {
  formEditSubject.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (editingIndex === -1) return;

    subjectsList[editingIndex] = {
      ...subjectsList[editingIndex],
      name: editSubName.value.trim(),
      course: editSubCourse.value.trim(),
      prof: editSubProf.value.trim(),
      color: selectedColorValue
    };

    try {
      renderClassroomCards();
      await db.collection('config').doc('subjects_list').set({ items: subjectsList });
      if (modalEditSubject) modalEditSubject.style.display = 'none';
      editingSubjectId = null;
    } catch (err) {
      console.error("Error al actualizar asignatura:", err);
    }
  });
}