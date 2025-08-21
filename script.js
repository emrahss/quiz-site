/* Enhanced Quiz Platform - JavaScript */

// Sample questions with enhanced data structure
let QUESTIONS = [
  {
    q: "Türkiye'nin başkenti neresidir?",
    options: ["İstanbul", "Ankara", "İzmir", "Bursa"],
    answer: "Ankara",
    category: "Genel Kültür",
    difficulty: "easy",
    madde: null,
  },
  {
    q: "İstiklal Marşı'nın yazarı kimdir?",
    options: ["Mehmet Akif Ersoy", "Namık Kemal", "Yahya Kemal", "Ziya Gökalp"],
    answer: "Mehmet Akif Ersoy",
    category: "Tarih",
    difficulty: "medium",
    madde: null,
  },
  {
    q: "TSK'da tümen mi kolordu mu daha büyüktür?",
    options: ["Tümen", "Kolordu", "Eşittir", "Bağlıdır"],
    answer: "Kolordu",
    category: "Askeri",
    difficulty: "hard",
    madde: 12,
  },
];

let ORIGINAL = [...QUESTIONS];

// State variables
let idx = 0;
let score = 0;
let STATS = QUESTIONS.map(() => ({ attempts: 0, correct: 0, wrong: 0 }));
let userAnswers = Array(QUESTIONS.length).fill(null);
let MARKED = new Set();
let NOTES = {};
let FAVS = new Set();

// Timer variables
let timerId = null,
  elapsed = 0;
let countdownId = null,
  countdown = 0;

// DOM element shortcuts
const $ = (s) => document.querySelector(s);

// Utility functions
function letter(i) {
  return String.fromCharCode(65 + i);
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function showToast(message, type = "info") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Navigation functions
function goTo(n) {
  const total = QUESTIONS.length;
  if (total === 0) return;
  const i = Math.min(Math.max(1, parseInt(n, 10) || 1), total);
  idx = i - 1;
  render();
}

function extractMaddeFromObj(qObj) {
  if (
    qObj &&
    typeof qObj.madde !== "undefined" &&
    qObj.madde !== null &&
    qObj.madde !== ""
  ) {
    return qObj.madde;
  }
  if (qObj && typeof qObj.q === "string") {
    const m = qObj.q.match(/\(madde\s*(\d+)\)/i);
    return m ? m[1] : null;
  }
  return null;
}

// Timer functions
function fmtTime(s) {
  const m = Math.floor(s / 60),
    ss = String(s % 60).padStart(2, "0");
  return `${String(m).padStart(2, "0")}:${ss}`;
}

function updateTimer() {
  const timer = $("#timer");
  if (timer) timer.textContent = `⏱️ ${fmtTime(elapsed)}`;
}

function startStopTimer() {
  const timerStart = $("#timerStart");
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    timerStart.textContent = "▶️ Başlat";
    return;
  }
  timerId = setInterval(() => {
    elapsed += 1;
    updateTimer();
  }, 1000);
  timerStart.textContent = "⏸️ Durdur";
}

function resetTimer() {
  elapsed = 0;
  updateTimer();
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    $("#timerStart").textContent = "▶️ Başlat";
  }
}

