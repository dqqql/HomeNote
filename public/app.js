
const emojiList = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '🥲', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '🥴', '😠', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🥺', '🤠', '🤡', '🥳', '🥴', '🥱', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩'
];

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
  document.getElementById('todo-tab').style.display = tab === 'todo' ? 'block' : 'none';
  if (tab === 'todo') {
    renderCalendar();
  } else {
    loadNotes();
  }
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return month + '.' + day;
}

function formatCommentTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return month + '/' + day + ' ' + hours + ':' + minutes;
}

function renderNotes(notes, containerId) {
  const container = document.getElementById(containerId);
  
  if (notes.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无内容，点击上方按钮创建</div>';
    return;
  }
  
  container.innerHTML = notes.map(function(note) {
    const dateStr = formatDate(note.created_at);
    return '<div class="note-card ' + (note.color ? 'color-' + note.color : '') + '" data-note-id="' + note.id + '">' +
      '<div class="note-header">' +
        '<div class="note-title-wrapper">' +
          '<h3 class="note-title">' + escapeHtml(note.title) + '</h3>' +
          '<span class="note-date">' + dateStr + '</span>' +
        '</div>' +
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
      '<div class="note-comments-section">' +
        '<div class="comments-list" id="comments-list-' + note.id + '"></div>' +
        '<div class="comment-input-area">' +
          '<div class="comment-input-wrapper">' +
            '<input type="text" class="comment-input" id="comment-input-' + note.id + '" placeholder="写评论...">' +
            '<button class="emoji-btn" onclick="toggleEmojiPicker(' + note.id + ')">😊</button>' +
            '<div class="emoji-picker" id="emoji-picker-' + note.id + '">' +
              '<div class="emoji-grid">' +
                emojiList.map(function(e) { return '<span class="emoji-item" onclick="insertEmoji(' + note.id + ', \'' + e + '\')">' + e + '</span>'; }).join('') +
              '</div>' +
            '</div>' +
          '</div>' +
          '<button class="comment-send-btn" onclick="submitComment(' + note.id + ')">' +
            '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  
  notes.forEach(function(note) {
    loadNoteImages(note.id);
    loadComments(note.id);
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
  
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const defaultTitle = month + '.' + day;
  document.getElementById('note-title').value = defaultTitle;
  
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

async function loadComments(noteId) {
  try {
    const response = await fetch('/api/notes/' + noteId + '/comments');
    const comments = await response.json();
    const container = document.getElementById('comments-list-' + noteId);
    if (container) {
      if (comments.length === 0) {
        container.innerHTML = '';
        return;
      }
      container.innerHTML = comments.map(function(comment) {
        return '<div class="comment-item">' +
          '<div class="comment-avatar">' +
            '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' +
          '</div>' +
          '<div class="comment-body">' +
            '<div class="comment-header">' +
              '<span class="comment-author">' + (roleNames[comment.role] || comment.role || '匿名') + '</span>' +
              '<span class="comment-time">' + formatCommentTime(comment.created_at) + '</span>' +
            '</div>' +
            '<div class="comment-content">' + escapeHtml(comment.content) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

function toggleEmojiPicker(noteId) {
  const picker = document.getElementById('emoji-picker-' + noteId);
  if (picker) {
    picker.classList.toggle('show');
  }
}

function insertEmoji(noteId, emoji) {
  const input = document.getElementById('comment-input-' + noteId);
  if (input) {
    input.value += emoji;
    input.focus();
  }
  const picker = document.getElementById('emoji-picker-' + noteId);
  if (picker) {
    picker.classList.remove('show');
  }
}

async function submitComment(noteId) {
  const input = document.getElementById('comment-input-' + noteId);
  if (!input) return;
  
  const content = input.value.trim();
  if (!content) {
    alert('请输入评论内容');
    return;
  }
  
  try {
    const response = await fetch('/api/notes/' + noteId + '/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: currentRole, content: content })
    });
    
    if (response.ok) {
      input.value = '';
      loadComments(noteId);
    } else {
      const data = await response.json();
      alert(data.error || '评论失败');
    }
  } catch (error) {
    console.error('Error submitting comment:', error);
    alert('评论失败，请重试');
  }
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.emoji-btn') && !e.target.closest('.emoji-picker')) {
    document.querySelectorAll('.emoji-picker.show').forEach(function(picker) {
      picker.classList.remove('show');
    });
  }
});

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
};

let currentDate = new Date();
let selectedTodoColor = '';
let currentTodoId = null;

function initTodoColorPicker() {
  const colorPicker = document.getElementById('todo-color-picker');
  if (colorPicker) {
    colorPicker.addEventListener('click', function(e) {
      const option = e.target.closest('.color-option');
      if (option) {
        document.querySelectorAll('#todo-color-picker .color-option').forEach(function(opt) {
          opt.classList.remove('selected');
        });
        option.classList.add('selected');
        selectedTodoColor = option.getAttribute('data-color');
      }
    });
  }
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const title = document.getElementById('calendar-title');
  title.textContent = year + '年' + (month + 1) + '月';

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  const startDate = new Date(year, month, 1 - startDay);
  const endDate = new Date(year, month + 1, 0 + (6 - lastDay.getDay()));
  const startDateStr = startDate.getFullYear() + '-' + String(startDate.getMonth() + 1).padStart(2, '0') + '-' + String(startDate.getDate()).padStart(2, '0');
  const endDateStr = endDate.getFullYear() + '-' + String(endDate.getMonth() + 1).padStart(2, '0') + '-' + String(endDate.getDate()).padStart(2, '0');

  loadTodos(startDateStr, endDateStr, function() {
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';

    for (let i = 0; i < startDay; i++) {
      const day = new Date(year, month, -startDay + i + 1);
      const dayElement = createDayElement(day, true, todayStr);
      calendarDays.appendChild(dayElement);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayElement = createDayElement(date, false, todayStr);
      calendarDays.appendChild(dayElement);
    }

    const remainingDays = 42 - (startDay + daysInMonth);
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      const dayElement = createDayElement(day, true, todayStr);
      calendarDays.appendChild(dayElement);
    }
  });
}

function createDayElement(date, isOtherMonth, todayStr) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = year + '-' + month + '-' + day;

  const dayElement = document.createElement('div');
  dayElement.className = 'calendar-day';
  if (isOtherMonth) {
    dayElement.classList.add('other-month');
  }
  if (dateStr === todayStr) {
    dayElement.classList.add('today');
  }

  const dayNumber = document.createElement('div');
  dayNumber.className = 'calendar-day-number';
  dayNumber.textContent = date.getDate();
  dayElement.appendChild(dayNumber);

  const todosContainer = document.createElement('div');
  todosContainer.className = 'calendar-todos';

  const dayTodos = currentTodos.filter(function(todo) {
    return todo.date === dateStr;
  });

  dayTodos.forEach(function(todo) {
    const todoElement = createTodoElement(todo);
    todosContainer.appendChild(todoElement);
  });

  dayElement.appendChild(todosContainer);

  dayElement.addEventListener('click', function(e) {
    if (!e.target.closest('.calendar-todo')) {
      openTodoModal(dateStr);
    }
  });

  return dayElement;
}

function createTodoElement(todo) {
  const todoElement = document.createElement('div');
  todoElement.className = 'calendar-todo';
  if (todo.color) {
    todoElement.classList.add('color-' + todo.color);
  } else {
    todoElement.style.backgroundColor = '#f0f0f0';
  }

  const roleColors = {
    father: '#3498db',
    mother: '#e91e63',
    son: '#27ae60',
    daughter: '#ff9800'
  };

  const roleBadge = document.createElement('span');
  roleBadge.className = 'calendar-todo-role';
  roleBadge.textContent = roleNames[todo.role]?.split(' ')[0] || todo.role;
  roleBadge.style.backgroundColor = roleColors[todo.role] || '#999';

  const contentSpan = document.createElement('span');
  contentSpan.className = 'calendar-todo-content';
  contentSpan.innerHTML = stripHtml(todo.content);

  todoElement.appendChild(roleBadge);
  todoElement.appendChild(contentSpan);

  todoElement.addEventListener('click', function(e) {
    e.stopPropagation();
    editTodo(todo);
  });

  return todoElement;
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

async function loadTodos(startDate, endDate, callback) {
  try {
    const response = await fetch('/api/todos?startDate=' + startDate + '&endDate=' + endDate);
    currentTodos = await response.json();
    if (callback) callback();
  } catch (error) {
    console.error('Error loading todos:', error);
    currentTodos = [];
    if (callback) callback();
  }
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

function openTodoModal(dateStr, todoId) {
  selectedTodoColor = roleColors[currentRole] || '';
  document.getElementById('todo-modal').style.display = 'flex';
  document.getElementById('todo-date').value = dateStr;
  document.getElementById('todo-id').value = todoId || '';
  document.getElementById('todo-content').innerHTML = '';
  document.getElementById('todo-modal-title').textContent = todoId ? '编辑待办' : '新建待办';
  document.getElementById('todo-delete-btn').style.display = todoId ? 'inline-block' : 'none';

  const date = new Date(dateStr);
  document.getElementById('todo-modal-date').textContent = date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';

  document.querySelectorAll('#todo-color-picker .color-option').forEach(function(opt) {
    opt.classList.remove('selected');
  });
  const colorOption = document.querySelector('#todo-color-picker .color-option[data-color="' + selectedTodoColor + '"]');
  if (colorOption) {
    colorOption.classList.add('selected');
  }

  const todoForm = document.getElementById('todo-form');
  todoForm.removeEventListener('submit', saveTodo);
  todoForm.addEventListener('submit', saveTodo);
}

function editTodo(todo) {
  currentTodoId = todo.id;
  openTodoModal(todo.date, todo.id);
  document.getElementById('todo-content').innerHTML = todo.content;
  selectedTodoColor = todo.color || '';

  document.querySelectorAll('#todo-color-picker .color-option').forEach(function(opt) {
    opt.classList.remove('selected');
  });
  const colorOption = document.querySelector('#todo-color-picker .color-option[data-color="' + selectedTodoColor + '"]');
  if (colorOption) {
    colorOption.classList.add('selected');
  }
}

function closeTodoModal() {
  document.getElementById('todo-modal').style.display = 'none';
  currentTodoId = null;
}

function formatTodoText(command) {
  const editor = document.getElementById('todo-content');
  editor.focus();

  if (command === 'bold') {
    document.execCommand('bold', false, null);
  } else if (command === 'underline') {
    document.execCommand('underline', false, null);
  }
}

async function saveTodo(e) {
  e.preventDefault();

  const todoId = document.getElementById('todo-id').value;
  const date = document.getElementById('todo-date').value;
  const content = document.getElementById('todo-content').innerHTML;
  const role = localStorage.getItem('homenote_role') || currentRole || '';

  try {
    if (todoId) {
      await fetch('/api/todos/' + todoId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content, color: selectedTodoColor })
      });
    } else {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: date, content: content, role: role, color: selectedTodoColor })
      });
    }

    closeTodoModal();
    renderCalendar();
  } catch (error) {
    console.error('Error saving todo:', error);
    alert('保存失败，请重试');
  }
}

async function deleteTodo() {
  if (!confirm('确定要删除这条待办吗？')) return;

  const todoId = document.getElementById('todo-id').value;
  if (!todoId) return;

  try {
    await fetch('/api/todos/' + todoId, { method: 'DELETE' });
    closeTodoModal();
    renderCalendar();
  } catch (error) {
    console.error('Error deleting todo:', error);
    alert('删除失败，请重试');
  }
}
