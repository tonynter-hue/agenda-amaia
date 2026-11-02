/* ===================================================
   TEMA JS 1: NAVEGACIÓN Y PESTAÑAS (INFALIBLE)
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

  if (targetId === 'view-asignaturas') {
    const listScreen = document.getElementById('subjects-list-screen');
    const detailScreen = document.getElementById('subject-detail-screen');
    if (listScreen) listScreen.style.display = 'block';
    if (detailScreen) detailScreen.style.display = 'none';
    renderClassroomCards();
  }

  // Reiniciar vista YouTube a las materias y sincronizar tarjetas
  if (targetId === 'view-youtube') {
    const ytList = document.getElementById('yt-subjects-screen');
    const ytVideos = document.getElementById('yt-videos-screen');
    if (ytList) ytList.style.display = 'block';
    if (ytVideos) ytVideos.style.display = 'none';
    renderYtClassroomCards();
  }
};

/* ===================================================
   TEMA JS 2: CAMBIO DE PESTAÑAS (PÍLDORAS)
   =================================================== */
const pillButtons = document.querySelectorAll('.pill-btn');
const viewPanels = document.querySelectorAll('.view-panel');

pillButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    pillButtons.forEach(b => b.classList.remove('active'));
    viewPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const target = document.getElementById(btn.getAttribute('data-target'));
    if (target) target.classList.add('active');

    if (btn.getAttribute('data-target') === 'view-asignaturas') {
      document.getElementById('subjects-list-screen').style.display = 'block';
      document.getElementById('subject-detail-screen').style.display = 'none';
    }
  });
});

/* ===================================================
   TEMA JS 3: BASE DE DATOS FIREBASE
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

/* ===================================================
   TEMA JS 4: GESTIÓN DE TAREAS (AGENDA)
   =================================================== */
let tasks = [];
const formCard = document.getElementById('task-form-card');
const openFormBtn = document.getElementById('open-form-btn');
const closeFormBtn = document.getElementById('close-form-btn');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

if (openFormBtn) openFormBtn.addEventListener('click', () => { formCard.classList.add('visible'); openFormBtn.style.display = 'none'; });
if (closeFormBtn) closeFormBtn.addEventListener('click', () => { formCard.classList.remove('visible'); openFormBtn.style.display = 'flex'; taskForm.reset(); });