// Main render function
function render() {
  const total = QUESTIONS.length;
  const qcounter = $("#qcounter");
  const question = $("#question");
  const choices = $("#choices");
  const bar = $("#bar");
  const score_el = $("#score");
  const prev = $("#prev");
  const next = $("#next");

  if (total === 0) {
    question.textContent = "Soru yok.";
    choices.innerHTML = "";
    qcounter.textContent = "Soru 0 / 0";
    bar.style.width = "0%";
    return;
  }

  if (idx >= total) {
    idx = total - 1;
  }
  const q = QUESTIONS[idx];

  // Update question display
  question.textContent = q.q;
  qcounter.textContent = `📋 Soru ${idx + 1} / ${total}`;
  bar.style.width = `${(idx / Math.max(1, total)) * 100}%`;

  // Category display
  const categoryDisplay = $("#categoryDisplay");
  if (q.category && categoryDisplay) {
    categoryDisplay.textContent = `📚 ${q.category}`;
    categoryDisplay.style.display = "inline-block";
  } else if (categoryDisplay) {
    categoryDisplay.style.display = "none";
  }

  // Difficulty display
  const difficultyDisplay = $("#difficultyDisplay");
  if (q.difficulty && difficultyDisplay) {
    const difficultyMap = {
      easy: { text: "🟢 Kolay", class: "difficulty-easy" },
      medium: { text: "🟡 Orta", class: "difficulty-medium" },
      hard: { text: "🔴 Zor", class: "difficulty-hard" },
    };
    const diff = difficultyMap[q.difficulty] || difficultyMap["easy"];
    difficultyDisplay.textContent = diff.text;
    difficultyDisplay.className = `difficulty-badge ${diff.class}`;
    difficultyDisplay.style.display = "inline-block";
  } else if (difficultyDisplay) {
    difficultyDisplay.style.display = "none";
  }

  // Madde badge
  const maddeBadge = $("#maddeBadge");
  const madde = extractMaddeFromObj(q);
  if (
    madde !== null &&
    typeof madde !== "undefined" &&
    madde !== "" &&
    maddeBadge
  ) {
    maddeBadge.style.display = "inline-block";
    maddeBadge.textContent = `📜 Madde ${madde}`;
  } else if (maddeBadge) {
    maddeBadge.style.display = "none";
  }

  // Render choices
  choices.innerHTML = "";
  const opts = q._shuffled || shuffle([...q.options]);
  q._shuffled = opts;

  opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice";
    btn.innerHTML = `<span class="badge">${letter(i)}</span><span class="label">${opt}</span>`;
    btn.addEventListener("click", () => onChoose(btn, opt, q.answer));

    if (userAnswers[idx] !== null) {
      btn.classList.add("disabled");
      const chosen = userAnswers[idx];
      if (chosen === q.answer) {
        if (opt === q.answer) btn.classList.add("correct");
      } else {
        if (opt === chosen) btn.classList.add("wrong");
        if (opt === q.answer) btn.classList.add("correct");
      }
    }
    choices.appendChild(btn);
  });

  // Navigation buttons
  prev.disabled = idx === 0;
  next.disabled = false;
  next.textContent = idx === total - 1 ? "🏁 Bitir" : "Sonraki ➡️";

  // Score display
  const answered = userAnswers.filter((x) => x !== null).length;
  const correctCount = score;
  const wrongCount = Math.max(0, answered - correctCount);
  const markedCount = MARKED.size;
  const noteCount = Object.keys(NOTES).length;

  score_el.textContent = `💯 D:${correctCount} Y:${wrongCount} İ:${markedCount} N:${noteCount}`;

  // Favorite button
  const favBtn = $("#favBtn");
  if (favBtn) {
    favBtn.textContent = FAVS.has(q.q) ? "★ Favori" : "⭐ Favori";
  }

  // Mark button
  const markBtn = $("#markBtn");
  if (markBtn) {
    markBtn.disabled = false;
    markBtn.textContent = MARKED.has(idx) ? "✅ İşaretli" : "🔖 İşaretle";
  }

  // Note box
  const noteBox = $("#noteBox");
  if (noteBox) {
    noteBox.value = NOTES[idx] || "";
  }

  // Marked questions button
  const showMarkedBtn = $("#showMarkedBtn");
  if (showMarkedBtn) {
    showMarkedBtn.disabled = MARKED.size === 0;
  }
}

// Answer selection
function onChoose(btn, chosen, correct) {
  if (userAnswers[idx] !== null) return;

  const btns = $("#choices").querySelectorAll(".choice");
  btns.forEach((b) => b.classList.add("disabled"));

  if (chosen === correct) {
    btn.classList.add("correct");
    userAnswers[idx] = correct;
    score += 1;
    STATS[idx].attempts++;
    STATS[idx].correct++;
    showToast("🎉 Doğru cevap!", "success");
  } else {
    btn.classList.add("wrong");
    [...btns]
      .find((b) => b.textContent.includes(correct))
      ?.classList.add("correct");
    userAnswers[idx] = chosen;
    STATS[idx].attempts++;
    STATS[idx].wrong++;
    showToast("❌ Yanlış cevap!", "error");
  }

  // Update score display immediately
  const answeredNow = userAnswers.filter((x) => x !== null).length;
  const correctNow = score;
  const wrongNow = Math.max(0, answeredNow - correctNow);
  const markedCount = MARKED.size;
  const noteCount = Object.keys(NOTES).length;

  $("#score").textContent =
    `💯 D:${correctNow} Y:${wrongNow} İ:${markedCount} N:${noteCount}`;
}

