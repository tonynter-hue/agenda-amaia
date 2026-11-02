/* ===================================================
   TEMA JS 1: PWA, FECHA Y FONDO PERSONALIZABLE
   =================================================== */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// 1.1 Mostrar fecha de hoy en cabecera
const dateElement = document.getElementById('current-date');
if (dateElement) {
  dateElement.textContent = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

// 1.2 Menú 3 puntos de la cabecera
const menuDotsBtn = document.getElementById('menu-dots-btn');
const menuDropdown = document.getElementById('menu-dropdown');
if (menuDotsBtn && menuDropdown) {
  menuDotsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('show');
  });
  document.addEventListener('click', () => menuDropdown.classList.remove('show'));
}

// 1.3 Cambio de imagen de portada
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
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width, h = img.height;
          if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          heroHeader.style.backgroundImage = `url('${compressed}')`;
          try {
            localStorage.setItem('amaia_cover_image', compressed);
          } catch (err) {}
          if (menuDropdown) menuDropdown.classList.remove('show');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

/* ===================================================
   TEMA JS 2: CAMBIO DE PESTAÑAS (PÍLDORAS)
   =================================================== */
window.switchTab = function(targetId, btnElement) {
  document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  } else {
    const matchingBtn = document.querySelector(`[data-target="${targetId}"]`);
    if (matchingBtn) matchingBtn.classList.add('active');
  }

  document.querySelectorAll('.view-panel').forEach(p => {
    p.classList.remove('active');
    p.style.display = 'none';
  });

  const activePanel = document.getElementById(targetId);
  if (activePanel) {
    activePanel.classList.add('active');
    activePanel.style.display = 'block';
  }

  // Reiniciar a la lista principal al pulsar Asignaturas
  if (targetId === 'view-asignaturas') {
    const listScreen = document.getElementById('subjects-list-screen');
    const detailScreen = document.getElementById('subject-detail-screen');
    if (listScreen) listScreen.style.display = 'block';
    if (detailScreen) detailScreen.style.display = 'none';
    renderClassroomCards();
  }

  // Reiniciar a la lista principal al pulsar YouTube
  if (targetId === 'view-youtube') {
    const ytList = document.getElementById('yt-subjects-screen');
    const ytVideos = document.getElementById('yt-videos-screen');
    if (ytList) ytList.style.display = 'block';
    if (ytVideos) ytVideos.style.display = 'none';
    renderYtClassroomCards();
  }

  // Dibujar el calendario escolar al pulsar Calendario
  if (targetId === 'view-calendario') {
    renderCalendar();
  }
};

/* ===================================================
   TEMA JS 3: CONEXIÓN FIREBASE
   =================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyAjklSkVXN1bM-mJUArpi6-YP-wmY7DZn8",
  authDomain: "agenda-amaia.firebaseapp.com",
  projectId: "agenda-amaia",
  storageBucket: "agenda-amaia.firebasestorage.app",
  messagingSenderId: "791939976390",
  appId: "1:791939976390:web:cb6dc70856388b4040dbc7"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
db.enablePersistence().catch(() => {});

/* ===================================================
   TEMA JS 4: GESTIÓN DE TAREAS (AGENDA Y EDICIÓN)
   =================================================== */
let tasks = [];
let editingTaskId = null;

const formCard = document.getElementById('task-form-card');
const openFormBtn = document.getElementById('open-form-btn');
const closeFormBtn = document.getElementById('close-form-btn');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

// Modal para editar tarea
const modalEditTask = document.getElementById('modal-edit-task');
const formEditTask = document.getElementById('form-edit-task');
const editTaskSubject = document.getElementById('edit-task-subject');
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskDue = document.getElementById('edit-task-due');
const btnCancelEditTask = document.getElementById('btn-cancel-edit-task');

if (openFormBtn) openFormBtn.addEventListener('click', () => { formCard.classList.add('visible'); openFormBtn.style.display = 'none'; });
if (closeFormBtn) closeFormBtn.addEventListener('click', () => { formCard.classList.remove('visible'); openFormBtn.style.display = 'flex'; taskForm.reset(); });

// Función para mostrar la fecha en formato DD/MM/AAAA
function formatDateDDMMAAAA(dateStr) {
  if (!dateStr) return 'Sin fecha';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

db.collection('tasks').orderBy('id', 'desc').onSnapshot((snapshot) => {
  tasks = [];
  snapshot.forEach(doc => tasks.push(doc.data()));
  renderTasks();
  // Actualizar también los bloques de color del calendario si está cargado
  if (typeof renderCalendar === 'function') renderCalendar();
});

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
    await db.collection('tasks').doc(String(newTask.id)).set(newTask);
    taskForm.reset();
    formCard.classList.remove('visible');
    openFormBtn.style.display = 'flex';
  });
}

