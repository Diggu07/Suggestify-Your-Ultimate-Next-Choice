console.log("MOVIES JS VERSION: 5");
document.addEventListener('DOMContentLoaded', () => {
  const genreContainer = document.getElementById('genreNav');
  const searchInput = document.getElementById('searchInput');
  const moviesGrid = document.getElementById('moviesGrid');
  const resultCount = document.getElementById('resultCount');

  let allMovies = [];
  let genres = [];
  let selectedGenre = "All";

  // -------------------------
  // API BASE
  // -------------------------
  const API_BASE = "http://localhost:5000";

  // -------------------------
  // 1. FETCH GENRES
  // -------------------------
  fetch(`${API_BASE}/api/genres?type=movies`)
    .then(r => r.json())
    .then(data => {
      // Remove duplicates and remove accidental "All"
      const cleaned = [...new Set(data.filter(g => g !== "All"))];

      genres = ["All", ...cleaned];
      renderGenres();
      fetchMovies();
    })
    .catch(err => {
      console.error("Genre fetch failed:", err);
      genres = ["All"];
      renderGenres();
      fetchMovies();
    });

  // -------------------------
  // 2. RENDER GENRE BUTTONS
  // -------------------------
  function renderGenres() {
    genreContainer.innerHTML = genres.map(g => `
      <button 
        class="genre-btn w-full text-left px-4 py-3 rounded-xl font-medium transition-all
        ${g === 'All' ? 'bg-[hsl(25,95%,65%)] text-white shadow-lg' : 'hover:bg-[hsl(220,15%,30%)]/20 text-[hsl(220,10%,70%)]'}"
        data-genre="${g}">
        ${g}
      </button>
    `).join('');

    document.querySelectorAll('.genre-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.genre-btn').forEach(b =>
          b.className =
            "genre-btn w-full text-left px-4 py-3 rounded-xl font-medium transition-all hover:bg-[hsl(220,15%,30%)]/20 text-[hsl(220,10%,70%)]"
        );

        btn.className =
          "genre-btn w-full text-left px-4 py-3 rounded-xl font-medium transition-all bg-[hsl(25,95%,65%)] text-white shadow-lg";

        selectedGenre = btn.dataset.genre;
        fetchMovies();
      });
    });
  }

  // -------------------------
  // 3. FETCH MOVIES (DEDUPED)
  // -------------------------
  function fetchMovies() {
    moviesGrid.innerHTML =
      '<div class="col-span-full text-center py-12">Loading movies...</div>';

    const endpoint = `${API_BASE}/api/movies?genre=${selectedGenre}`;
    console.log("FETCHING:", endpoint);

    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        console.log("Raw:", data.length);

        const uniqueMap = new Map();

        data.forEach(m => {
          // Extract real TMDB ID from something like:
          // "tmdb_movie_12345_action"
          const realId = m.id.split("_")[2];

          if (!uniqueMap.has(realId)) {
            uniqueMap.set(realId, {
              id: m.id,
              title: m.title,
              poster: m.poster,
              genres: m.genres || [],
              description: m.description,
              year: m.year,
              rating: m.rating
            });
          }
        });

        let list = Array.from(uniqueMap.values());

        // Local fallback filtering (in case backend sends wrong data)
        if (selectedGenre !== "All") {
          list = list.filter(m => m.genres.includes(selectedGenre));
        }

        allMovies = list;

        console.log("After Dedupe:", allMovies.length);

        renderMovies();
      })
      .catch(err => {
        console.error("Fetch error:", err);
        moviesGrid.innerHTML =
          '<div class="col-span-full text-center py-12 text-red-400">Failed to load movies.</div>';
      });
  }

  // -------------------------
  // 4. RENDER MOVIES GRID
  // -------------------------
  function renderMovies(searchTerm = "") {
    const filtered = allMovies.filter(m => {
      const gMatch =
        selectedGenre === "All" || (m.genres && m.genres.includes(selectedGenre));

      const sMatch = m.title.toLowerCase().includes(searchTerm.toLowerCase());

      return gMatch && sMatch;
    });

    if (filtered.length === 0) {
      moviesGrid.innerHTML =
        '<div class="col-span-full text-center py-12 text-[hsl(220,10%,70%)]">No movies found</div>';
      resultCount.textContent = `(0 items)`;
      return;
    }

    moviesGrid.innerHTML = filtered
      .map(movie => {
        const genreBadge = movie.genres?.[0] || "Unknown";

        return `
        <article class="group cursor-pointer movie-card" data-id="${movie.id}">
            <div class="bg-[hsl(220,20%,20%)] rounded-2xl overflow-hidden mb-4 aspect-[2/3]
              bg-[hsl(220,15%,30%)]/40 flex items-center justify-center relative 
              transition-all group-hover:scale-105 group-hover:shadow-2xl">
            ${
              movie.poster
                ? `<img src="${movie.poster}" class="w-full h-full object-cover">`
                : `<div class="text-6xl text-[hsl(220,10%,70%)]/20">🎬</div>`
            }
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <p class="text-sm text-white/80 line-clamp-3">${movie.description || "No description available."}</p>
              </div>
            </div>
          </div>

          <h3 class="font-semibold text-base mb-2">${movie.title}</h3>

          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm text-[hsl(220,10%,70%)]">${movie.year}</span>
            <span class="text-sm text-[hsl(220,10%,70%)]">•</span>
            <span class="text-sm text-[hsl(220,10%,70%)]">${movie.rating}</span>
          </div>

          <span class="px-3 py-1 rounded-full bg-[hsl(25,95%,65%)]/20 text-[hsl(25,95%,65%)] font-medium">
            ${genreBadge}
          </span>
        </article>
      `;
      })
      .join("");

    resultCount.textContent = `(${filtered.length} items)`;

    // Movie click → details page
    document.querySelectorAll('.movie-card').forEach(card => {
      card.addEventListener('click', () => {
        window.location.href = `content-detail.html?id=${card.dataset.id}`;
      });
    });
  }

  // -------------------------
  // 5. SEARCH INPUT
  // -------------------------
  searchInput?.addEventListener("input", e => renderMovies(e.target.value));
});