// End quiz
function endQuiz() {
  $(".card").classList.add("hidden");
  $(".nav").classList.add("hidden");
  $("#endScreen").style.display = "block";

  const total = QUESTIONS.length;
  const correct = score;
  const wrong = total - correct;
  const success = total > 0 ? Math.round((correct / total) * 100) : 0;
  const markedCount = MARKED.size;
  const noteCount = Object.keys(NOTES).length;
  const timeSpent = fmtTime(elapsed);

  $("#resultText").innerHTML = `
    <div style="font-size: 1.5rem; margin-bottom: 1rem;">
      📊 <strong>${correct}/${total}</strong> doğru (%${success} başarı)
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0;">
      <div>✅ Doğru: <strong>${correct}</strong></div>
      <div>❌ Yanlış: <strong>${wrong}</strong></div>
      <div>📌 İşaretli: <strong>${markedCount}</strong></div>
      <div>📝 Notlu: <strong>${noteCount}</strong></div>
      <div>⏱️ Süre: <strong>${timeSpent}</strong></div>
      <div>🎯 Skor: <strong>${correct * 10}</strong></div>
    </div>
  `;

  $("#bar").style.width = "100%";

  // Stop timer
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  showToast(
    `Quiz tamamlandı! %${success} başarı ile ${correct} doğru cevap.`,
    "success",
  );
}

