
let currentRole = localStorage.getItem('homenote_role');
let currentTab = 'notes';
let pendingImage = null;
let currentIsPrivate = false;
let selectedColor = '';

const roleNames = {
  father: '👨 爸爸',
  mother: '👩 妈妈',
  son: '👦 儿子',
  daughter: '👧 女儿'
};

const roleColors = {
  father: 'blue',
  mother: 'pink',
  son: 'green',
  daughter: 'orange'
};

let pendingRoleSelection = null;

document.addEventListener('DOMContentLoaded', function() {
  initForms();
  if (currentRole) {
    showMainApp();
  }
  initColorPicker();
  document.getElementById('note-form').addEventListener('submit', saveNote);
});

function initForms() {
  const setPasswordForm = document.getElementById('set-password-form');
  if (setPasswordForm) {
    setPasswordForm.addEventListener('submit', handleSetPassword);
  }
  
  const verifyPasswordForm = document.getElementById('verify-password-form');
  if (verifyPasswordForm) {
    verifyPasswordForm.addEventListener('submit', handleVerifyPassword);
  }
  
  const changePasswordForm = document.getElementById('change-password-form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', handleChangePassword);
  }
}

function initColorPicker() {
  const colorPicker = document.getElementById('note-color-picker');
  if (colorPicker) {
    colorPicker.addEventListener('click', function(e) {
      const option = e.target.closest('.color-option');
      if (option) {
        document.querySelectorAll('.color-option').forEach(function(opt) {
          opt.classList.remove('selected');
        });
        option.classList.add('selected');
        selectedColor = option.getAttribute('data-color');
      }
    });
  }
}

async function selectRole(role) {
  try {
    const response = await fetch('/api/roles/' + role + '/has-password');
    const data = await response.json();
    
    if (data.hasPassword) {
      showVerifyPasswordModal(role, 'login');
    } else {
      currentRole = role;
      localStorage.setItem('homenote_role', role);
      showMainApp();
    }
  } catch (error) {
    console.error('Error checking password:', error);
    currentRole = role;
    localStorage.setItem('homenote_role', role);
    showMainApp();
  }
}

function showSetPasswordModal(role) {
  document.getElementById('set-password-modal').style.display = 'flex';
  document.getElementById('set-new-password').value = '';
  document.getElementById('set-confirm-password').value = '';
  hideError('set-password-error');
}

function closeSetPasswordModal() {
  document.getElementById('set-password-modal').style.display = 'none';
  pendingRoleSelection = null;
}

