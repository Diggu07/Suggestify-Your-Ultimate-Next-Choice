document.addEventListener("DOMContentLoaded", () => {
  console.log("CONTENT DETAILS JS LOADED OK");

  const API_BASE = "http://localhost:5000";

  const urlParams = new URLSearchParams(window.location.search);
  const idRaw =
    urlParams.get("id") || urlParams.get("tmdbId") || urlParams.get("mediaId");
  const categoryParam = urlParams.get("category") || urlParams.get("type");

  if (!idRaw) {
    console.error("❌ No id in query string");
    return;
  }

  // Detect category
  let category = "";
  if (idRaw.startsWith("tmdb_movie")) category = "movies";
  else if (idRaw.startsWith("tmdb_tv")) category = "tv";
  else if (idRaw.startsWith("tmdb_anime")) category = "anime";
  else category = categoryParam || "";

  // Extract numeric TMDB id if needed
  let realId = idRaw;
  if (idRaw.includes("_")) {
    const parts = idRaw.split("_");
    const num = parts.find((x) => /^\d+$/.test(x));
    realId = num || idRaw;
  }

  const qs = new URLSearchParams();
  qs.set("id", idRaw.includes("_") ? idRaw : realId);
  if (category) qs.set("category", category);

  console.log("Fetching details using:", qs.toString());

  // Helper function to safely set text content
  const safeSetText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    } else {
      console.error(`❌ Element not found: ${selector}`);
    }
  };

  const safeSetHTML = (selector, html) => {
    const element = document.querySelector(selector);
    if (element) {
      element.innerHTML = html;
    } else {
      console.error(`❌ Element not found: ${selector}`);
    }
  };

  // FILL USERNAME + ICON
  const uname = localStorage.getItem("username");

  if (uname) {
    document.getElementById("navUsername").textContent = uname;
    document.getElementById("navUserIcon").textContent = uname
      .charAt(0)
      .toUpperCase();
  }

  // DROPDOWN MENU
  const dropBtn = document.getElementById("userDropdownBtn");
  const dropMenu = document.getElementById("userDropdownMenu");

  if (dropBtn && dropMenu) {
    dropBtn.addEventListener("click", () => {
      dropMenu.classList.toggle("hidden");
    });
  }

  // LOGOUT
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "/templates/login_page.html";
    });
  }

  // Store data globally so watchlist button can access it
  let contentData = null;

  fetch(`${API_BASE}/api/details?${qs.toString()}`)
    .then((res) => {
      if (!res.ok)
        return res.json().then((err) => {
          throw err;
        });
      return res.json();
    })
    .then((data) => {
      console.log("DETAIL RESPONSE =", data);

      // Store data for watchlist button
      contentData = data;

      // Assign detail UI using safe functions
      safeSetHTML(
        "#posterBox",
        `<img src="${data.poster}" class="w-full h-full object-cover">`
      );

      safeSetText("#ratingValue", data.rating || "N/A");
      safeSetText("#title", data.title || "N/A");
      safeSetText("#year", data.year || "N/A");
      safeSetText("#genreBadge", data.genres?.[0] || "Unknown");
      safeSetText("#description", data.description || "No description");

      const castHtml = data.cast?.length
        ? data.cast
            .map(
              (c) =>
                `<span class="px-4 py-2 bg-[#2a3447]/50 rounded-full">${c}</span>`
            )
            .join("")
        : "<span class='text-gray-400'>No cast available</span>";

      safeSetHTML("#castContainer", castHtml);

    //Mark as watched
      markWatchedBtn.addEventListener("click", async () => {
    const username = localStorage.getItem("username");

    if (!username) {
        alert("Login required");
        return;
    }

    if (!contentData) {
        alert("Content not loaded yet");
        return;
    }

    // USE CONTENTDATA DIRECTLY
    const mediaId = contentData.mediaId || contentData.id;
    const title = contentData.title;
    const poster = contentData.poster;

    let type = "movie";
    if (mediaId.includes("tmdb_tv")) type = "tv";
    if (mediaId.includes("tmdb_anime")) type = "anime";

    console.log("📡 Sending to server:", { mediaId, title, poster, type });

    const res = await fetch("http://localhost:5000/api/user/mark-watched", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": username
        },
        body: JSON.stringify({
            mediaId,
            title,
            poster,
            type
        })
    });

    const data = await res.json();

    if (data.success) {
        markWatchedBtn.innerHTML = "✔ Watched";
        markWatchedBtn.disabled = true;
        markWatchedBtn.classList.add("opacity-60");
    } else {
        alert(data.error || "Error marking watched");
    }
});


      /* ===============================
               TAKE QUIZ BUTTON
            ================================ */

      const quizBtn = document.getElementById("takeQuizBtn");
      console.log("Quiz button =", quizBtn);

      if (!quizBtn) {
        console.error("❌ takeQuizBtn not found in HTML");
      } else {
        const mediaId = data.mediaId || data.id || data._id;
        console.log("DETECTED mediaId =", mediaId);

        quizBtn.addEventListener("click", () => {
          console.log("QUIZ BUTTON CLICKED");

          if (!mediaId) {
            if (typeof showToast === "function") {
              showToast("Quiz not available for this item", "error");
            } else {
              alert("Quiz not available for this item");
            }
            return;
          }

          // Redirect to quiz
          window.location.href = `quiz.html?mediaId=${mediaId}`;
        });
      }
    })
    .catch((err) => {
      console.error("DETAIL ERROR:", err);
      if (typeof showToast === "function") {
        showToast("Failed to load details", "error");
      } else {
        alert("Failed to load details");
      }
    });

  /* ===============================
   ADD TO WATCHLIST BUTTON
================================ */
  const watchBtn = document.getElementById("addWatchlistBtn");

  if (!watchBtn) {
    console.error("❌ addWatchlistBtn not found");
  } else {
    console.log("✅ Watchlist button found");

    watchBtn.addEventListener("click", async () => {
      console.log("⭐ ADD TO WATCHLIST CLICKED");

      // FIX: Changed from "token" to "username"
      const username = localStorage.getItem("username");

      console.log("Username from localStorage:", username);

      if (!username) {
        alert("Please log in first to add to watchlist");
        window.location.href = "login_page.html";
        return;
      }

      // Wait for content data to be loaded
      if (!contentData) {
        alert("Content data is still loading. Please try again.");
        return;
      }

      const mediaId = contentData.mediaId || contentData.id || contentData._id;
      const title = contentData.title || "Untitled";
      const poster = contentData.poster || "";

      // Determine type from mediaId or category
      let type = "movie";
      if (mediaId.includes("_tv_")) {
        type = "tv";
      } else if (mediaId.includes("_anime_")) {
        type = "anime";
      } else if (category) {
        type = category === "movies" ? "movie" : category;
      }

      console.log("Adding to watchlist:", { mediaId, title, poster, type });

      try {
        const res = await fetch(`${API_BASE}/api/watchlist/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: username, // Send username directly
          },
          body: JSON.stringify({ mediaId, title, poster, type }),
        });

        console.log("Response status:", res.status);
        const result = await res.json();
        console.log("Response data:", result);

        if (result.success) {
          if (typeof showToast === "function") {
            showToast("✅ Added to Watchlist!", "success");
          } else {
            alert("✅ Added to Watchlist!");
          }

          // Update button state
          watchBtn.textContent = "✓ In Watchlist";
          watchBtn.disabled = true;
          watchBtn.classList.add("opacity-50", "cursor-not-allowed");
        } else {
          alert("❌ " + (result.message || "Failed to add to watchlist"));
        }
      } catch (err) {
        console.error("WATCHLIST ERROR:", err);
        alert("❌ Failed to add to watchlist. Check console for details.");
      }
    });
  }
});