window.toggleTask = async function(id) {
  const current = tasks.find(t => t.id === id);
  if (current) await db.collection('tasks').doc(String(id)).update({ completed: !current.completed });
};

window.deleteTask = async function(id) {
  if (confirm('¿Eliminar esta tarea?')) await db.collection('tasks').doc(String(id)).delete();
};

// Abrir modal de edición con los datos cargados
window.openEditTask = function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  if (editTaskSubject) editTaskSubject.value = task.subject || '';
  if (editTaskTitle) editTaskTitle.value = task.title || '';
  if (editTaskDue) editTaskDue.value = task.dueDate || '';
  if (modalEditTask) modalEditTask.style.display = 'flex';
};

if (btnCancelEditTask && modalEditTask) {
  btnCancelEditTask.addEventListener('click', () => {
    modalEditTask.style.display = 'none';
    editingTaskId = null;
  });
}

if (formEditTask) {
  formEditTask.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingTaskId) return;

    try {
      await db.collection('tasks').doc(String(editingTaskId)).update({
        subject: editTaskSubject.value,
        title: editTaskTitle.value.trim(),
        dueDate: editTaskDue.value
      });
      if (modalEditTask) modalEditTask.style.display = 'none';
      editingTaskId = null;
    } catch (err) {
      console.error("Error al actualizar tarea:", err);
    }
  });
}

function renderTasks() {
  if (!taskList) return;
  if (tasks.length === 0) {
    taskList.innerHTML = `<div class="placeholder-box"><p>🎉 ¡No tienes tareas pendientes!</p></div>`;
    return;
  }
  taskList.innerHTML = tasks.map(t => `
    <article class="task-item ${t.completed ? 'completed' : ''}">
      <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})">
      <div class="task-info">
        <span class="task-subject">${t.subject}</span>
        <div class="task-text">${t.title}</div>
        <div class="task-date">📅 ${formatDateDDMMAAAA(t.dueDate)}</div>
      </div>
      <div class="task-item-actions">
        <button class="btn-edit-task" onclick="openEditTask(${t.id})" title="Editar tarea">✏️</button>
        <button class="btn-delete" onclick="deleteTask(${t.id})" title="Borrar">✕</button>
      </div>
    </article>
  `).join('');
}

