// Fade ready and back
function readyUp() {
  document.body.classList.remove("preload");
  document.body.classList.add("ready");
}
window.addEventListener("DOMContentLoaded", readyUp);
window.addEventListener("pageshow", readyUp, { once:false });

document.getElementById("back-home").addEventListener("click", (e) => {
  e.preventDefault();
  document.body.classList.remove("ready");
  document.body.classList.add("preload");
  setTimeout(() => history.back(), 220);
});

const API = 'http://localhost:8080/api/v1';
const nameInput = document.getElementById("name-input");

// Utility to show toast notifications (same as your existing method)
function showToast(msg, type = "info") {
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className = `toast show ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// Fetch profile info on page load
async function fetchProfile() {
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    showToast("Not authenticated", "error");
    return;
  }
  try {
    const res = await fetch(`${API}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    const data = await res.json();
    nameInput.value = data.displayName || '';
    document.getElementById('p-name').textContent = data.displayName || 'User';
    document.querySelector('.avatar').src = data.avatarUrl || 'Images/profile/avatar.png';
    // If bio field exists, set it (You may add a bio input in profile.html)
    if(document.getElementById('bio-input')) document.getElementById('bio-input').value = data.bio || '';
  } catch(err) {
    console.error(err);
    showToast("Failed to load profile", "error");
  }
}

// Update profile API call
async function updateProfile() {
  const token = sessionStorage.getItem('accessToken');
  if (!token) {
    showToast("Not authenticated", "error");
    return;
  }
  try {
    const res = await fetch(`${API}/profile`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        displayName: nameInput.value,
        bio: document.getElementById('bio-input')?.value || ''
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update profile');
    showToast('Profile saved', 'success');
    document.getElementById('p-name').textContent = nameInput.value || 'User';
  } catch(err) {
    showToast(err.message, 'error');
  }
}

document.getElementById('save-prof').addEventListener('click', updateProfile);

// Initialize profile data on page load
window.addEventListener('DOMContentLoaded', fetchProfile);