// Quiz restart
function restartQuiz() {
  idx = 0;
  score = 0;
  userAnswers = Array(QUESTIONS.length).fill(null);
  STATS = QUESTIONS.map(() => ({ attempts: 0, correct: 0, wrong: 0 }));
  QUESTIONS.forEach((q) => {
    delete q._shuffled;
  });
  $("#endScreen").style.display = "none";
  $(".card").classList.remove("hidden");
  $(".nav").classList.remove("hidden");
  resetTimer();
  render();
  showToast("🔄 Quiz yeniden başlatıldı!", "success");
}

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  // Navigation
  $("#prev")?.addEventListener("click", () => {
    if (idx > 0) {
      idx--;
      render();
    }
  });

  $("#next")?.addEventListener("click", () => {
    if (idx < QUESTIONS.length - 1) {
      idx++;
      render();
    } else {
      endQuiz();
    }
  });

  $("#reset")?.addEventListener("click", () => {
    if (confirm("Quiz sıfırlanacak. Emin misiniz?")) {
      restartQuiz();
    }
  });

  $("#restartBtn")?.addEventListener("click", restartQuiz);

  // Timer controls
  $("#timerStart")?.addEventListener("click", startStopTimer);
  $("#timerReset")?.addEventListener("click", resetTimer);

  // Theme toggle
  $("#theme")?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    showToast(
      document.body.classList.contains("dark")
        ? "🌙 Karanlık tema"
        : "☀️ Açık tema",
      "success",
    );
  });

  // Mark functionality
  $("#markBtn")?.addEventListener("click", () => {
    if (!QUESTIONS.length) return;
    if (MARKED.has(idx)) {
      MARKED.delete(idx);
      $("#markBtn").textContent = "🔖 İşaretle";
    } else {
      MARKED.add(idx);
      $("#markBtn").textContent = "✅ İşaretli";
    }
    render();
  });

  // Favorites
  $("#favBtn")?.addEventListener("click", () => {
    const key = QUESTIONS[idx]?.q || "";
    if (!key) return;
    if (FAVS.has(key)) {
      FAVS.delete(key);
      $("#favBtn").textContent = "⭐ Favori";
    } else {
      FAVS.add(key);
      $("#favBtn").textContent = "★ Favori";
    }
  });

  // Notes
  $("#noteBox")?.addEventListener("input", (e) => {
    if (!QUESTIONS.length) return;
    if (e.target.value.trim()) {
      NOTES[idx] = e.target.value;
    } else {
      delete NOTES[idx];
    }
    render();
  });

  // Jump to question
  $("#jumpBtn")?.addEventListener("click", () => {
    const jumpTo = $("#jumpTo");
    if (jumpTo) goTo(jumpTo.value);
  });

  $("#jumpTo")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      goTo(e.target.value);
    }
  });

  // Search
  $("#search")?.addEventListener("input", (e) => {
    const term = e.target.value.trim().toLowerCase();
    if (!term) {
      QUESTIONS = [...ORIGINAL];
    } else {
      QUESTIONS = ORIGINAL.filter((q) => q.q.toLowerCase().includes(term));
    }

    score = 0;
    idx = 0;
    userAnswers = Array(QUESTIONS.length).fill(null);
    STATS = QUESTIONS.map(() => ({ attempts: 0, correct: 0, wrong: 0 }));
    QUESTIONS.forEach((q) => {
      delete q._shuffled;
    });
    $("#endScreen").style.display = "none";
    $(".card").classList.remove("hidden");
    $(".nav").classList.remove("hidden");
    render();
  });

  // Stats toggle
  $("#statsToggle")?.addEventListener("click", () => {
    const panel = $("#statsPanel");
    const willOpen = !panel.classList.contains("open");
    panel.classList.toggle("open");
    if (willOpen) {
      const parts = QUESTIONS.map((q, i) => {
        const s = STATS[i] || { attempts: 0, correct: 0, wrong: 0 };
        const rate =
          s.attempts > 0 ? Math.round((s.wrong / s.attempts) * 100) : 0;
        const category = q.category || "Genel";
        const difficulty = q.difficulty || "easy";

        return `
          <div class="stat-item">
            <div>
              <div style="font-weight: bold;">${i + 1}. ${q.q}</div>
              <div style="font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem;">
                📂 ${category} • ⭐ ${difficulty}
              </div>
            </div>
            <div>
              <span class="pill-mini ok">✅ ${s.correct}</span>
              <span class="pill-mini bad" style="margin-left:8px">❌ ${s.wrong}</span>
              <span class="pill-mini" style="margin-left:8px;background:rgba(37,99,235,.18);color:var(--primary)">📈 %${rate}</span>
            </div>
          </div>
        `;
      }).join("");

      panel.innerHTML =
        parts || '<div class="stat-item">📊 Henüz istatistik yok.</div>';
    }
  });

  // Admin panel toggle
  $("#adminToggle")?.addEventListener("click", () => {
    const panel = $("#adminPanel");
    panel.classList.toggle("open");
    showToast(
      panel.classList.contains("open")
        ? "⚙️ Admin paneli açıldı"
        : "⚙️ Admin paneli kapandı",
      "success",
    );
  });

  // Modal close
  $("#modalCancel")?.addEventListener("click", () => {
    $("#modal").classList.remove("open");
  });

  // Initialize
  updateTimer();
  render();

  // Update category filter
  const categories = [...new Set(ORIGINAL.map((q) => q.category || "Genel"))];
  const categoryFilter = $("#categoryFilter");
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="">🌐 Tüm Kategoriler</option>';
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = `📂 ${cat}`;
      categoryFilter.appendChild(option);
    });
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    const activeEl = document.activeElement;
    const isInput =
      activeEl &&
      (activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.isContentEditable);
    if (isInput) return;

    // Arrow keys for navigation
    if (e.key === "ArrowLeft" && $("#prev") && !$("#prev").disabled) {
      $("#prev").click();
      e.preventDefault();
    }
    if (e.key === "ArrowRight" && $("#next") && !$("#next").disabled) {
      $("#next").click();
      e.preventDefault();
    }

    // Number keys for choices
    if (/^[1-5]$/.test(e.key)) {
      const n = parseInt(e.key, 10) - 1;
      const btns = $("#choices")?.querySelectorAll(".choice") || [];
      if (btns[n] && !btns[n].classList.contains("disabled")) {
        btns[n].click();
        e.preventDefault();
      }
    }
  });
});