/* ===================================================
   TEMA JS 5: ASIGNATURAS Y ARRASTRAR (DRAG & DROP TÁCTIL)
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

// Carga inmediata de memoria local si existe
let subjectsList = [...DEFAULT_SUBJECTS];
const localOrder = localStorage.getItem('amaia_subjects_order');
if (localOrder) {
  try { subjectsList = JSON.parse(localOrder); } catch (e) {}
}

let activeSubject = null;
let editingIndex = -1;
let selectedColorValue = '';
let sortableInstance = null;
const classroomGrid = document.getElementById('classroom-grid');

// Inicializar arrastre táctil infalible
function initSortableDrag() {
  if (!classroomGrid || typeof Sortable === 'undefined') return;
  if (sortableInstance) sortableInstance.destroy();

  sortableInstance = new Sortable(classroomGrid, {
    animation: 250,
    delay: 200,              // Mantener 200ms para diferenciar de un toque simple
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    filter: '.btn-sub-menu',
    preventOnFilter: true,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: function() {
      // 1. Leer el orden REAL de las tarjetas en la pantalla tras soltar el dedo
      const cardsInDOM = Array.from(classroomGrid.querySelectorAll('.classroom-card'));
      const newOrderIds = cardsInDOM.map(card => card.getAttribute('data-id'));

      // 2. Reordenar nuestro listado con esa misma secuencia
      subjectsList = newOrderIds.map(id => subjectsList.find(s => s.id === id)).filter(Boolean);

      // 3. Guardar en memoria local inmediata (nunca rebota)
      localStorage.setItem('amaia_subjects_order', JSON.stringify(subjectsList));

      // 4. Sincronizar en la nube
      db.collection('config').doc('subjects_list').set({ items: subjectsList }).catch(err => console.error(err));
    }
  });
}

function renderClassroomCards() {
  if (!classroomGrid) return;
  classroomGrid.innerHTML = subjectsList.map((s, i) => `
    <article class="classroom-card" data-id="${s.id}" style="background: ${s.color}" onclick="openSubjectDetail('${s.id}')">
      <div class="classroom-card-top">
        <div>
          <div class="classroom-card-title">${s.name}</div>
          <div class="classroom-card-course">${s.course}</div>
        </div>
        <button class="btn-sub-menu" onclick="openEditModal(event, ${i})">⋮</button>
      </div>
      <div class="classroom-card-prof">${s.prof}</div>
    </article>
  `).join('');
  initSortableDrag();
}

renderClassroomCards();

// Sincronización en tiempo real desde Firebase
db.collection('config').doc('subjects_list').onSnapshot((doc) => {
  if (doc.exists && doc.data().items && doc.data().items.length > 0) {
    subjectsList = doc.data().items;
    localStorage.setItem('amaia_subjects_order', JSON.stringify(subjectsList));
    renderClassroomCards();
  }
});

// Modal de edición de materia
const modalEdit = document.getElementById('modal-edit-subject');
const formEdit = document.getElementById('form-edit-subject');
const palette = document.getElementById('color-palette');

window.openEditModal = function(e, index) {
  e.stopPropagation();
  editingIndex = index;
  const s = subjectsList[index];
  document.getElementById('edit-sub-name').value = s.name;
  document.getElementById('edit-sub-course').value = s.course;
  document.getElementById('edit-sub-prof').value = s.prof;
  selectedColorValue = s.color;

  if (palette) {
    palette.innerHTML = PRESET_COLORS.map(c => `
      <div class="color-circle ${c === s.color ? 'selected' : ''}" style="background: ${c}" onclick="selectColor('${c}', this)"></div>
    `).join('');
  }
  if (modalEdit) modalEdit.style.display = 'flex';
};

window.selectColor = function(color, el) {
  selectedColorValue = color;
  document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
};

const picker = document.getElementById('edit-sub-color-picker');
if (picker) {
  picker.addEventListener('input', (e) => {
    selectedColorValue = e.target.value;
    document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
  });
}

const btnCancelEdit = document.getElementById('btn-cancel-edit-sub');
if (btnCancelEdit && modalEdit) btnCancelEdit.addEventListener('click', () => modalEdit.style.display = 'none');

if (formEdit) {
  formEdit.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (editingIndex === -1) return;
    subjectsList[editingIndex] = {
      ...subjectsList[editingIndex],
      name: document.getElementById('edit-sub-name').value.trim(),
      course: document.getElementById('edit-sub-course').value.trim(),
      prof: document.getElementById('edit-sub-prof').value.trim(),
      color: selectedColorValue
    };
    localStorage.setItem('amaia_subjects_order', JSON.stringify(subjectsList));
    renderClassroomCards();
    await db.collection('config').doc('subjects_list').set({ items: subjectsList });
    if (modalEdit) modalEdit.style.display = 'none';
  });
}

/* ===================================================
   TEMA JS 6: APUNTES, FOTOS Y VISOR MODAL
   =================================================== */
let unsubscribeNotes = null;
let currentPhotoBase64 = null;
const notesContainer = document.getElementById('subject-notes-list');
const photoInput = document.getElementById('note-photo-input');
const photoBadge = document.getElementById('photo-preview-name');
const btnSaveNote = document.getElementById('btn-save-note');
const noteArea = document.getElementById('note-text');

window.openSubjectDetail = function(subjectId) {
  activeSubject = subjectsList.find(s => s.id === subjectId);
  if (!activeSubject) return;

  if (notesContainer) notesContainer.innerHTML = '<div class="placeholder-box"><p>Cargando apuntes...</p></div>';
  document.getElementById('detail-title').textContent = activeSubject.name;
  document.getElementById('detail-course-prof').textContent = `${activeSubject.course} • ${activeSubject.prof}`;
  document.getElementById('detail-banner').style.background = activeSubject.color;

  document.getElementById('subjects-list-screen').style.display = 'none';
  document.getElementById('subject-detail-screen').style.display = 'block';

  if (unsubscribeNotes) unsubscribeNotes();
  unsubscribeNotes = db.collection('notes_' + activeSubject.id).orderBy('timestamp', 'desc').onSnapshot((snap) => {
    const notes = [];
    snap.forEach(doc => notes.push({ id: doc.id, ...doc.data() }));
    renderSubjectNotes(notes);
  });
};

