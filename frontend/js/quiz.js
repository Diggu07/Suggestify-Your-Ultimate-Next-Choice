(function() {
  'use strict';

  let currentQuestion = 0;
  let selectedAnswers = {};
  let questions = [];
  const BASE_URL = "http://localhost:5000";

  // Wait for both DOM and all scripts to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    console.log("🚀 Quiz initialized");
    
    const params = new URLSearchParams(window.location.search);

    const mediaId = params.get("mediaId");
    const type = params.get('type') || "movie";
    const genre = params.get('genre') || "Action";
    const limit = params.get('limit') || 5;

    const username = localStorage.getItem("username");
    if (username) {
      const navUsernameEl = document.getElementById("navUsername");
      if (navUsernameEl) navUsernameEl.textContent = username;
    }

    // Setup navigation FIRST with error checking
    setupNavigation();

    console.log("🎬 Starting quiz load...");
    console.log("mediaId:", mediaId);

    /* ====================================
          QUIZ FOR A SPECIFIC TITLE
    ===================================== */
    if (mediaId) {
      console.log("🎬 Loading quiz for mediaId:", mediaId);

      fetch(BASE_URL + "/cpp/quiz/byMedia?mediaId=" + mediaId)
        .then(function(res) {
          console.log("Response status:", res.status);
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(function(data) {
          console.log("✅ Raw quiz data received:", data);
          console.log("Number of questions:", data.length);

          if (!data || data.length === 0) {
            alert("No quiz available for this title");
            window.location.href = "home.html";
            return;
          }

          // Map MongoDB structure to our format
          questions = data.map(function(q) {
            console.log("Mapping question:", q);
            return {
              id: q._id,
              question: q.questionText,
              options: q.options,
              correctIndex: q.correctOptionIndex
            };
          });

          console.log("📝 Final mapped questions:", questions);

          document.getElementById("totalQ").textContent = questions.length;
          document.getElementById("quizTitle").textContent = "Quiz: " + (data[0] && data[0].mediaId ? data[0].mediaId : 'Title');
          
          console.log("About to render first question...");
          renderQuestion();
        })
        .catch(function(err) {
          console.error("❌ Quiz load error:", err);
          alert("Failed to load quiz: " + err.message);
        });

      return;
    }

    /* ====================================
           NORMAL QUIZ (TYPE + GENRE)
    ===================================== */
    console.log("🎮 Loading normal quiz:", type, genre);

    fetch(BASE_URL + "/cpp/quiz?type=" + type + "&genre=" + genre + "&limit=" + limit)
      .then(function(res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function(data) {
        console.log("✅ Normal quiz data:", data);
        
        questions = data.map(function(q) {
          return {
            id: q._id,
            question: q.question,
            options: [q.A, q.B, q.C, q.D],
            correctIndex: q.correctOptionIndex || 0
          };
        });

        document.getElementById("totalQ").textContent = questions.length;
        document.getElementById("quizTitle").textContent = type.toUpperCase() + " Quiz - " + genre;
        
        renderQuestion();
      })
      .catch(function(err) {
        console.error("❌ Quiz load error:", err);
        alert("Failed to load quiz: " + err.message);
      });
  }

  function setupNavigation() {
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    console.log("🔧 Setting up navigation");
    console.log("prevBtn:", prevBtn);
    console.log("nextBtn:", nextBtn);

    if (!prevBtn || !nextBtn) {
      console.error("❌ Navigation buttons not found!");
      return;
    }

    // Remove any existing listeners by cloning
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    // Add fresh listeners
    newPrevBtn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("⬅️ Previous clicked");
      if (currentQuestion > 0) {
        currentQuestion--;
        renderQuestion();
      }
    });

    newNextBtn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("➡️ Next clicked, current:", currentQuestion, "selected:", selectedAnswers[currentQuestion]);
      handleNext();
    });

    console.log("✅ Navigation setup complete");
  }

  function renderQuestion() {
    console.log("=== renderQuestion called ===");
    console.log("questions array:", questions);
    console.log("questions.length:", questions.length);
    console.log("currentQuestion:", currentQuestion);

    if (!questions || questions.length === 0) {
      console.error("❌ No questions available");
      return;
    }

    const q = questions[currentQuestion];
    console.log("📝 Rendering Q" + (currentQuestion + 1) + ":", q);
    console.log("Question text:", q.question);
    console.log("Options:", q.options);

    const questionTextEl = document.getElementById("questionText");
    console.log("questionText element:", questionTextEl);
    
    if (questionTextEl) {
      questionTextEl.textContent = q.question;
      console.log("✅ Set question text to:", q.question);
    } else {
      console.error("❌ questionText element not found!");
    }

    document.getElementById("currentQ").textContent = currentQuestion + 1;

    const progress = ((currentQuestion + 1) / questions.length) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
    document.getElementById("progressText").textContent = Math.round(progress) + "% Complete";

    const optionsContainer = document.getElementById("optionsContainer");
    console.log("optionsContainer:", optionsContainer);
    optionsContainer.innerHTML = "";
    
    q.options.forEach(function(opt, i) {
      console.log("Creating option " + i + ":", opt);
      const letter = String.fromCharCode(65 + i);
      const isSelected = selectedAnswers[currentQuestion] === i;

      const btn = document.createElement('button');
      btn.type = "button";
      btn.className = "w-full p-6 rounded-xl flex items-center gap-4 transition-all " + 
        (isSelected 
          ? "bg-[hsl(25,95%,65%)] text-white scale-[1.02]" 
          : "bg-[hsl(220,15%,30%)]/40 hover:bg-[hsl(220,15%,30%)]/60");
      
      btn.addEventListener('click', function() {
        selectAnswer(i);
      });
      
      btn.innerHTML = 
        '<span class="h-10 w-10 rounded-full flex items-center justify-center font-bold ' +
        (isSelected ? 'bg-white text-[hsl(25,95%,65%)]' : 'bg-[hsl(220,15%,30%)]') + '">' +
        letter +
        '</span>' +
        '<span class="text-left">' + opt + '</span>';
      
      optionsContainer.appendChild(btn);
    });

    console.log("✅ Added " + q.options.length + " option buttons");

    // Update prev button state
    const prevBtn = document.getElementById("prevBtn");
    if (currentQuestion === 0) {
      prevBtn.disabled = true;
      prevBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      prevBtn.disabled = false;
      prevBtn.classList.remove("opacity-50", "cursor-not-allowed");
    }

    // Update next/submit button
    const nextBtn = document.getElementById("nextBtn");
    nextBtn.textContent = currentQuestion === questions.length - 1 ? "Submit Quiz" : "Next Question";
    
    console.log("=== renderQuestion complete ===");
  }

  function selectAnswer(index) {
    console.log("✅ Selected answer " + index + " (" + String.fromCharCode(65 + index) + ") for question " + (currentQuestion + 1));
    selectedAnswers[currentQuestion] = index;
    renderQuestion();
  }

  function handleNext() {
    console.log("🔍 Checking answer - current:", currentQuestion, "selected:", selectedAnswers[currentQuestion]);
    
    if (selectedAnswers[currentQuestion] === undefined) {
      console.warn("⚠️ No answer selected");
      alert("⚠️ Please choose an option first");
      return;
    }

    if (currentQuestion < questions.length - 1) {
      console.log("✅ Moving to next question");
      currentQuestion++;
      renderQuestion();
    } else {
      console.log("🏁 Last question - submitting");
      submitQuiz();
    }
  }

  function submitQuiz() {
    const username = localStorage.getItem("username") || "Guest";

    const formatted = questions.map(function(q, idx) {
      return {
        questionId: q.id,
        selectedIndex: selectedAnswers[idx]
      };
    });

    console.log("📤 Submitting answers:", formatted);

    fetch(BASE_URL + "/cpp/submit", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ username: username, answers: formatted })
    })
    .then(function(r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function(res) {
      console.log("✅ Quiz submitted:", res);
      alert("🎉 Quiz Complete!\n\nYour Score: " + res.score + "/" + res.total);
      setTimeout(function() {
        window.location.href = "leaderboard.html";
      }, 1500);
    })
    .catch(function(err) {
      console.error("❌ Submit error:", err);
      alert("Failed to submit quiz: " + err.message);
    });
  }
})();