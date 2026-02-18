let currentRole = localStorage.getItem('homenote_role');
let currentTab = 'notes';
let pendingImage = null;
let currentIsPrivate = false;

const roleNames = {
  father: '👨 爸爸',
  mother: '👩 妈妈',
  son: '👦 儿子',
  daughter: '👧 女儿'
};

document.addEventListener('DOMContentLoaded', () => {
  if (currentRole) {
    showMainApp();
  }
});

function selectRole(role) {
  currentRole = role;
  localStorage.setItem('homenote_role', role);
  showMainApp();
}

function showMainApp() {
  document.getElementById('role-select').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  updateRoleBadge();
  loadNotes();
}

function updateRoleBadge() {
  const badge = document.getElementById('current-role');
  badge.textContent = roleNames[currentRole] || currentRole;
}

function showSettings() {
  document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettings() {
  document.getElementById('settings-modal').style.display = 'none';
}

function switchRole(role) {
  currentRole = role;
  localStorage.setItem('homenote_role', role);
  updateRoleBadge();
  loadNotes();
  closeSettings();
}

function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('notes-tab').style.display = tab === 'notes' ? 'block' : 'none';
  document.getElementById('private-tab').style.display = tab === 'private' ? 'block' : 'none';
  loadNotes();
}

async function loadNotes() {
  try {
    let url = currentTab === 'notes' 
      ? `/api/notes?role=${currentRole}`
      : `/api/notes/private?role=${currentRole}`;
    
    const search = document.getElementById('search-input').value;
    if (search && currentTab === 'notes') {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    const response = await fetch(url);
    const notes = await response.json();
    renderNotes(notes, currentTab === 'notes' ? 'notes-list' : 'private-list');
  } catch (error) {
    console.error('Error loading notes:', error);
  }
}

function renderNotes(notes, containerId) {
  const container = document.getElementById(containerId);
  
  if (notes.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无内容，点击上方按钮创建</div>';
    return;
  }
  
  container.innerHTML = notes.map(note => `
    <div class="note-card">
      <div class="note-header">
        <h3 class="note-title">${escapeHtml(note.title)}</h3>
        <div class="note-meta">
          <span class="note-role ${note.role}">${roleNames[note.role] || note.role}</span>
          <div class="note-actions">
            <button class="btn-edit" onclick="editNote(${note.id})">编辑</button>
            <button class="btn-delete" onclick="deleteNote(${note.id})">删除</button>
          </div>
        </div>
      </div>
      <div class="note-content">${note.content}</div>
      <div class="note-images" id="note-images-${note.id}"></div>
    </div>
  `).join('');
  
  notes.forEach(note => loadNoteImages(note.id));
}

async function loadNoteImages(noteId) {
  try {
    const response = await fetch(`/api/notes/${noteId}/images`);
    const images = await response.json();
    const container = document.getElementById(`note-images-${noteId}`);
    if (container) {
      container.innerHTML = images.map(img => 
        `<img src="/uploads/${img.image_path}" alt="便签图片">`
      ).join('');
    }
  } catch (error) {
    console.error('Error loading images:', error);
  }
}

function showNoteModal(isPrivate = false) {
  currentIsPrivate = isPrivate;
  document.getElementById('note-modal').style.display = 'flex';
  document.getElementById('modal-title').textContent = isPrivate ? '新建日记' : '新建便签';
  document.getElementById('note-form').reset();
  document.getElementById('note-id').value = '';
  document.getElementById('note-content').innerHTML = '';
  document.getElementById('image-preview').innerHTML = '';
  pendingImage = null;
}

async function editNote(noteId) {
  try {
    const response = await fetch(`/api/notes/${noteId}`);
    const note = await response.json();
    
    currentIsPrivate = note.is_private === 1;
    document.getElementById('note-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = '编辑便签';
    document.getElementById('note-id').value = note.id;
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').innerHTML = note.content;
    document.getElementById('image-preview').innerHTML = '';
    pendingImage = null;
    loadNoteImages(noteId);
  } catch (error) {
    console.error('Error loading note:', error);
  }
}

function closeNoteModal() {
  document.getElementById('note-modal').style.display = 'none';
}

function formatText(command, value) {
  const editor = document.getElementById('note-content');
  editor.focus();
  
  if (command === 'bold') {
    document.execCommand('bold', false, null);
  } else if (command === 'underline') {
    document.execCommand('underline', false, null);
  } else if (command === 'h1') {
    document.execCommand('formatBlock', false, 'h1');
  } else if (command === 'h2') {
    document.execCommand('formatBlock', false, 'h2');
  } else if (command === 'h3') {
    document.execCommand('formatBlock', false, 'h3');
  } else if (command === 'fontSize') {
    document.execCommand('fontSize', false, value);
  } else if (command === 'foreColor') {
    document.execCommand('foreColor', false, value);
  }
}

function previewImage() {
  const file = document.getElementById('image-upload').files[0];
  if (file) {
    pendingImage = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('image-preview').innerHTML = `<img src="${e.target.result}" alt="预览">`;
    };
    reader.readAsDataURL(file);
  }
}

async function saveNote(e) {
  e.preventDefault();
  
  const noteId = document.getElementById('note-id').value;
  const title = document.getElementById('note-title').value;
  const content = document.getElementById('note-content').innerHTML;
  
  try {
    let savedNoteId;
    
    if (noteId) {
      await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, is_private: currentIsPrivate })
      });
      savedNoteId = noteId;
    } else {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, role: currentRole, is_private: currentIsPrivate })
      });
      const data = await response.json();
      savedNoteId = data.id;
    }
    
    if (pendingImage) {
      const formData = new FormData();
      formData.append('image', pendingImage);
      await fetch(`/api/notes/${savedNoteId}/images`, {
        method: 'POST',
        body: formData
      });
    }
    
    closeNoteModal();
    loadNotes();
  } catch (error) {
    console.error('Error saving note:', error);
    alert('保存失败，请重试');
  }
}

async function deleteNote(noteId) {
  if (confirm('确定要删除这条便签吗？')) {
    try {
      await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('删除失败，请重试');
    }
  }
}

function searchNotes() {
  loadNotes();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById('note-form').addEventListener('submit', saveNote);

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
};
