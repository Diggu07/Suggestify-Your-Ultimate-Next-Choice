document.addEventListener("DOMContentLoaded", () => {

    const username = localStorage.getItem("username");
    if (!username) return;

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
    fetch(`${API_BASE}/api/user?username=${username}`)
        .then(res => res.json())
        .then(data => {

            usernameTop.textContent = data.username;
            emailTop.textContent = data.email;

            nameEl.textContent = data.fullname || data.username;
            emailEl.textContent = data.email;

            initialsEl.textContent = data.username[0].toUpperCase();

            statCompleted.textContent = data.stats.completed || 0;
            statFav.textContent = data.stats.favorites || 0;
            statWatchlist.textContent = data.stats.watchlist || 0;

            loadWatchlist(data.watchlist || []);
            loadAchievements(data.achievements || []);
        });


    // WATCHLIST MOVIE TILES
    function loadWatchlist(arr) {
        watchlistContainer.innerHTML = "";

        if (arr.length === 0) {
            watchlistContainer.innerHTML = `<p class="text-gray-400 col-span-full">No movies added yet.</p>`;
            return;
        }

        arr.forEach(movie => {
            watchlistContainer.innerHTML += `
                <div class="bg-[#1e2737] p-2 rounded-xl shadow">
                    <img src="${movie.poster}" class="rounded-lg mb-2 h-36 w-full object-cover">
                    <p class="text-sm font-semibold">${movie.title}</p>
                </div>
            `;
        });
    }

    // ACHIEVEMENTS
    function loadAchievements(list) {
        const grid = document.getElementById("achievementGrid");
        grid.innerHTML = "";

        list.forEach(a => {
            grid.innerHTML += `
                <div class="p-4 rounded-xl text-center bg-[#1e2737]">
                    <p class="font-semibold">${a}</p>
                </div>
            `;
        });
    }

    // EDIT PROFILE
    document.getElementById("btnEditProfile").onclick = () => {
        const newName = prompt("Enter new full name:");
        if (!newName) return;

        fetch(`${API_BASE}/api/user/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, fullname: newName })
        });

        nameEl.textContent = newName;
    };

    // CHANGE PASSWORD
    document.getElementById("btnChangePass").onclick = () => {

        const oldPass = prompt("Enter old password:");
        if (!oldPass) return;

        const newPass = prompt("Enter new password:");
        if (!newPass) return;

        fetch(`${API_BASE}/api/user/password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, oldPass, newPass })
        }).then(() => alert("Password updated successfully."));
    };

});
