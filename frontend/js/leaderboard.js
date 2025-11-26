document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username") || "User";
  document.getElementById("navUsername").textContent = username;

  fetch(`${API_BASE}/cpp/leaderboard`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("leaderboardContainer");
      container.innerHTML = "";

      data.forEach((entry, index) => {
        container.innerHTML += `
          <div class="p-4 rounded-xl bg-white/10 flex items-center gap-4">
            <span class="text-xl font-bold">#${index + 1}</span>
            <div class="h-12 w-12 rounded-full bg-[hsl(25,95%,65%)] flex items-center justify-center font-bold">
              ${entry.username.slice(0, 2).toUpperCase()}
            </div>
            <span class="font-medium">${entry.username}</span>
            <span class="ml-auto font-bold text-[hsl(25,95%,65%)]">${entry.score} pts</span>
          </div>
        `;
      });
    })
    .catch(() => showToast("Failed to load leaderboard", "error"));
});
