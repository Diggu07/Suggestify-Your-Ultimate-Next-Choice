document.addEventListener('DOMContentLoaded', () => {
  const genreContainer = document.getElementById('genreNav');
  const searchInput = document.getElementById('searchInput');
  const mediaGrid = document.getElementById('mediaGrid');
  const resultCount = document.getElementById('resultCount');

  let allShows = [];
  let genres = [];
  let selectedGenre = "All";

  const API_BASE = "http://localhost:5000";

  // ----------------------------
  // 1. FETCH GENRES
  // ----------------------------
  fetch(`${API_BASE}/api/genres?type=tv_shows`)
    .then(r => r.json())
    .then(data => {
      console.log("TV GENRES:", data);

      // remove duplicate ALL + dedupe genres
      const cleaned = [...new Set(data.filter(g => g !== "All"))];

      genres = ["All", ...cleaned];

      renderGenres();
      fetchShows();
    })
    .catch(err => {
      console.error("GENRES ERROR:", err);
      genres = ["All"];
      renderGenres();
      fetchShows();
    });

  // ----------------------------
  // 2. RENDER GENRE BUTTONS
  // ----------------------------
  function renderGenres() {
    genreContainer.innerHTML = genres.map(g => `
      <button 
        class="genre-btn w-full text-left px-4 py-3 rounded-xl font-medium transition-all
        ${g === selectedGenre 
          ? 'bg-[hsl(25,95%,65%)] text-white shadow-lg'
          : 'hover:bg-[hsl(220,15%,30%)]/20 text-[hsl(220,10%,70%)]'}"
        data-genre="${g}">
        ${g}
      </button>
    `).join('');

    document.querySelectorAll('.genre-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedGenre = btn.dataset.genre;
        renderGenres(); 
        fetchShows();
      });
    });
  }

  // ----------------------------
  // 3. FETCH TV SHOWS (DEDUPED)
  // ----------------------------
  function fetchShows() {
    mediaGrid.innerHTML =
      '<div class="col-span-full text-center py-12">Loading TV Shows...</div>';

    const endpoint = `${API_BASE}/api/tv?genre=${selectedGenre}`;
    console.log("FETCH TV:", endpoint);

    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        console.log("RAW TV SHOWS:", data.length);

        const uniqueMap = new Map();

        data.forEach(s => {
          // extract tmdb ID from: tmdb_tv_34984_action
          const realId = s.id.split("_")[2];

          if (!uniqueMap.has(realId)) {
            uniqueMap.set(realId, {
              id: s.id,
              title: s.title,
              poster: s.poster,
              genres: s.genres || [],
              description: s.description,
              year: s.year,
              rating: s.rating,
            });
          }
        });

        let list = Array.from(uniqueMap.values());

        // frontend-level fallback filtering
        if (selectedGenre !== "All") {
          list = list.filter(s => s.genres.includes(selectedGenre));
        }

        allShows = list;

        console.log("TV SHOWS AFTER DEDUPE:", allShows.length);

        renderShows();
      })
      .catch(err => {
        console.error("FETCH ERROR:", err);
        mediaGrid.innerHTML =
          '<div class="col-span-full text-center py-12 text-red-400">Failed to load TV Shows</div>';
      });
  }

  // ----------------------------
  // 4. RENDER TV SHOW GRID
  // ----------------------------
  function renderShows(searchTerm = "") {
    const filtered = allShows.filter(s => {
      const gMatch =
        selectedGenre === "All" || (s.genres && s.genres.includes(selectedGenre));

      const sMatch = s.title.toLowerCase().includes(searchTerm.toLowerCase());

      return gMatch && sMatch;
    });

    resultCount.textContent = `(${filtered.length} items)`;

    if (filtered.length === 0) {
      mediaGrid.innerHTML =
        '<div class="col-span-full text-center py-12 text-[hsl(220,10%,70%)]">No Shows Found</div>';
      return;
    }

    mediaGrid.innerHTML = filtered
      .map(show => {
        const genreBadge = show.genres?.[0] || "Unknown";

        return `
        <article class="group cursor-pointer media-card" data-id="${show.id}">
          <div class="bg-[hsl(220,20%,20%)] rounded-2xl overflow-hidden mb-4 aspect-[2/3]
              bg-[hsl(220,15%,30%)]/40 flex items-center justify-center relative 
              group-hover:scale-105 transition">
            ${
              show.poster
                ? `<img src="${show.poster}" class="w-full h-full object-cover" />`
                : `<div class="text-6xl text-[hsl(220,10%,70%)]/30">📺</div>`
            }
          </div>

          <h3 class="font-semibold text-lg mb-1">${show.title}</h3>

          <p class="text-sm text-[hsl(220,10%,70%)]">
            ${show.year || "N/A"} • ${show.rating || "N/A"}
          </p>

          <span class="px-3 py-1 rounded-full 
                bg-[hsl(25,95%,65%)]/20 text-[hsl(25,95%,65%)] text-sm font-medium">
            ${genreBadge}
          </span>
        </article>
      `;
      })
      .join('');

    document.querySelectorAll('.media-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = `content-detail.html?id=${card.dataset.id}`;
      });
    });
  }

  // ----------------------------
  // 5. SEARCH FILTER
  // ----------------------------
  searchInput?.addEventListener("input", e => renderShows(e.target.value));
});