db.collection('tasks').orderBy('id', 'desc').onSnapshot((snapshot) => {
  tasks = [];
  snapshot.forEach(doc => tasks.push(doc.data()));
  renderTasks();
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
        <div class="task-date">📅 ${t.dueDate || 'Sin fecha'}</div>
      </div>
      <button class="btn-delete" onclick="deleteTask(${t.id})">✕</button>
    </article>
  `).join('');
}

/* ===================================================
   TEMA JS 5: ASIGNATURAS Y ARRASTRAR (DRAG & DROP)
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
let editingIndex = -1;
let selectedColorValue = '';
const classroomGrid = document.getElementById('classroom-grid');

function initSortableDrag() {
  if (!classroomGrid || typeof Sortable === 'undefined') return;
  new Sortable(classroomGrid, {
    animation: 200,
    delay: 150,
    delayOnTouchOnly: true,
    filter: '.btn-sub-menu',
    preventOnFilter: true,
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    onEnd: async (evt) => {
      const moved = subjectsList.splice(evt.oldIndex, 1)[0];
      subjectsList.splice(evt.newIndex, 0, moved);
      await db.collection('config').doc('subjects_list').set({ items: subjectsList });
    }
  });
}

function renderClassroomCards() {
  if (!classroomGrid) return;
  classroomGrid.innerHTML = subjectsList.map((s, i) => `
    <article class="classroom-card" style="background: ${s.color}" onclick="openSubjectDetail('${s.id}')">
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

db.collection('config').doc('subjects_list').onSnapshot((doc) => {
  if (doc.exists && doc.data().items) subjectsList = doc.data().items;
  else db.collection('config').doc('subjects_list').set({ items: DEFAULT_SUBJECTS });
  renderClassroomCards();
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

  palette.innerHTML = PRESET_COLORS.map(c => `
    <div class="color-circle ${c === s.color ? 'selected' : ''}" style="background: ${c}" onclick="selectColor('${c}', this)"></div>
  `).join('');
  modalEdit.style.display = 'flex';
};

window.selectColor = function(color, el) {
  selectedColorValue = color;
  document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
};

document.getElementById('edit-sub-color-picker').addEventListener('input', (e) => {
  selectedColorValue = e.target.value;
  document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
});

document.getElementById('btn-cancel-edit-sub').addEventListener('click', () => modalEdit.style.display = 'none');

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
  await db.collection('config').doc('subjects_list').set({ items: subjectsList });
  modalEdit.style.display = 'none';
});

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

  notesContainer.innerHTML = '<div class="placeholder-box"><p>Cargando apuntes...</p></div>';
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

document.getElementById('btn-back-subjects').addEventListener('click', () => {
  document.getElementById('subject-detail-screen').style.display = 'none';
  document.getElementById('subjects-list-screen').style.display = 'block';
  if (unsubscribeNotes) unsubscribeNotes();
  activeSubject = null;
});

// Comprimir foto
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
      photoBadge.style.display = 'inline';
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Guardar apunte
btnSaveNote.addEventListener('click', async () => {
  const text = noteArea.value.trim();
  if (!text && !currentPhotoBase64) return alert('Escribe algo o saca una foto.');
  btnSaveNote.disabled = true;
  await db.collection('notes_' + activeSubject.id).add({
    text: text,
    photo: currentPhotoBase64 || null,
    dateString: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now()
  });
  noteArea.value = '';
  currentPhotoBase64 = null;
  photoInput.value = '';
  photoBadge.style.display = 'none';
  btnSaveNote.disabled = false;
});

window.deleteNote = async function(e, id) {
  e.stopPropagation();
  if (confirm('¿Eliminar este apunte?')) await db.collection('notes_' + activeSubject.id).doc(id).delete();
};

window.expandPhoto = function(src) {
  document.getElementById('modal-expanded-img').src = src;
  document.getElementById('modal-photo-viewer').style.display = 'flex';
};

document.getElementById('btn-close-photo').addEventListener('click', () => {
  document.getElementById('modal-photo-viewer').style.display = 'none';
});

function renderSubjectNotes(notes) {
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

// Modal del reproductor
const modalYtPlayer = document.getElementById('modal-yt-player');
const ytIframe = document.getElementById('yt-iframe');
const btnCloseYtPlayer = document.getElementById('btn-close-yt-player');

let activeYtSubject = null;
let unsubscribeYtVideos = null;

// Función para extraer el ID único de cualquier formato de enlace de YouTube (normal, corto o shorts)
function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// 1. Pintar las tarjetas con los mismos colores y orden de Asignaturas
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

// 2. Abrir la asignatura y escuchar sus vídeos en Firebase
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

// 3. Guardar vídeo con miniatura automática
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
      console.error('Error al guardar vídeo de YouTube:', err);
      alert('No se pudo guardar el vídeo.');
    } finally {
      btnSaveYtVideo.disabled = false;
      btnSaveYtVideo.textContent = '＋ Guardar vídeo en la materia';
    }
  });
}

// 4. Reproducir vídeo en el visor integrado (sin abrir la app de YouTube)
window.playYtVideo = function(videoId) {
  if (ytIframe && modalYtPlayer) {
    ytIframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    modalYtPlayer.style.display = 'flex';
  }
};

function closeYtPlayer() {
  if (modalYtPlayer && ytIframe) {
    modalYtPlayer.style.display = 'none';
    ytIframe.src = ''; // Corta la reproducción de inmediato al cerrar
  }
}

if (btnCloseYtPlayer) btnCloseYtPlayer.addEventListener('click', closeYtPlayer);

if (modalYtPlayer) {
  modalYtPlayer.addEventListener('click', (e) => {
    if (e.target === modalYtPlayer) closeYtPlayer();
  });
}

// 5. Borrar vídeo
window.deleteYtVideo = async function(e, id) {
  e.stopPropagation();
  if (confirm('¿Eliminar este vídeo de la asignatura?')) {
    await db.collection('yt_' + activeYtSubject.id).doc(id).delete();
  }
};

// 6. Dibujar la cuadrícula de vídeos con sus miniaturas
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