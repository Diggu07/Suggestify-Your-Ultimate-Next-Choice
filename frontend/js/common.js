// common.js
// Common utilities and functions used across all pages

const API_BASE = "http://localhost:5000"; // <-- use your Node backend

// Toggle dropdown menu
function initDropdown() {
  const profileBtn = document.getElementById("profileBtn");
  const dropdown = document.getElementById("dropdownMenu");

  if (profileBtn && dropdown) {
    // Toggle on click
    profileBtn.addEventListener("click", (event) => {
      event.stopPropagation(); // don't trigger document click
      dropdown.classList.toggle("hidden");
    });

    // Close when clicking outside
    document.addEventListener("click", (event) => {
      const isClickInsideButton = profileBtn.contains(event.target);
      const isClickInsideMenu = dropdown.contains(event.target);

      if (!isClickInsideButton && !isClickInsideMenu) {
        dropdown.classList.add("hidden");
      }
    });
  }
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white font-medium animate-fade-in`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Load animation
function addLoadAnimation() {
  const elements = document.querySelectorAll('.animate-on-load');
  elements.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add('animate-fade-in');
    }, index * 100);
  });
}

// Initialize common features on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initDropdown();
  addLoadAnimation();
  // Update header/profile display using logged-in username from localStorage
  let storedUser = localStorage.getItem('username');
  if (!storedUser) {
    // some flows store full user object
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u && u.username) storedUser = u.username;
    } catch {}
  }
  if (storedUser) {
    try {
      const profileBtn = document.getElementById('profileBtn');
      const dropdown = document.getElementById('dropdownMenu');

      if (profileBtn) {
        const nameSpan = profileBtn.querySelector('span.font-medium');
        const initialsSpan = profileBtn.querySelector('div > span');
        if (nameSpan) nameSpan.textContent = storedUser;
        if (initialsSpan) {
          const parts = storedUser.trim().split(' ');
          const init = parts.length === 1 ? parts[0][0] : (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
          initialsSpan.textContent = init.toUpperCase();
        }
      }

      if (dropdown) {
        const nameP = dropdown.querySelector('p.font-medium');
        if (nameP) nameP.textContent = storedUser;
      }
    } catch (e) {
      console.warn('Header update failed:', e);
    }
  }
});