const btnBack = document.getElementById('btn-back-subjects');
if (btnBack) {
  btnBack.addEventListener('click', () => {
    document.getElementById('subject-detail-screen').style.display = 'none';
    document.getElementById('subjects-list-screen').style.display = 'block';
    if (unsubscribeNotes) unsubscribeNotes();
    activeSubject = null;
  });
}

if (photoInput) {
  photoInput.addEventListener('change', (e) => {
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
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.60);
        if (photoBadge) photoBadge.style.display = 'inline';
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

if (btnSaveNote) {
  btnSaveNote.addEventListener('click', async () => {
    const text = noteArea ? noteArea.value.trim() : '';
    if (!text && !currentPhotoBase64) return alert('Escribe algo o saca una foto.');
    btnSaveNote.disabled = true;
    await db.collection('notes_' + activeSubject.id).add({
      text: text,
      photo: currentPhotoBase64 || null,
      dateString: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    });
    if (noteArea) noteArea.value = '';
    currentPhotoBase64 = null;
    if (photoInput) photoInput.value = '';
    if (photoBadge) photoBadge.style.display = 'none';
    btnSaveNote.disabled = false;
  });
}

window.deleteNote = async function(e, id) {
  e.stopPropagation();
  if (confirm('¿Eliminar este apunte?')) await db.collection('notes_' + activeSubject.id).doc(id).delete();
};

window.expandPhoto = function(src) {
  document.getElementById('modal-expanded-img').src = src;
  document.getElementById('modal-photo-viewer').style.display = 'flex';
};

const btnClosePh = document.getElementById('btn-close-photo');
if (btnClosePh) {
  btnClosePh.addEventListener('click', () => {
    document.getElementById('modal-photo-viewer').style.display = 'none';
  });
}

function renderSubjectNotes(notes) {
  if (!notesContainer) return;
  if (notes.length === 0) {
    notesContainer.innerHTML = `<div class="placeholder-box" style="padding:25px 10px;"><p>📝 No hay apuntes todavía en esta materia.</p></div>`;
    return;
  }
  notesContainer.innerHTML = notes.map(n => `
    <article class="note-entry-card">
      <div class="note-entry-header">
        <span>📅 ${n.dateString}</span>
        <button class="btn-delete-note" onclick="deleteNote(event, '${n.id}')">Eliminar</button>
      </div>
      ${n.text ? `<div class="note-entry-text">${n.text}</div>` : ''}
      ${n.photo ? `
        <div class="note-entry-img-container">
          <img src="${n.photo}" class="note-entry-img" alt="Foto" onclick="expandPhoto('${n.photo}')">
        </div>
      ` : ''}
    </article>
  `).join('');
}

/* ===================================================
   TEMA JS 7: VISTA YOUTUBE, MINIATURAS Y REPRODUCTOR
   =================================================== */
const ytGrid = document.getElementById('yt-classroom-grid');
const ytSubjectsScreen = document.getElementById('yt-subjects-screen');
const ytVideosScreen = document.getElementById('yt-videos-screen');
const btnBackYt = document.getElementById('btn-back-yt-subjects');
const ytDetailBanner = document.getElementById('yt-detail-banner');
const ytDetailTitle = document.getElementById('yt-detail-title');
const ytVideosContainer = document.getElementById('yt-videos-container');
const btnSaveYtVideo = document.getElementById('btn-save-yt-video');
const ytVideoUrlInput = document.getElementById('yt-video-url');
const ytVideoTitleInput = document.getElementById('yt-video-title');

const modalYtPlayer = document.getElementById('modal-yt-player');
const ytIframe = document.getElementById('yt-iframe');
const btnCloseYtPlayer = document.getElementById('btn-close-yt-player');

let activeYtSubject = null;
let unsubscribeYtVideos = null;

function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

function renderYtClassroomCards() {
  if (!ytGrid) return;
  ytGrid.innerHTML = subjectsList.map((s) => `
    <article class="classroom-card" style="background: ${s.color}; cursor: pointer;" onclick="openYtSubjectDetail('${s.id}')">
      <div class="classroom-card-top">
        <div>
          <div class="classroom-card-title">${s.name}</div>
          <div class="classroom-card-course">📺 Vídeos de estudio</div>
        </div>
        <span style="font-size: 1.3rem;">▶</span>
      </div>
      <div class="classroom-card-prof">${s.prof}</div>
    </article>
  `).join('');
}

window.openYtSubjectDetail = function(subjectId) {
  activeYtSubject = subjectsList.find(s => s.id === subjectId);
  if (!activeYtSubject) return;

  if (ytDetailTitle) ytDetailTitle.textContent = activeYtSubject.name;
  if (ytDetailBanner) ytDetailBanner.style.background = activeYtSubject.color;

  if (ytSubjectsScreen) ytSubjectsScreen.style.display = 'none';
  if (ytVideosScreen) ytVideosScreen.style.display = 'block';

  if (unsubscribeYtVideos) unsubscribeYtVideos();
  unsubscribeYtVideos = db.collection('yt_' + activeYtSubject.id)
    .orderBy('timestamp', 'desc')
    .onSnapshot((snap) => {
      const vids = [];
      snap.forEach(doc => vids.push({ id: doc.id, ...doc.data() }));
      renderYtVideos(vids);
    });
};

if (btnBackYt) {
  btnBackYt.addEventListener('click', () => {
    if (ytVideosScreen) ytVideosScreen.style.display = 'none';
    if (ytSubjectsScreen) ytSubjectsScreen.style.display = 'block';
    if (unsubscribeYtVideos) unsubscribeYtVideos();
    activeYtSubject = null;
  });
}

if (btnSaveYtVideo) {
  btnSaveYtVideo.addEventListener('click', async () => {
    const rawUrl = ytVideoUrlInput ? ytVideoUrlInput.value.trim() : '';
    const videoId = extractYouTubeId(rawUrl);

    if (!videoId) {
      alert('Por favor, introduce un enlace válido de YouTube.');
      return;
    }

    const title = ytVideoTitleInput && ytVideoTitleInput.value.trim() 
      ? ytVideoTitleInput.value.trim() 
      : 'Vídeo de estudio';

    btnSaveYtVideo.disabled = true;
    btnSaveYtVideo.textContent = 'Guardando...';

    try {
      await db.collection('yt_' + activeYtSubject.id).add({
        videoId: videoId,
        title: title,
        thumbUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        timestamp: Date.now()
      });

      if (ytVideoUrlInput) ytVideoUrlInput.value = '';
      if (ytVideoTitleInput) ytVideoTitleInput.value = '';
    } catch (err) {
      console.error('Error al guardar vídeo:', err);
      alert('No se pudo guardar el vídeo.');
    } finally {
      btnSaveYtVideo.disabled = false;
      btnSaveYtVideo.textContent = '＋ Guardar vídeo en la materia';
    }
  });
}

window.playYtVideo = function(videoId) {
  if (ytIframe && modalYtPlayer) {
    ytIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    modalYtPlayer.style.display = 'flex';
  }
};

function closeYtPlayer() {
  if (modalYtPlayer && ytIframe) {
    modalYtPlayer.style.display = 'none';
    ytIframe.src = '';
  }
}

if (btnCloseYtPlayer) btnCloseYtPlayer.addEventListener('click', closeYtPlayer);

if (modalYtPlayer) {
  modalYtPlayer.addEventListener('click', (e) => {
    if (e.target === modalYtPlayer) closeYtPlayer();
  });
}

window.deleteYtVideo = async function(e, id) {
  e.stopPropagation();
  if (confirm('¿Eliminar este vídeo de la asignatura?')) {
    await db.collection('yt_' + activeYtSubject.id).doc(id).delete();
  }
};

function renderYtVideos(videos) {
  if (!ytVideosContainer) return;
  if (videos.length === 0) {
    ytVideosContainer.innerHTML = `
      <div class="placeholder-box" style="padding: 25px 10px;">
        <p>🎬 No hay vídeos guardados en esta materia todavía.</p>
        <p style="font-size: 0.8rem; margin-top: 4px;">Pega un enlace de YouTube arriba para añadirlo.</p>
      </div>
    `;
    return;
  }

  ytVideosContainer.innerHTML = videos.map(v => `
    <article class="yt-video-card">
      <div class="yt-thumb-wrapper" onclick="playYtVideo('${v.videoId}')">
        <img class="yt-thumb-img" src="${v.thumbUrl}" alt="${v.title}" loading="lazy">
        <div class="yt-play-badge">▶</div>
      </div>
      <div class="yt-video-info">
        <span class="yt-video-card-title">${v.title}</span>
        <button class="btn-delete-note" onclick="deleteYtVideo(event, '${v.id}')">Eliminar</button>
      </div>
    </article>
  `).join('');
}

/* ===================================================
   TEMA JS 8: CALENDARIO ESCOLAR (HORA LOCAL EXACTA)
   =================================================== */
// Función auxiliar para obtener siempre la fecha local real (YYYY-MM-DD) sin desfase UTC
function getLocalDateStr(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

let currentCalDate = new Date();
let selectedDateStr = getLocalDateStr();
let selectedTaskId = null;

const calMonthYear = document.getElementById('cal-month-year');
const calDaysGrid = document.getElementById('cal-days-grid');
const calSelectedDateText = document.getElementById('cal-selected-date-text');
const calDayTasksList = document.getElementById('cal-day-tasks-list');
const calPrevBtn = document.getElementById('cal-prev-month');
const calNextBtn = document.getElementById('cal-next-month');
const calTodayBtn = document.getElementById('cal-today-btn');

function getSubjectColor(subjectName) {
  const norm = (subjectName || '').toLowerCase().trim();
  const found = subjectsList.find(s => s.name.toLowerCase().includes(norm) || norm.includes(s.name.toLowerCase()));
  return found ? found.color : 'linear-gradient(135deg, #7c5dfa, #6a49f2)';
}

function renderCalendar() {
  if (!calDaysGrid || !calMonthYear) return;

  const year = currentCalDate.getFullYear();
  const month = currentCalDate.getMonth();

  calMonthYear.textContent = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(currentCalDate);

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const todayStr = getLocalDateStr();
  let html = '';

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    html += `<div class="cal-day-cell other-month"><span class="cal-day-number">${dayNum}</span></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayPad = String(day).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayPad}`;

    const isToday = dateStr === todayStr ? 'today' : '';
    const isSelected = dateStr === selectedDateStr ? 'selected' : '';

    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    const hasTasks = dayTasks.length > 0 ? 'has-tasks' : '';

    let slicesHtml = '';
    if (dayTasks.length > 0) {
      slicesHtml = `
        <div class="cal-day-slices">
          ${dayTasks.map(t => {
            const initials = (t.subject || '???').trim().substring(0, 3).toUpperCase();
            return `
              <div class="cal-slice" style="background: ${getSubjectColor(t.subject)}" 
                   onclick="selectCalendarTask(event, '${dateStr}', ${t.id})" 
                   title="${t.subject}: ${t.title}">
                <span>${initials}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    html += `
      <div class="cal-day-cell ${isToday} ${isSelected} ${hasTasks}" onclick="selectCalendarDate('${dateStr}')">
        <span class="cal-day-number">${day}</span>
        ${slicesHtml}
      </div>
    `;
  }

  calDaysGrid.innerHTML = html;
  renderSelectedDayTasks();
}

window.selectCalendarDate = function(dateStr) {
  selectedDateStr = dateStr;
  selectedTaskId = null;
  renderCalendar();
};

window.selectCalendarTask = function(e, dateStr, taskId) {
  if (e) e.stopPropagation();
  selectedDateStr = dateStr;
  selectedTaskId = taskId;
  renderCalendar();
};

function renderSelectedDayTasks() {
  if (!calSelectedDateText || !calDayTasksList) return;

  const parts = selectedDateStr.split('-');
  const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  calSelectedDateText.textContent = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const dayTasks = tasks.filter(t => t.dueDate === selectedDateStr);

  if (dayTasks.length === 0) {
    calDayTasksList.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 10px 0;">🎉 No hay tareas ni exámenes para este día.</p>`;
    return;
  }

  calDayTasksList.innerHTML = dayTasks.map(t => {
    const isFocused = (selectedTaskId === t.id) ? 'selected-focus' : '';
    return `
      <div class="cal-task-entry ${t.completed ? 'completed' : ''} ${isFocused}">
        <span class="cal-task-badge" style="background: ${getSubjectColor(t.subject)}">${t.subject}</span>
        <span class="cal-task-desc">${t.title}</span>
        <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})">
      </div>
    `;
  }).join('');
}

if (calPrevBtn) {
  calPrevBtn.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() - 1);
    renderCalendar();
  });
}

if (calNextBtn) {
  calNextBtn.addEventListener('click', () => {
    currentCalDate.setMonth(currentCalDate.getMonth() + 1);
    renderCalendar();
  });
}

if (calTodayBtn) {
  calTodayBtn.addEventListener('click', () => {
    currentCalDate = new Date();
    selectedDateStr = getLocalDateStr();
    selectedTaskId = null;
    renderCalendar();
  });
}