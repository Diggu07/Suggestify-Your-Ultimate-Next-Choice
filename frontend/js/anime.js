document.addEventListener('DOMContentLoaded', () => {
  const genreContainer = document.getElementById('genreNav');
  const searchInput = document.getElementById('searchInput');
  const mediaGrid = document.getElementById('mediaGrid');
  const resultCount = document.getElementById('resultCount');

  let allAnime = [];
  let genres = [];
  let selectedGenre = "All";

  const API_BASE = "http://localhost:5000";

  // ---------------------------
  // 1. FETCH GENRES
  // ---------------------------
  fetch(`${API_BASE}/api/genres?type=anime`)
    .then(r => r.json())
    .then(data => {
      const cleaned = [...new Set(data.filter(g => g !== "All"))];

      genres = ["All", ...cleaned];
      renderGenres();
      fetchAnime();
    })
    .catch(err => {
      console.error("Genre error:", err);
      genres = ["All"];
      renderGenres();
      fetchAnime();
    });

  // ---------------------------
  // 2. RENDER GENRE BUTTONS
  // ---------------------------
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
        fetchAnime();
      });
    });
  }

  // ---------------------------
  // 3. FETCH ANIME (DEDUPED)
  // ---------------------------
  function fetchAnime() {
    mediaGrid.innerHTML =
      '<div class="col-span-full text-center py-12">Loading anime...</div>';

    fetch(`${API_BASE}/api/anime?genre=${selectedGenre}`)
      .then(r => r.json())
      .then(data => {
        console.log("RAW ANIME:", data.length);

        const uniqueMap = new Map();

        data.forEach(a => {
          // extract TMDB ID from: tmdb_anime_123456_action
          const realId = a.id.split("_")[2];

          if (!uniqueMap.has(realId)) {
            uniqueMap.set(realId, {
              id: a.id,
              title: a.title,
              poster: a.poster,
              genres: a.genres || [],
              description: a.description,
              year: a.year,
              rating: a.rating,
            });
          }
        });

        let list = Array.from(uniqueMap.values());

        // frontend fallback filter
        if (selectedGenre !== "All") {
          list = list.filter(a => a.genres.includes(selectedGenre));
        }

        allAnime = list;
        console.log("ANIME AFTER DEDUPE:", allAnime.length);

        renderAnime();
      })
      .catch(err => {
        console.error("Fetch error:", err);
        mediaGrid.innerHTML =
          '<div class="col-span-full text-center py-12 text-red-400">Failed to load anime.</div>';
      });
  }

  // ---------------------------
  // 4. RENDER ANIME GRID
  // ---------------------------
  function renderAnime(searchTerm = "") {
    const filtered = allAnime.filter(a => {
      const gMatch =
        selectedGenre === "All" || (a.genres && a.genres.includes(selectedGenre));

      const sMatch = a.title.toLowerCase().includes(searchTerm.toLowerCase());

      return gMatch && sMatch;
    });

    resultCount.textContent = `(${filtered.length} items)`;

    if (filtered.length === 0) {
      mediaGrid.innerHTML =
        '<div class="col-span-full text-center py-12 text-[hsl(220,10%,70%)]">No anime found</div>';
      return;
    }

    mediaGrid.innerHTML = filtered
      .map(show => {
        const genreBadge = show.genres?.[0] || "Unknown";

        return `
        <article class="group cursor-pointer media-card" data-id="${show.id}">
          <div class="bg-[hsl(220,20%,20%)] rounded-2xl overflow-hidden mb-4 aspect-[2/3]
                bg-[hsl(220,15%,30%)]/40 flex items-center justify-center relative 
                transition-all group-hover:scale-105 group-hover:shadow-2xl">

            ${
              show.poster
                ? `<img src="${show.poster}" class="w-full h-full object-cover">`
                : `<div class="text-6xl text-[hsl(220,10%,70%)]/20">🎌</div>`
            }

            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="absolute bottom-0 p-4">
                <p class="text-sm text-white/80 line-clamp-3">${show.description || "No description available."}</p>
              </div>
            </div>
          </div>

          <h3 class="font-semibold text-lg mb-2">${show.title}</h3>

          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm text-[hsl(220,10%,70%)]">${show.year}</span>
            <span class="text-sm text-[hsl(220,10%,70%)]">•</span>
            <span class="text-sm text-[hsl(220,10%,70%)]">${show.rating}</span>
          </div>

          <span class="px-3 py-1 rounded-full bg-[hsl(25,95%,65%)]/20 text-[hsl(25,95%,65%)] font-medium">
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

  // ---------------------------
  // 5. SEARCH FILTER
  // ---------------------------
  searchInput?.addEventListener("input", e => renderAnime(e.target.value));
});
