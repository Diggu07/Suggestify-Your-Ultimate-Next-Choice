document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:5000"; // ADDED: API_BASE was missing!

    const username = localStorage.getItem("username");
    if (!username) {
        window.location.href = "login_page.html";
        return;
    }

    const nameEl = document.getElementById("profileName");
    const emailEl = document.getElementById("profileEmail");
    const usernameTop = document.getElementById("profileUsername");
    const emailTop = document.getElementById("profileEmailTop");
    const initialsEl = document.getElementById("profileInitials");

    const statCompleted = document.getElementById("statCompleted");
    const statFav = document.getElementById("statFav");
    const statWatchlist = document.getElementById("statWatchlist");

    const watchlistContainer = document.getElementById("watchlistContainer");

    // FETCH PROFILE
    function loadProfile() {
        console.log("Loading profile for:", username);
        
        fetch(`${API_BASE}/api/user?username=${username}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log("Profile data received:", data);

                usernameTop.textContent = data.username;
                emailTop.textContent = data.email || "No email";

                nameEl.textContent = data.fullname || data.username;
                emailEl.textContent = data.email || "No email";

                initialsEl.textContent = data.username[0].toUpperCase();

                statCompleted.textContent = data.stats?.completed || 0;
                statFav.textContent = data.stats?.favorites || 0;
                statWatchlist.textContent = data.stats?.watchlist || 0;

                console.log("Watchlist items:", data.watchlist);
                loadWatchlist(data.watchlist || []);
                loadAchievements(data.achievements || []);
            })
            .catch(err => {
                console.error("Error loading profile:", err);
                alert("Failed to load profile. Please try logging in again.");
            });
    }

    loadProfile();

    // WATCHLIST MOVIE TILES
    function loadWatchlist(arr) {
        console.log("Loading watchlist with", arr.length, "items");
        watchlistContainer.innerHTML = "";

        if (arr.length === 0) {
            watchlistContainer.innerHTML = `
                <p class="text-gray-400 col-span-full text-center py-8">
                    No items in watchlist yet. <br>
                    <span class="text-sm">Add movies, TV shows, or anime to see them here!</span>
                </p>
            `;
            return;
        }

        arr.forEach(movie => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "bg-[#1e2737] p-2 rounded-xl shadow relative group hover:scale-105 transition-transform cursor-pointer";
            
            // Make cards clickable to view details
            itemDiv.onclick = (e) => {
                // Don't navigate if clicking the remove button
                if (!e.target.closest('button')) {
                    window.location.href = `content-detail.html?id=${movie.mediaId}`;
                }
            };

            itemDiv.innerHTML = `
                <img src="${movie.poster}" 
                     class="rounded-lg mb-2 h-36 w-full object-cover"
                     onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'"
                     alt="${movie.title}">
                <p class="text-sm font-semibold truncate" title="${movie.title}">${movie.title}</p>
                <span class="text-xs text-gray-400">${movie.type || 'media'}</span>
                <button 
                    onclick="event.stopPropagation(); removeFromWatchlist('${movie.mediaId}')"
                    class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from watchlist">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            `;
            watchlistContainer.appendChild(itemDiv);
        });
    }

    // REMOVE FROM WATCHLIST
    window.removeFromWatchlist = async function(mediaId) {
        console.log("Removing from watchlist:", mediaId);
        
        if (!confirm("Remove this item from your watchlist?")) return;

        try {
            const response = await fetch(`${API_BASE}/api/watchlist/remove`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, mediaId })
            });

            const data = await response.json();
            console.log("Remove response:", data);

            if (data.success) {
                alert("✅ Removed from watchlist!");
                loadProfile(); // Reload to update
            } else {
                alert("❌ Failed to remove from watchlist");
            }
        } catch (err) {
            console.error("Error removing from watchlist:", err);
            alert("❌ Error removing from watchlist");
        }
    };

    // ACHIEVEMENTS
    function loadAchievements(list) {
        const grid = document.getElementById("achievementGrid");
        grid.innerHTML = "";

        if (!list || list.length === 0) {
            grid.innerHTML = `<p class="text-gray-400 col-span-full text-center py-4">No achievements yet. Keep watching to unlock achievements!</p>`;
            return;
        }

        list.forEach(a => {
            grid.innerHTML += `
                <div class="p-4 rounded-xl text-center bg-[#1e2737] hover:bg-[#2a3447] transition-colors">
                    <p class="font-semibold">🏆 ${a}</p>
                </div>
            `;
        });
    }

    // EDIT PROFILE
    document.getElementById("btnEditProfile").onclick = () => {
        const newName = prompt("Enter new full name:");
        if (!newName || newName.trim() === "") return;

        fetch(`${API_BASE}/api/user/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, fullname: newName.trim() })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                nameEl.textContent = newName;
                alert("✅ Profile updated!");
            } else {
                alert("❌ Failed to update profile");
            }
        })
        .catch(err => {
            console.error("Error updating profile:", err);
            alert("❌ Error updating profile");
        });
    };

    // CHANGE PASSWORD
    document.getElementById("btnChangePass").onclick = () => {
        const oldPassword = prompt("Enter your current password:");
        if (!oldPassword) return;

        const newPassword = prompt("Enter new password:");
        if (!newPassword) return;

        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters long");
            return;
        }

        const confirmPassword = prompt("Confirm new password:");
        if (confirmPassword !== newPassword) {
            alert("Passwords do not match!");
            return;
        }

        fetch(`${API_BASE}/api/user/password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, oldPassword, newPassword })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("✅ Password updated successfully!");
            } else {
                alert("❌ Failed to update password. Check your current password.");
            }
        })
        .catch(err => {
            console.error("Error changing password:", err);
            alert("❌ Error changing password");
        });
    };
});