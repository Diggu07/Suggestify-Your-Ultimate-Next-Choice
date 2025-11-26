document.addEventListener("DOMContentLoaded", () => {
    console.log("CONTENT DETAILS JS LOADED OK");

    const API_BASE = "http://localhost:5000";

    const urlParams = new URLSearchParams(window.location.search);
    const idRaw = urlParams.get("id") || urlParams.get("tmdbId") || urlParams.get("mediaId");
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
        const num = parts.find(x => /^\d+$/.test(x));
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

    fetch(`${API_BASE}/api/details?${qs.toString()}`)
        .then(res => {
            if (!res.ok) return res.json().then(err => { throw err; });
            return res.json();
        })
        .then(data => {
            console.log("DETAIL RESPONSE =", data);

            // Assign detail UI using safe functions
            safeSetHTML("#posterBox", 
                `<img src="${data.poster}" class="w-full h-full object-cover">`);

            safeSetText("#ratingValue", data.rating || "N/A");
            safeSetText("#title", data.title || "N/A");
            safeSetText("#year", data.year || "N/A");
            safeSetText("#genreBadge", data.genres?.[0] || "Unknown");
            safeSetText("#description", data.description || "No description");

            const castHtml = data.cast?.length
                ? data.cast.map(c => `<span class="px-4 py-2 bg-[#2a3447]/50 rounded-full">${c}</span>`).join("")
                : "<span class='text-gray-400'>No cast available</span>";
            
            safeSetHTML("#castContainer", castHtml);

            /* ===============================
               TAKE QUIZ BUTTON
            ================================ */

            const quizBtn = document.getElementById("takeQuizBtn");
            console.log("Quiz button =", quizBtn);

            if (!quizBtn) {
                console.error("❌ takeQuizBtn not found in HTML");
                return;
            }

            const mediaId = data.mediaId || data.id || data._id;
            console.log("DETECTED mediaId =", mediaId);

            quizBtn.addEventListener("click", () => {
                console.log("QUIZ BUTTON CLICKED");

                if (!mediaId) {
                    if (typeof showToast === 'function') {
                        showToast("Quiz not available for this item", "error");
                    } else {
                        alert("Quiz not available for this item");
                    }
                    return;
                }

                // Redirect to quiz
                window.location.href = `quiz.html?mediaId=${mediaId}`;
            });

        })
        .catch(err => {
            console.error("DETAIL ERROR:", err);
            if (typeof showToast === 'function') {
                showToast("Failed to load details", "error");
            } else {
                alert("Failed to load details");
            }
        });
});