async function handleSetPassword(e) {
  e.preventDefault();
  const newPassword = document.getElementById('set-new-password').value;
  const confirmPassword = document.getElementById('set-confirm-password').value;
  
  if (newPassword !== confirmPassword) {
    showError('set-password-error', '两次输入的密码不一致');
    return;
  }
  
  try {
    const response = await fetch('/api/roles/' + pendingRoleSelection + '/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    });
    
    if (!response.ok) {
      const data = await response.json();
      showError('set-password-error', data.error);
      return;
    }
    
    closeSetPasswordModal();
    
    if (currentRole === pendingRoleSelection) {
      alert('密码设置成功！');
      updatePasswordButtons();
    } else {
      currentRole = pendingRoleSelection;
      localStorage.setItem('homenote_role', currentRole);
      pendingRoleSelection = null;
      showMainApp();
    }
    pendingRoleSelection = null;
  } catch (error) {
    console.error('Error setting password:', error);
    showError('set-password-error', '设置密码失败，请重试');
  }
}

function showVerifyPasswordModal(role, action) {
  document.getElementById('verify-modal-title').textContent = action === 'login' ? '验证密码' : '切换角色';
  document.getElementById('verify-modal-hint').textContent = '请输入' + roleNames[role] + '的密码';
  document.getElementById('verify-target-role').value = role;
  document.getElementById('verify-action').value = action;
  document.getElementById('verify-password').value = '';
  hideError('verify-password-error');
  document.getElementById('verify-password-modal').style.display = 'flex';
}

function closeVerifyPasswordModal() {
  document.getElementById('verify-password-modal').style.display = 'none';
}

async function handleVerifyPassword(e) {
  e.preventDefault();
  const targetRole = document.getElementById('verify-target-role').value;
  const action = document.getElementById('verify-action').value;
  const password = document.getElementById('verify-password').value;
  
  try {
    const response = await fetch('/api/roles/' + targetRole + '/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password })
    });
    
    if (response.status === 429) {
      const data = await response.json();
      showError('verify-password-error', data.error);
      return;
    }
    
    const data = await response.json();
    if (data.valid) {
      closeVerifyPasswordModal();
      closeSettings();
      currentRole = targetRole;
      localStorage.setItem('homenote_role', currentRole);
      updateRoleBadge();
      updatePasswordButtons();
      loadNotes();
    } else {
      showError('verify-password-error', data.error);
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    showError('verify-password-error', '验证失败，请重试');
  }
}

function showSwitchRoleModal() {
  closeSettings();
  document.getElementById('role-select').style.display = 'block';
  document.getElementById('main-app').style.display = 'none';
}

async function quickSwitchRole(role) {
  if (role === currentRole) {
    closeSettings();
    return;
  }
  
  try {
    const response = await fetch('/api/roles/' + role + '/has-password');
    const data = await response.json();
    
    if (data.hasPassword) {
      showVerifyPasswordModal(role, 'switch');
    } else {
      currentRole = role;
      localStorage.setItem('homenote_role', role);
      updateRoleBadge();
      updatePasswordButtons();
      loadNotes();
      closeSettings();
    }
  } catch (error) {
    console.error('Error checking password:', error);
    currentRole = role;
    localStorage.setItem('homenote_role', role);
    updateRoleBadge();
    updatePasswordButtons();
    loadNotes();
    closeSettings();
  }
}

function showChangePasswordModal() {
  closeSettings();
  document.getElementById('change-old-password').value = '';
  document.getElementById('change-new-password').value = '';
  document.getElementById('change-confirm-password').value = '';
  hideError('change-password-error');
  document.getElementById('change-password-modal').style.display = 'flex';
}

function closeChangePasswordModal() {
  document.getElementById('change-password-modal').style.display = 'none';
}

async function handleChangePassword(e) {
  e.preventDefault();
  const oldPassword = document.getElementById('change-old-password').value;
  const newPassword = document.getElementById('change-new-password').value;
  const confirmPassword = document.getElementById('change-confirm-password').value;
  
  if (newPassword !== confirmPassword) {
    showError('change-password-error', '两次输入的新密码不一致');
    return;
  }
  
  try {
    const response = await fetch('/api/roles/' + currentRole + '/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: oldPassword, newPassword: newPassword })
    });
    
    if (response.status === 429) {
      const data = await response.json();
      showError('change-password-error', data.error);
      return;
    }
    
    const data = await response.json();
    if (data.success) {
      alert('密码修改成功！');
      closeChangePasswordModal();
    } else {
      showError('change-password-error', data.error);
    }
  } catch (error) {
    console.error('Error changing password:', error);
    showError('change-password-error', '修改密码失败，请重试');
  }
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

function showError(elementId, message) {
  const errorEl = document.getElementById(elementId);
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function hideError(elementId) {
  const errorEl = document.getElementById(elementId);
  errorEl.style.display = 'none';
}

function showMainApp() {
  document.getElementById('role-select').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  updateRoleBadge();
  updatePasswordButtons();
  loadNotes();
}

async function updatePasswordButtons() {
  try {
    const response = await fetch('/api/roles/' + currentRole + '/has-password');
    const data = await response.json();
    const setPasswordBtn = document.getElementById('set-password-btn');
    const changePasswordBtn = document.getElementById('change-password-btn');
    
    if (data.hasPassword) {
      setPasswordBtn.style.display = 'none';
      changePasswordBtn.style.display = 'inline-block';
    } else {
      setPasswordBtn.style.display = 'inline-block';
      changePasswordBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking password:', error);
  }
}

function showSetPasswordFromSettings() {
  closeSettings();
  pendingRoleSelection = currentRole;
  document.getElementById('set-password-modal').querySelector('h2').textContent = '设置密码';
  showSetPasswordModal(currentRole);
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
  document.querySelectorAll('.nav-btn').forEach(function(btn) {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  document.getElementById('notes-tab').style.display = tab === 'notes' ? 'block' : 'none';
  document.getElementById('private-tab').style.display = tab === 'private' ? 'block' : 'none';
  loadNotes();
}

async function loadNotes() {
  try {
    let url = currentTab === 'notes' 
      ? '/api/notes?role=' + currentRole
      : '/api/notes/private?role=' + currentRole;
    
    const search = document.getElementById('search-input').value;
    if (search && currentTab === 'notes') {
      url += '&search=' + encodeURIComponent(search);
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
  
  container.innerHTML = notes.map(function(note) {
    return '<div class="note-card ' + (note.color ? 'color-' + note.color : '') + '">' +
      '<div class="note-header">' +
        '<h3 class="note-title">' + escapeHtml(note.title) + '</h3>' +
        '<div class="note-meta">' +
          '<span class="note-role ' + note.role + '">' + (roleNames[note.role] || note.role) + '</span>' +
          '<div class="note-actions">' +
            '<button class="btn-edit" onclick="editNote(' + note.id + ')">编辑</button>' +
            '<button class="btn-delete" onclick="deleteNote(' + note.id + ')">删除</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="note-content">' + note.content + '</div>' +
      '<div class="note-images" id="note-images-' + note.id + '"></div>' +
    '</div>';
  }).join('');
  
  notes.forEach(function(note) {
    loadNoteImages(note.id);
  });
}

async function loadNoteImages(noteId) {
  try {
    const response = await fetch('/api/notes/' + noteId + '/images');
    const images = await response.json();
    const container = document.getElementById('note-images-' + noteId);
    if (container) {
      container.innerHTML = images.map(function(img) { 
        return '<img src="/uploads/' + img.image_path + '" alt="便签图片">';
      }).join('');
    }
  } catch (error) {
    console.error('Error loading images:', error);
  }
}

function showNoteModal(isPrivate) {
  currentIsPrivate = isPrivate;
  selectedColor = roleColors[currentRole] || '';
  document.getElementById('note-modal').style.display = 'flex';
  document.getElementById('modal-title').textContent = isPrivate ? '新建日记' : '新建便签';
  document.getElementById('note-form').reset();
  document.getElementById('note-id').value = '';
  document.getElementById('note-content').innerHTML = '';
  document.getElementById('image-preview').innerHTML = '';
  pendingImage = null;
  
  document.getElementById('color-picker-group').style.display = 'none';
  
  document.querySelectorAll('.color-option').forEach(function(opt) {
    opt.classList.remove('selected');
  });
  const colorOption = document.querySelector('.color-option[data-color="' + selectedColor + '"]');
  if (colorOption) {
    colorOption.classList.add('selected');
  }
}

async function editNote(noteId) {
  try {
    const response = await fetch('/api/notes/' + noteId);
    const note = await response.json();
    
    currentIsPrivate = note.is_private === 1;
    selectedColor = note.color || '';
    document.getElementById('note-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = '编辑便签';
    document.getElementById('note-id').value = note.id;
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').innerHTML = note.content;
    document.getElementById('image-preview').innerHTML = '';
    pendingImage = null;
    
    document.getElementById('color-picker-group').style.display = 'block';
    
    document.querySelectorAll('.color-option').forEach(function(opt) {
      opt.classList.remove('selected');
    });
    const colorOption = document.querySelector('.color-option[data-color="' + selectedColor + '"]');
    if (colorOption) {
      colorOption.classList.add('selected');
    }
    
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
    reader.onload = function(e) {
      document.getElementById('image-preview').innerHTML = '<img src="' + e.target.result + '" alt="预览">';
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
      await fetch('/api/notes/' + noteId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, content: content, color: selectedColor, is_private: currentIsPrivate })
      });
      savedNoteId = noteId;
    } else {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, content: content, role: currentRole, color: selectedColor, is_private: currentIsPrivate })
      });
      const data = await response.json();
      savedNoteId = data.id;
    }
    
    if (pendingImage) {
      const formData = new FormData();
      formData.append('image', pendingImage);
      await fetch('/api/notes/' + savedNoteId + '/images', {
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
      await fetch('/api/notes/' + noteId, { method: 'DELETE' });
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

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
};
