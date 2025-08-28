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
    q: "Türkiye'nin en uzun nehri hangisidir?",
    options: ["Kızılırmak", "Sakarya", "Fırat", "Dicle"],
    answer: "Kızılırmak",
    category: "Coğrafya",
    difficulty: "medium",
    madde: null,
  },
  {
    q: "Osmanlı İmparatorluğu ne yılında kurulmuştur?",
    options: ["1299", "1326", "1453", "1389"],
    answer: "1299",
    category: "Tarih",
    difficulty: "medium",
    madde: null,
  },
  {
    q: "Nasreddin Hoca hangi şehirle özdeşleştirilir?",
    options: ["Akşehir", "Konya", "Kayseri", "Eskişehir"],
    answer: "Akşehir",
    category: "Kültür",
    difficulty: "easy",
    madde: null,
  },
  {
    q: "2×2×2×2 işleminin sonucu kaçtır?",
    options: ["8", "16", "12", "24"],
    answer: "16",
    category: "Matematik",
    difficulty: "easy",
    madde: null,
  },
];

// Convert existing questions to index-based format
QUESTIONS = QUESTIONS.map(q => {
  if (typeof q.answer === 'string') {
    const index = q.options.findIndex(opt => opt === q.answer);
    return { ...q, answer: index !== -1 ? index : 0 };
  }
  return q;
});

let ORIGINAL = [...QUESTIONS];

// State variables
let idx = 0;
let score = 0;
let STATS = QUESTIONS.map(() => ({ attempts: 0, correct: 0, wrong: 0 }));
let userAnswers = Array(QUESTIONS.length).fill(null);
let MARKED = new Set();
let NOTES = {};
let FAVS = new Set();

// Filter state - to track current view
let currentFilter = 'all'; // 'all', 'favorites', 'marked'

// Update button texts based on current filter
function updateFilterButtons() {
  const favToggle = $("#favToggle");
  const showMarkedBtn = $("#showMarkedBtn");
  
  if (favToggle) {
    favToggle.textContent = currentFilter === 'favorites' ? "📚 Tüm Sorular" : "⭐ Favoriler";
  }
  
  if (showMarkedBtn) {
    showMarkedBtn.textContent = currentFilter === 'marked' ? "📚 Tüm Sorular" : "📌 İşaretliler";
  }
}

// Timer variables
let timerId = null,
  elapsed = 0;
let countdownId = null,
  countdown = 0;

// DOM element shortcuts - güvenli selector with caching
const elementCache = new Map();
const $ = (s) => {
  // Use cached element if available
  if (elementCache.has(s)) {
    const cached = elementCache.get(s);
    // Verify element is still in DOM
    if (cached && document.contains(cached)) {
      return cached;
    } else {
      elementCache.delete(s);
    }
  }
  
  const element = document.querySelector(s);
  if (!element && (s === '#categoryFilter' || s === '#difficultyFilter')) {
    // Bu elementler kaldırıldı, sessizce null döndür
    return null;
  }
  
  if (!element) {
    console.warn(`Element not found: ${s}`);
    return null;
  }
  
  // Cache element for future use
  elementCache.set(s, element);
  return element;
};

// Utility function for getElementById with caching
const getById = (id) => {
  const selector = `#${id}`;
  return $(selector);
};

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
  if (!toast) {
    console.warn('Toast element not found');
    return;
  }
  
  // Toast elementini tamamen sıfırla
  toast.style.display = "block";
  toast.classList.remove("hide", "show", "success", "error");
  
  // Yeni mesajı göster
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.add("hide");
    toast.classList.remove("show");
    setTimeout(() => {
      toast.style.display = "none";
      toast.classList.remove("hide");
    }, 300); // Animasyon süresi kadar bekle
  }, 4000);
}

// Modal operation state to prevent race conditions
let modalOperationInProgress = false;

function showModal(title, text, onConfirm) {
  if (modalOperationInProgress) {
    console.warn('Modal operation already in progress');
    return;
  }
  
  modalOperationInProgress = true;
  
  const modal = $("#modal");
  const modalTitle = $("#modalTitle");
  const modalText = $("#modalText");
  const confirmBtn = $("#modalConfirm");
  const cancelBtn = $("#modalCancel");
  
  if (!modal || !modalTitle || !modalText || !confirmBtn || !cancelBtn) {
    // Fallback to simple confirm if modal elements not found
    modalOperationInProgress = false;
    if (confirm(text)) {
      onConfirm();
    }
    return;
  }
  
  modalTitle.textContent = title;
  modalText.textContent = text;
  
  // Clear previous listeners to prevent race conditions
  confirmBtn.onclick = null;
  cancelBtn.onclick = null;
  
  // Add new listeners with proper cleanup
  confirmBtn.onclick = () => {
    if (modalOperationInProgress) {
      modal.classList.remove("show");
      modalOperationInProgress = false;
      if (onConfirm) onConfirm();
    }
  };
  
  cancelBtn.onclick = () => {
    if (modalOperationInProgress) {
      modal.classList.remove("show");
      modalOperationInProgress = false;
    }
  };
  
  // Show modal after listeners are set
  modal.classList.add("show");
  
  // Auto-cleanup after timeout to prevent stuck state
  setTimeout(() => {
    if (modalOperationInProgress && modal.classList.contains('show')) {
      modalOperationInProgress = false;
    }
  }, 30000); // 30 second timeout
}

// Navigation functions
function goTo(n) {
  if (!QUESTIONS || !Array.isArray(QUESTIONS)) {
    console.warn('QUESTIONS array not available');
    return;
  }
  const total = QUESTIONS.length;
  if (total === 0) return;
  const i = Math.min(Math.max(1, parseInt(n, 10) || 1), total);
  idx = i - 1;
  render();
}

function extractMaddeFromObj(qObj) {
  if (!qObj || typeof qObj !== 'object') {
    return null;
  }
  if (
    typeof qObj.madde !== "undefined" &&
    qObj.madde !== null &&
    qObj.madde !== ""
  ) {
    return qObj.madde;
  }
  if (qObj.q && typeof qObj.q === "string") {
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
  if (!timer) {
    console.warn('Timer element not found');
    return;
  }
  timer.textContent = `⏱️ ${fmtTime(elapsed)}`;
}

function startStopTimer() {
  const timerStart = $("#timerStart");
  if (!timerStart) {
    console.warn('Timer start button not found');
    return;
  }
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
    const timerStart = $("#timerStart");
    if (timerStart) {
      timerStart.textContent = "▶️ Başlat";
    }
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

  // Gerekli elementler yoksa fonksiyondan çık
  if (!qcounter || !question || !choices || !bar || !score_el || !prev || !next) {
    console.error("Render: Gerekli DOM elementleri bulunamadı!");
    return;
  }

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
      const chosenText = userAnswers[idx];
      const correctText = typeof q.answer === 'number' ? q.options[q.answer] : q.answer;
      
      if (chosenText === correctText) {
        if (opt === correctText) btn.classList.add("correct");
      } else {
        if (opt === chosenText) btn.classList.add("wrong");
        if (opt === correctText) btn.classList.add("correct");
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
    if (FAVS.has(q.q)) {
      favBtn.textContent = "⭐ Favorili";
      favBtn.classList.add("favorite-active");
    } else {
      favBtn.textContent = "⭐ Favori";
      favBtn.classList.remove("favorite-active");
    }
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

  // Note icon display
  const noteIcon = $("#noteIcon");
  if (noteIcon) {
    const hasNote = NOTES[idx] && NOTES[idx].trim().length > 0;
    if (hasNote) {
      noteIcon.style.display = "inline-block";
      noteIcon.innerHTML = `📝<div class="note-tooltip">${NOTES[idx]}</div>`;
    } else {
      noteIcon.style.display = "none";
      noteIcon.innerHTML = "📝";
    }
  }

  // Marked questions button
  const showMarkedBtn = $("#showMarkedBtn");
  if (showMarkedBtn) {
    showMarkedBtn.disabled = MARKED.size === 0;
  }
}

// ==============================================
// MISSING FUNCTION IMPLEMENTATIONS
// ==============================================

// Update question display (wrapper for render)
function updateQuestion() {
  try {
    render();
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    // Fallback: basic question counter update
    const qcounter = $("#qcounter");
    const total = QUESTIONS.length;
    if (qcounter && total > 0) {
      qcounter.textContent = `📋 Soru ${idx + 1} / ${total}`;
    }
  }
}

// Update statistics display
function updateStats() {
  try {
    const answered = userAnswers.filter(x => x !== null).length;
    const correctCount = score;
    const wrongCount = Math.max(0, answered - correctCount);
    const markedCount = MARKED.size;
    const noteCount = Object.keys(NOTES).length;
    
    const scoreEl = $("#score");
    if (scoreEl) {
      scoreEl.textContent = `💯 D:${correctCount} Y:${wrongCount} İ:${markedCount} N:${noteCount}`;
    }
  } catch (error) {
    console.error('Error in updateStats:', error);
  }
}

// Update progress bar
function updateProgress() {
  try {
    const total = QUESTIONS.length;
    if (total > 0) {
      const progressPercentage = ((idx + 1) / total) * 100;
      const bar = $("#bar");
      if (bar) {
        bar.style.width = `${progressPercentage}%`;
      }
      
      const qcounter = $("#qcounter");
      if (qcounter) {
        qcounter.textContent = `📋 Soru ${idx + 1} / ${total}`;
      }
    }
  } catch (error) {
    console.error('Error in updateProgress:', error);
  }
}

// Answer selection
function onChoose(btn, chosenText, correct) {
  if (!btn) {
    console.warn('Button element not provided');
    return;
  }
  if (!userAnswers || userAnswers[idx] !== null) return;
  if (!QUESTIONS || !QUESTIONS[idx]) {
    console.warn('Question not available');
    return;
  }

  const choicesContainer = $("#choices");
  if (!choicesContainer) {
    console.warn('Choices container not found');
    return;
  }
  const btns = choicesContainer.querySelectorAll(".choice");
  btns.forEach((b) => b.classList.add("disabled"));

  // Doğru cevap metnini al (index'ten)
  const correctText = typeof correct === 'number' ? QUESTIONS[idx].options[correct] : correct;
  
  if (chosenText === correctText) {
    btn.classList.add("correct");
    userAnswers[idx] = chosenText;
    score += 1;
    STATS[idx].attempts++;
    STATS[idx].correct++;
    showToast("🎉 Doğru cevap!", "success");
  } else {
    btn.classList.add("wrong");
    // Doğru cevap butonunu bul ve işaretle
    [...btns].find(b => b.textContent.includes(correctText))?.classList.add("correct");
    userAnswers[idx] = chosenText;
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

  const scoreEl = $("#score");
  if (scoreEl) {
    scoreEl.textContent = `💯 D:${correctNow} Y:${wrongNow} İ:${markedCount} N:${noteCount}`;
  }
}

// End quiz
function endQuiz() {
  const card = $(".card");
  const nav = $(".nav");
  const endScreen = $("#endScreen");
  
  if (card) card.classList.add("hidden");
  if (nav) nav.classList.add("hidden");
  if (endScreen) endScreen.style.display = "block";

  const total = QUESTIONS.length;
  const correct = score;
  const wrong = total - correct;
  const success = total > 0 ? Math.round((correct / total) * 100) : 0;
  const markedCount = MARKED.size;
  const noteCount = Object.keys(NOTES).length;
  const timeSpent = fmtTime(elapsed);

  const resultText = $("#resultText");
  if (resultText) {
    resultText.innerHTML = `
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
  }

  const bar = $("#bar");
  if (bar) bar.style.width = "100%";

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
  
  const endScreen = $("#endScreen");
  const card = $(".card");
  const nav = $(".nav");
  
  if (endScreen) endScreen.style.display = "none";
  if (card) card.classList.remove("hidden");
  if (nav) nav.classList.remove("hidden");
  
  resetTimer();
  render();
  showToast("🔄 Quiz yeniden başlatıldı!", "success");
}

// Background system
let currentBackground = localStorage.getItem('quizBackground') || 'default';

function initBackgroundSystem() {
  // Sayfa yüklendiğinde kaydedilmiş arka planı uygula
  setBackground(currentBackground);
  
  // Arka plan dropdown'ına event listener ekle
  const backgroundSelector = document.getElementById('backgroundSelector');
  if (!backgroundSelector) {
    console.warn('Background selector element not found during initialization');
    return;
  }
  if (backgroundSelector) {
    // Mevcut değeri ayarla
    backgroundSelector.value = currentBackground;
    
    // Change event listener ekle
    backgroundSelector.addEventListener('change', function() {
      const bgType = this.value;
      setBackground(bgType);
    });
  }
}

function setBackground(bgType) {
  if (!bgType || typeof bgType !== 'string') {
    console.warn('Invalid background type provided');
    return;
  }
  
  if (!document.body) {
    console.warn('Document body not available');
    return;
  }
  
  // Eski arka plan sınıflarını kaldır
  document.body.className = document.body.className.replace(/bg-\w+/g, '');
  
  // Yeni arka plan sınıfını ekle
  document.body.classList.add(`bg-${bgType}`);
  
  // Dropdown seçimini güncelle
  const backgroundSelector = document.getElementById('backgroundSelector');
  if (backgroundSelector) {
    backgroundSelector.value = bgType;
  } else {
    console.warn('Background selector not found during background update');
  }
  
  // LocalStorage'a kaydet
  currentBackground = bgType;
  try {
    localStorage.setItem('quizBackground', bgType);
  } catch (error) {
    console.warn('Could not save background to localStorage:', error);
  }
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
    const favBtn = $("#favBtn");
    if (FAVS.has(key)) {
      FAVS.delete(key);
      favBtn.textContent = "⭐ Favori";
      favBtn.classList.remove("favorite-active");
    } else {
      FAVS.add(key);
      favBtn.textContent = "⭐ Favorili";
      favBtn.classList.add("favorite-active");
    }
  });

  // Show all questions
  $("#showAllBtn")?.addEventListener("click", () => {
    QUESTIONS = [...ORIGINAL];
    currentFilter = 'all';
    
    // Reset quiz state
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
    updateFilterButtons();
    showToast(`📚 Tüm ${QUESTIONS.length} soru gösteriliyor!`, "success");
  });

  // Show favorites only
  $("#favToggle")?.addEventListener("click", () => {
    if (currentFilter === 'favorites') {
      // If already showing favorites, go back to all questions
      QUESTIONS = [...ORIGINAL];
      currentFilter = 'all';
      
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
      updateFilterButtons();
      showToast(`📚 Tüm ${QUESTIONS.length} soru gösteriliyor!`, "success");
      return;
    }
    
    const hasFavorites = FAVS.size > 0;
    if (!hasFavorites) {
      showToast("❌ Henüz favori soru yok!", "error");
      return;
    }
    
    // Filter questions to show only favorites
    QUESTIONS = ORIGINAL.filter((q) => FAVS.has(q.q));
    currentFilter = 'favorites';
    
    if (QUESTIONS.length === 0) {
      showToast("❌ Favori soru bulunamadı!", "error");
      QUESTIONS = [...ORIGINAL];
      currentFilter = 'all';
      return;
    }
    
    // Reset quiz state for filtered questions
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
    updateFilterButtons();
    showToast(`⭐ ${QUESTIONS.length} favori soru gösteriliyor!`, "success");
  });

  // Show marked questions only
  $("#showMarkedBtn")?.addEventListener("click", () => {
    if (currentFilter === 'marked') {
      // If already showing marked questions, go back to all questions
      QUESTIONS = [...ORIGINAL];
      currentFilter = 'all';
      
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
      updateFilterButtons();
      showToast(`📚 Tüm ${QUESTIONS.length} soru gösteriliyor!`, "success");
      return;
    }
    
    const hasMarked = MARKED.size > 0;
    if (!hasMarked) {
      showToast("❌ Henüz işaretli soru yok!", "error");
      return;
    }
    
    // Filter questions to show only marked ones
    const markedQuestions = [];
    MARKED.forEach((markedIdx) => {
      if (ORIGINAL[markedIdx]) {
        markedQuestions.push(ORIGINAL[markedIdx]);
      }
    });
    
    if (markedQuestions.length === 0) {
      showToast("❌ İşaretli soru bulunamadı!", "error");
      return;
    }
    
    QUESTIONS = markedQuestions;
    currentFilter = 'marked';
    
    // Reset quiz state for filtered questions
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
    updateFilterButtons();
    showToast(`📌 ${QUESTIONS.length} işaretli soru gösteriliyor!`, "success");
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

  // Search - case insensitive
  $("#search")?.addEventListener("input", (e) => {
    const term = e.target.value.trim();
    if (!term) {
      QUESTIONS = [...ORIGINAL];
      currentFilter = 'all';
    } else {
      const searchTerm = term.toLowerCase();
      QUESTIONS = ORIGINAL.filter((q) => 
        q.q.toLowerCase().includes(searchTerm) ||
        q.options.some(option => option.toLowerCase().includes(searchTerm)) ||
        (typeof q.answer === 'string' ? q.answer.toLowerCase().includes(searchTerm) : 
         typeof q.answer === 'number' && q.options[q.answer] ? q.options[q.answer].toLowerCase().includes(searchTerm) : false)
      );
      currentFilter = 'search';
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

  // Multiplayer toggle button
  $("#multiplayerToggle")?.addEventListener("click", () => {
    if (typeof showMultiplayerPanel === 'function') {
      showMultiplayerPanel();
    } else {
      console.warn('Multiplayer functions not loaded yet');
      showToast("🎮 Multiplayer modu açılıyor...", "success");
      setTimeout(() => {
        if (typeof showMultiplayerPanel === 'function') {
          showMultiplayerPanel();
        }
      }, 100);
    }
  });

  // Modal close
  $("#modalCancel")?.addEventListener("click", () => {
    $("#modal").classList.remove("show");
  });

  // Tools menu functionality
  $("#toolsMenuBtn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const menu = $("#toolsMenu");
    if (menu) {
      const isVisible = menu.style.display === "block";
      menu.style.display = isVisible ? "none" : "block";
    }
  });

  // Close tools menu when clicking outside
  document.addEventListener("click", (e) => {
    const menu = $("#toolsMenu");
    const menuBtn = $("#toolsMenuBtn");
    const noteBox = $("#noteBox");
    
    // Don't close if clicking on menu, menu button, or note box
    if (menu && menuBtn && 
        !menu.contains(e.target) && 
        !menuBtn.contains(e.target) && 
        (!noteBox || e.target !== noteBox)) {
      menu.style.display = "none";
    }
  });

  // Close tools menu when clicking any menu item (except note box)
  setTimeout(() => {
    const toolsMenuItems = document.querySelectorAll(".tools-menu-item");
    if (!toolsMenuItems.length) {
      console.warn('No tools menu items found');
      return;
    }
    toolsMenuItems.forEach(item => {
      item.addEventListener("click", (e) => {
        const menu = $("#toolsMenu");
        const noteBox = $("#noteBox");
        
        // Don't close menu if clicking on note box or its container
        if (noteBox && (e.target === noteBox || item.contains(noteBox))) {
          return; // Keep menu open
        }
        
        if (menu) menu.style.display = "none";
      });
    });
  }, 100);

  // Prevent tools menu elements from closing the menu
  setTimeout(() => {
    const noteBox = $("#noteBox");
    const search = $("#search");
    const jumpTo = $("#jumpTo");
    const jumpBtn = $("#jumpBtn");
    const mode = $("#mode");
    const editQuestionBtn = $("#editQuestionBtn");
    const addQuestionBtn = $("#addQuestionBtn");
    
    if (noteBox) {
      noteBox.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
      
      noteBox.addEventListener("focus", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
    }
    
    if (search) {
      search.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
      
      search.addEventListener("focus", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
      
      search.addEventListener("input", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
    }
    
    if (jumpTo) {
      jumpTo.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
      
      jumpTo.addEventListener("focus", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
      
      jumpTo.addEventListener("keydown", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
    }
    
    if (jumpBtn) {
      jumpBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
    }
    
    if (mode) {
      mode.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
      
      mode.addEventListener("change", (e) => {
        e.stopPropagation(); // Prevent event bubbling
      });
    }
    
    // Note: editQuestionBtn and addQuestionBtn will close menu intentionally
    // so they don't need stopPropagation
  }, 200);

  // Finish exam button
  $("#finishExamBtn")?.addEventListener("click", () => {
    showModal("Sınavı Bitir", "Sınavı bitirmek istediğinizden emin misiniz?", () => {
      endQuiz();
    });
  });

  // Edit Question button
  $("#editQuestionBtn")?.addEventListener("click", () => {
    if (QUESTIONS.length === 0) {
      showToast("❌ Düzenlenecek soru yok!", "error");
      return;
    }
    
    // Call the admin.js function
    if (typeof loadQuestionForEdit === 'function') {
      loadQuestionForEdit();
      // Close the tools menu
      const menu = $("#toolsMenu");
      if (menu) menu.style.display = "none";
    } else {
      showToast("❌ Admin paneli yüklenmemiş!", "error");
    }
  });

  // Add Question button  
  $("#addQuestionBtn")?.addEventListener("click", () => {
    // Open admin panel and clear form for new question
    const panel = $("#adminPanel");
    if (panel) {
      panel.classList.add("open");
      
      // Clear admin form if function exists
      if (typeof clearAdminForm === 'function') {
        clearAdminForm();
      }
      
      // Close the tools menu
      const menu = $("#toolsMenu");
      if (menu) menu.style.display = "none";
      
      showToast("📝 Yeni soru ekleme modunda!", "success");
    } else {
      showToast("❌ Admin paneli bulunamadı!", "error");
    }
  });

  // Tab system functionality
  const toolsTabs = document.querySelectorAll(".tools-tab");
  const tabContents = document.querySelectorAll(".tools-tab-content");
  
  if (!toolsTabs.length || !tabContents.length) {
    console.warn('Tools tabs or tab contents not found');
    return;
  }
  
  toolsTabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent menu from closing
      
      const targetTab = tab.getAttribute("data-tab");
      
      // Remove active class from all tabs and contents
      toolsTabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(content => content.classList.remove("active"));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add("active");
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (!targetContent) {
        console.warn(`Tab content not found: tab-${targetTab}`);
        return;
      }
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });

  // Initialize
  updateTimer();
  render();
  updateFilterButtons();
  
  // Initialize background system
  initBackgroundSystem();

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
      const choicesContainer = $("#choices");
      if (!choicesContainer) {
        console.warn('Choices container not found');
        return;
      }
      const btns = choicesContainer.querySelectorAll(".choice");
      if (btns[n] && !btns[n].classList.contains("disabled")) {
        btns[n].click();
        e.preventDefault();
      }
    }
  });

  // Initialize JSON management system
  initJsonManagementSystem();
});

// ==============================================
// JSON MANAGEMENT SYSTEM
// ==============================================

// Global variables for JSON management
let currentUserName = 'defaultUser'; // This should be set from auth system
let jsonHistory = [];
let sessionStartTime = Date.now();
let autoSaveInterval;
let jsonManagementInitialized = false;

// Initialize JSON Management System
function initJsonManagementSystem() {
  // Prevent double initialization
  if (jsonManagementInitialized) {
    return;
  }
  
  // Get current user (from auth system if available)
  if (typeof currentAuthUser !== 'undefined' && currentAuthUser?.email) {
    currentUserName = currentAuthUser.email.split('@')[0];
  }
  
  // Load user's JSON data
  loadUserJsonData();
  
  // Setup event listeners
  setupJsonEventListeners();
  
  // Start auto-save system
  startAutoSaveSystem();
  
  // Initialize progress tracking
  updateJsonStatus();
  
  // Mark as initialized
  jsonManagementInitialized = true;
}

// Setup event listeners for JSON management
function setupJsonEventListeners() {
  // Main action buttons
  const loadJsonBtn = document.getElementById('loadJsonBtn');
  const jsonLibraryBtn = document.getElementById('jsonLibraryBtn');
  const mergeJsonBtn = document.getElementById('mergeJsonBtn');
  const resetToDefaultBtn = document.getElementById('resetToDefaultBtn');
  const clearAllJsonBtn = document.getElementById('clearAllJsonBtn');
  
  // Check if essential elements exist
  if (!loadJsonBtn || !jsonLibraryBtn) {
    console.warn('Essential JSON control buttons not found');
    return;
  }
  
  // Remove existing listeners to prevent duplicates
  if (loadJsonBtn) {
    loadJsonBtn.removeEventListener('click', handleJsonLoad);
    loadJsonBtn.addEventListener('click', handleJsonLoad);
  } else {
    console.error('loadJsonBtn element not found during setup!');
  }
  if (jsonLibraryBtn) {
    jsonLibraryBtn.removeEventListener('click', showJsonLibrary);
    jsonLibraryBtn.addEventListener('click', showJsonLibrary);
  }
  if (mergeJsonBtn) {
    mergeJsonBtn.removeEventListener('click', handleJsonMerge);
    mergeJsonBtn.addEventListener('click', handleJsonMerge);
  }
  if (resetToDefaultBtn) {
    resetToDefaultBtn.removeEventListener('click', resetToDefaultQuestions);
    resetToDefaultBtn.addEventListener('click', resetToDefaultQuestions);
  }
  if (clearAllJsonBtn) {
    clearAllJsonBtn.removeEventListener('click', clearAllJsonData);
    clearAllJsonBtn.addEventListener('click', clearAllJsonData);
  }
  
  // File inputs
  const jsonFile = document.getElementById('jsonFile');
  const mergeJsonFile = document.getElementById('mergeJsonFile');
  
  if (!jsonFile) {
    console.warn('JSON file input not found');
    return;
  }
  
  if (jsonFile) {
    jsonFile.removeEventListener('change', processJsonFile);
    jsonFile.addEventListener('change', processJsonFile);
  }
  if (mergeJsonFile) {
    mergeJsonFile.removeEventListener('change', processMergeJsonFile);
    mergeJsonFile.addEventListener('change', processMergeJsonFile);
  }
  
  // Modal close buttons
  const closeLibraryModal = document.getElementById('closeLibraryModal');
  const closeMergeModal = document.getElementById('closeMergeModal');
  const closeDetailModal = document.getElementById('closeDetailModal');
  
  if (closeLibraryModal) {
    closeLibraryModal.removeEventListener('click', hideJsonLibrary);
    closeLibraryModal.addEventListener('click', hideJsonLibrary);
  }
  if (closeMergeModal) {
    closeMergeModal.removeEventListener('click', hideMergeModal);
    closeMergeModal.addEventListener('click', hideMergeModal);
  }
  if (closeDetailModal) {
    closeDetailModal.removeEventListener('click', hideDetailModal);
    closeDetailModal.addEventListener('click', hideDetailModal);
  }
  
  // Modal action buttons
  const addNewJsonBtn = document.getElementById('addNewJsonBtn');
  const confirmMergeBtn = document.getElementById('confirmMergeBtn');
  const replaceJsonBtn = document.getElementById('replaceJsonBtn');
  const cancelMergeBtn = document.getElementById('cancelMergeBtn');
  
  if (addNewJsonBtn) addNewJsonBtn.addEventListener('click', () => document.getElementById('jsonFile').click());
  if (confirmMergeBtn) confirmMergeBtn.addEventListener('click', confirmJsonMerge);
  if (replaceJsonBtn) replaceJsonBtn.addEventListener('click', replaceWithNewJson);
  if (cancelMergeBtn) cancelMergeBtn.addEventListener('click', hideMergeModal);
  
  // Quick switch container for swipe support
  const quickSwitchContainer = document.getElementById('quickSwitchContainer');
  if (quickSwitchContainer) {
    setupSwipeNavigation(quickSwitchContainer);
  }
}

// Load user's JSON data from localStorage
function loadUserJsonData() {
  const userJsonKey = `userQuestions_${currentUserName}`;
  const userJsonInfoKey = `userJsonInfo_${currentUserName}`;
  const userHistoryKey = `jsonHistory_${currentUserName}`;
  
  const savedQuestions = localStorage.getItem(userJsonKey);
  const savedInfo = localStorage.getItem(userJsonInfoKey);
  const savedHistory = localStorage.getItem(userHistoryKey);
  
  if (savedQuestions && savedInfo) {
    try {
      QUESTIONS = JSON.parse(savedQuestions);
      const jsonInfo = JSON.parse(savedInfo);
      updateJsonStatusDisplay(jsonInfo);
      showJsonStatus();
    } catch (error) {
      console.error('Error loading user JSON:', error);
      resetToDefaultQuestions();
    }
  }
  
  if (savedHistory) {
    try {
      jsonHistory = JSON.parse(savedHistory);
      updateQuickSwitch();
    } catch (error) {
      console.error('Error loading JSON history:', error);
      jsonHistory = [];
    }
  }
}

// Save user's JSON data to localStorage
function saveUserJsonData(fileName, questions) {
  const userJsonKey = `userQuestions_${currentUserName}`;
  const userJsonInfoKey = `userJsonInfo_${currentUserName}`;
  const userHistoryKey = `jsonHistory_${currentUserName}`;
  
  const jsonInfo = {
    fileName: fileName || 'custom_questions.json',
    loadDate: new Date().toLocaleString('tr-TR'),
    questionsCount: questions.length,
    loadTimestamp: Date.now()
  };
  
  // Save main data
  localStorage.setItem(userJsonKey, JSON.stringify(questions));
  localStorage.setItem(userJsonInfoKey, JSON.stringify(jsonInfo));
  
  // Update history
  addToJsonHistory(jsonInfo, questions);
  localStorage.setItem(userHistoryKey, JSON.stringify(jsonHistory));
  
  // Update UI
  updateJsonStatusDisplay(jsonInfo);
  showJsonStatus();
  updateQuickSwitch();
}

// Add to JSON history for quick switching
function addToJsonHistory(info, questions) {
  // Remove if already exists
  jsonHistory = jsonHistory.filter(item => item.fileName !== info.fileName);
  
  // Add to beginning
  jsonHistory.unshift({
    fileName: info.fileName,
    questionsCount: questions.length,
    loadDate: info.loadDate,
    loadTimestamp: info.loadTimestamp,
    questions: questions // Store all questions for fast switching
  });
  
  // Keep only last 5
  jsonHistory = jsonHistory.slice(0, 5);
}

// Update JSON status display
function updateJsonStatusDisplay(info) {
  const activeJsonName = document.getElementById('activeJsonName');
  const jsonProgress = document.getElementById('jsonProgress');
  const sessionTime = document.getElementById('sessionTime');
  const successRate = document.getElementById('successRate');
  const lastSaved = document.getElementById('lastSaved');
  
  if (activeJsonName) {
    activeJsonName.textContent = `📄 ${info.fileName}`;
  }
  
  if (jsonProgress) {
    const completed = userAnswers.filter(answer => answer !== null).length;
    jsonProgress.textContent = `${completed}/${info.questionsCount} ✅`;
  }
  
  if (sessionTime) {
    const sessionMinutes = Math.floor((Date.now() - sessionStartTime) / 60000);
    sessionTime.textContent = `⏱ ${sessionMinutes} dk`;
  }
  
  if (successRate) {
    const totalAnswered = userAnswers.filter(answer => answer !== null).length;
    const correctAnswers = userAnswers.filter((answer, index) => 
      answer && QUESTIONS[index] && answer === QUESTIONS[index].answer
    ).length;
    const rate = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    successRate.textContent = `📊 %${rate}`;
  }
  
  if (lastSaved) {
    lastSaved.textContent = '💾 Az önce';
  }
}

// Show JSON status section
function showJsonStatus() {
  const activeJsonStatus = document.getElementById('activeJsonStatus');
  if (activeJsonStatus) {
    activeJsonStatus.style.display = 'block';
  }
}

// Hide JSON status section
function hideJsonStatus() {
  const activeJsonStatus = document.getElementById('activeJsonStatus');
  if (activeJsonStatus) {
    activeJsonStatus.style.display = 'none';
  }
}

// Update quick switch buttons
function updateQuickSwitch() {
  const quickSwitchContainer = document.getElementById('quickSwitchContainer');
  const jsonQuickSwitch = document.getElementById('jsonQuickSwitch');
  
  if (!quickSwitchContainer || !jsonQuickSwitch) return;
  
  if (jsonHistory.length <= 1) {
    jsonQuickSwitch.style.display = 'none';
    return;
  }
  
  quickSwitchContainer.innerHTML = '';
  jsonHistory.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = 'json-quick-btn';
    button.textContent = item.fileName.replace('.json', '').substring(0, 8);
    button.title = `${item.fileName} - ${item.questionsCount} soru`;
    button.dataset.index = index;
    
    if (index === 0) {
      button.classList.add('active');
    }
    
    button.addEventListener('click', () => switchToJsonFromHistory(index));
    quickSwitchContainer.appendChild(button);
  });
  
  jsonQuickSwitch.style.display = 'block';
}

// Switch to JSON from history
function switchToJsonFromHistory(historyIndex) {
  if (!jsonHistory[historyIndex]) return;
  
  const historyItem = jsonHistory[historyIndex];
  
  // Load full questions from localStorage or use preview
  const userJsonKey = `userQuestions_${currentUserName}`;
  let questions = localStorage.getItem(userJsonKey);
  
  if (questions) {
    try {
      questions = JSON.parse(questions);
    } catch (error) {
      questions = historyItem.questions || [];
    }
  } else {
    questions = historyItem.questions || [];
  }
  
  // Set as current questions
  QUESTIONS = questions;
  
  // Update UI
  const jsonInfo = {
    fileName: historyItem.fileName,
    loadDate: historyItem.loadDate,
    questionsCount: questions.length,
    loadTimestamp: historyItem.loadTimestamp
  };
  
  updateJsonStatusDisplay(jsonInfo);
  
  // Move to front of history
  jsonHistory.splice(historyIndex, 1);
  jsonHistory.unshift(historyItem);
  updateQuickSwitch();
  
  // Reset quiz state
  resetQuiz();
  
  showToast(`📄 ${historyItem.fileName} yüklendi!`, 'success');
}

// Handle JSON file loading
function handleJsonLoad() {
  const jsonFile = document.getElementById('jsonFile');
  
  if (jsonFile) {
    jsonFile.click();
    
    // Show user feedback
    if (typeof showToast === 'function') {
      showToast('📁 Dosya seçici açılıyor...', 'info');
    }
  } else {
    console.error('jsonFile element not found!');
    if (typeof showToast === 'function') {
      showToast('❌ Dosya seçici bulunamadı', 'error');
    }
  }
}

// Process JSON file
function processJsonFile(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    console.error('Invalid file type:', file.type, file.name);
    if (typeof showToast === 'function') {
      showToast('❌ Sadece JSON dosyaları yüklenebilir!', 'error');
    }
    return;
  }
  
  
  const reader = new FileReader();
  reader.onload = function(e) {
    if (!e || !e.target || !e.target.result) {
      showToast('❌ Dosya okuma hatası!', 'error');
      return;
    }
    
    try {
      const newQuestions = JSON.parse(e.target.result);
      
      if (!Array.isArray(newQuestions)) {
        throw new Error('JSON dosyası bir dizi olmalıdır');
      }
      
      // Validate question format
      for (let i = 0; i < Math.min(newQuestions.length, 3); i++) {
        const q = newQuestions[i];
        if (!q || typeof q !== 'object' || !q.q || !q.options || typeof q.answer === 'undefined') {
          throw new Error('Geçersiz soru formatı. Her soru q, options ve answer alanlarına sahip olmalıdır.');
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          throw new Error('Her soruda en az 2 seçenek olmalıdır.');
        }
      }
      
      // Save and load new questions
      QUESTIONS = newQuestions;
      saveUserJsonData(file.name, newQuestions);
      
      // Reset quiz state
      resetQuiz();
      
      showToast(`✅ ${file.name} başarıyla yüklendi! (${newQuestions.length} soru)`, 'success');
      
    } catch (error) {
      console.error('JSON load error:', error);
      showToast('❌ JSON dosyası okunamadı: ' + error.message, 'error');
    }
  };
  
  reader.readAsText(file);
  
  // Reset file input
  event.target.value = '';
}

// Reset quiz state
function resetQuiz() {
  try {
    idx = 0;
    score = 0;
    userAnswers = Array(QUESTIONS.length).fill(null);
    STATS = QUESTIONS.map(() => ({attempts: 0, correct: 0, wrong: 0}));
    sessionStartTime = Date.now();
    
    // Use render() which handles all UI updates
    render();
    
    // Update JSON status if available
    if (typeof updateJsonStatus === 'function') {
      updateJsonStatus();
    }
    
  } catch (error) {
    console.error('Error resetting quiz:', error);
    
    // Safe showToast call
    if (typeof showToast === 'function') {
      showToast('❌ Quiz sıfırlanırken hata oluştu', 'error');
    }
    
    // Fallback: basic reset
    try {
      idx = 0;
      score = 0;
      if (QUESTIONS.length > 0) {
        userAnswers = Array(QUESTIONS.length).fill(null);
        STATS = QUESTIONS.map(() => ({attempts: 0, correct: 0, wrong: 0}));
      }
    } catch (fallbackError) {
      console.error('Fallback reset also failed:', fallbackError);
    }
  }
}

// Update JSON status (called periodically)
function updateJsonStatus() {
  const userJsonInfoKey = `userJsonInfo_${currentUserName}`;
  const savedInfo = localStorage.getItem(userJsonInfoKey);
  
  if (savedInfo) {
    try {
      const jsonInfo = JSON.parse(savedInfo);
      updateJsonStatusDisplay(jsonInfo);
    } catch (error) {
      console.error('Error updating JSON status:', error);
    }
  }
}

// Auto-save system
function startAutoSaveSystem() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
  
  autoSaveInterval = setInterval(() => {
    saveUserProgress();
    updateJsonStatus();
  }, 30000); // Save every 30 seconds
}

// Save user progress
function saveUserProgress() {
  const userProgressKey = `progress_${currentUserName}`;
  const progress = {
    currentIndex: idx,
    answers: userAnswers,
    score: score,
    sessionTime: Date.now() - sessionStartTime,
    timestamp: Date.now(),
    questionsCount: QUESTIONS.length
  };
  
  localStorage.setItem(userProgressKey, JSON.stringify(progress));
  
  // Update last saved indicator
  const lastSaved = document.getElementById('lastSaved');
  if (lastSaved) {
    lastSaved.textContent = '💾 Az önce';
  }
}

// Reset to default questions
function resetToDefaultQuestions() {
  if (confirm('Varsayılan sorulara dönmek istediğinizden emin misiniz? Mevcut ilerleme kaydedilecek.')) {
    // Save current progress if custom JSON is loaded
    if (QUESTIONS !== ORIGINAL) {
      saveUserProgress();
    }
    
    // Reset to original questions
    QUESTIONS = [...ORIGINAL];
    
    // Clear custom JSON data but keep progress
    const userJsonKey = `userQuestions_${currentUserName}`;
    const userJsonInfoKey = `userJsonInfo_${currentUserName}`;
    localStorage.removeItem(userJsonKey);
    localStorage.removeItem(userJsonInfoKey);
    
    // Reset UI
    hideJsonStatus();
    const jsonQuickSwitch = document.getElementById('jsonQuickSwitch');
    if (jsonQuickSwitch) jsonQuickSwitch.style.display = 'none';
    
    // Reset quiz
    resetQuiz();
    
    showToast('✅ Varsayılan sorulara dönüldü!', 'success');
  }
}

// Clear all JSON data
function clearAllJsonData() {
  if (confirm('TÜM JSON verilerini ve ilerlemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
    // Clear all user data
    const keys = Object.keys(localStorage).filter(key => key.includes(currentUserName));
    keys.forEach(key => localStorage.removeItem(key));
    
    // Reset to original
    QUESTIONS = [...ORIGINAL];
    jsonHistory = [];
    
    // Reset UI
    hideJsonStatus();
    const jsonQuickSwitch = document.getElementById('jsonQuickSwitch');
    if (jsonQuickSwitch) jsonQuickSwitch.style.display = 'none';
    
    // Reset quiz
    resetQuiz();
    
    showToast('🗑️ Tüm JSON verileri temizlendi!', 'success');
  }
}

// ==============================================
// JSON LIBRARY MODAL FUNCTIONS
// ==============================================

// Show JSON Library Modal
function showJsonLibrary() {
  const modal = document.getElementById('jsonLibraryModal');
  const libraryList = document.getElementById('jsonLibraryList');
  
  if (!modal || !libraryList) return;
  
  // Populate library list
  populateJsonLibrary();
  
  // Show modal
  modal.style.display = 'flex';
}

// Hide JSON Library Modal
function hideJsonLibrary() {
  const modal = document.getElementById('jsonLibraryModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Populate JSON Library List
function populateJsonLibrary() {
  const libraryList = document.getElementById('jsonLibraryList');
  if (!libraryList) return;
  
  libraryList.innerHTML = '';
  
  if (jsonHistory.length === 0) {
    libraryList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--muted);">
        <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
        <p>Henüz JSON yüklenmiş değil</p>
        <p style="font-size: 12px;">JSON dosyası yükleyerek başlayabilirsiniz</p>
      </div>
    `;
    return;
  }
  
  jsonHistory.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'json-library-item';
    if (index === 0) itemDiv.classList.add('active');
    
    itemDiv.innerHTML = `
      <div class="json-item-info">
        <div class="json-item-name">📄 ${item.fileName}</div>
        <div class="json-item-details">
          📊 ${item.questionsCount} soru • 📅 ${item.loadDate}
        </div>
      </div>
      <div class="json-item-actions">
        <button class="json-action-btn" onclick="loadJsonFromLibrary(${index})" title="Yükle">📥</button>
        <button class="json-action-btn" onclick="showJsonDetails(${index})" title="Detaylar">📊</button>
        <button class="json-action-btn danger" onclick="deleteJsonFromLibrary(${index})" title="Sil">🗑️</button>
      </div>
    `;
    
    libraryList.appendChild(itemDiv);
  });
}

// Load JSON from library
function loadJsonFromLibrary(index) {
  switchToJsonFromHistory(index);
  hideJsonLibrary();
}

// Show JSON details
function showJsonDetails(index) {
  const item = jsonHistory[index];
  if (!item) return;
  
  const modal = document.getElementById('jsonDetailModal');
  const title = document.getElementById('jsonDetailTitle');
  const content = document.getElementById('jsonDetailContent');
  
  if (!modal || !title || !content) return;
  
  title.textContent = `📊 ${item.fileName}`;
  
  // Calculate some statistics
  const questions = item.questions || [];
  const categories = {};
  const difficulties = {};
  
  questions.forEach(q => {
    if (q.category) {
      categories[q.category] = (categories[q.category] || 0) + 1;
    }
    if (q.difficulty) {
      difficulties[q.difficulty] = (difficulties[q.difficulty] || 0) + 1;
    }
  });
  
  content.innerHTML = `
    <div style="display: grid; gap: 16px;">
      <div style="background: var(--opt-bg); padding: 12px; border-radius: 8px;">
        <strong>📋 Genel Bilgiler</strong>
        <div style="margin-top: 8px; font-size: 14px; color: var(--muted);">
          <div>📄 Dosya: ${item.fileName}</div>
          <div>📊 Soru Sayısı: ${item.questionsCount}</div>
          <div>📅 Yüklenme: ${item.loadDate}</div>
        </div>
      </div>
      
      <div style="background: var(--opt-bg); padding: 12px; border-radius: 8px;">
        <strong>📚 Kategoriler</strong>
        <div style="margin-top: 8px; display: flex; flex-wrap: gap: 4px;">
          ${Object.keys(categories).length > 0 
            ? Object.entries(categories).map(([cat, count]) => 
                `<span style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 12px; font-size: 12px;">${cat} (${count})</span>`
              ).join('')
            : '<span style="color: var(--muted); font-size: 12px;">Kategori bilgisi yok</span>'
          }
        </div>
      </div>
      
      <div style="background: var(--opt-bg); padding: 12px; border-radius: 8px;">
        <strong>🎯 Zorluk Seviyeleri</strong>
        <div style="margin-top: 8px; display: flex; flex-wrap: gap: 4px;">
          ${Object.keys(difficulties).length > 0 
            ? Object.entries(difficulties).map(([diff, count]) => 
                `<span style="background: ${diff === 'easy' ? '#10b981' : diff === 'medium' ? '#f59e0b' : '#ef4444'}; color: white; padding: 2px 6px; border-radius: 12px; font-size: 12px;">${diff} (${count})</span>`
              ).join('')
            : '<span style="color: var(--muted); font-size: 12px;">Zorluk bilgisi yok</span>'
          }
        </div>
      </div>
    </div>
  `;
  
  // Setup detail modal buttons
  const loadDetailJsonBtn = document.getElementById('loadDetailJsonBtn');
  const deleteDetailJsonBtn = document.getElementById('deleteDetailJsonBtn');
  
  if (loadDetailJsonBtn) {
    loadDetailJsonBtn.onclick = () => {
      loadJsonFromLibrary(index);
      hideDetailModal();
      hideJsonLibrary();
    };
  }
  
  if (deleteDetailJsonBtn) {
    deleteDetailJsonBtn.onclick = () => {
      deleteJsonFromLibrary(index);
      hideDetailModal();
    };
  }
  
  modal.classList.remove('display-none');
  modal.style.display = 'flex';
}

// Hide JSON detail modal
function hideDetailModal() {
  const modal = document.getElementById('jsonDetailModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.add('display-none');
  }
}

// Delete JSON from library
function deleteJsonFromLibrary(index) {
  const item = jsonHistory[index];
  if (!item) return;
  
  if (confirm(`"${item.fileName}" dosyasını kütüphaneden silmek istediğinizden emin misiniz?`)) {
    // Remove from history
    jsonHistory.splice(index, 1);
    
    // Update localStorage
    const userHistoryKey = `jsonHistory_${currentUserName}`;
    localStorage.setItem(userHistoryKey, JSON.stringify(jsonHistory));
    
    // Remove individual file storage
    const userJsonKey = `userQuestions_${currentUserName}_${item.fileName}`;
    localStorage.removeItem(userJsonKey);
    
    // Update UI
    updateQuickSwitch();
    populateJsonLibrary();
    
    showToast(`🗑️ ${item.fileName} silindi!`, 'success');
    
    // If this was the active JSON, reset to default
    if (index === 0 && jsonHistory.length === 0) {
      resetToDefaultQuestions();
    }
  }
}

// ==============================================
// JSON MERGE FUNCTIONALITY
// ==============================================

let pendingMergeData = null;

// Handle JSON merge
function handleJsonMerge() {
  const mergeJsonFile = document.getElementById('mergeJsonFile');
  if (mergeJsonFile) {
    mergeJsonFile.click();
  }
}

// Process merge JSON file
function processMergeJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    showToast('❌ Sadece JSON dosyaları yüklenebilir!', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const newQuestions = JSON.parse(e.target.result);
      
      if (!Array.isArray(newQuestions)) {
        throw new Error('JSON dosyası bir dizi olmalıdır');
      }
      
      // Validate question format
      for (let i = 0; i < Math.min(newQuestions.length, 3); i++) {
        const q = newQuestions[i];
        if (!q.q || !q.options || !q.answer) {
          throw new Error('Geçersiz soru formatı');
        }
      }
      
      // Store for merge analysis
      pendingMergeData = {
        fileName: file.name,
        questions: newQuestions
      };
      
      // Show merge modal
      showMergeModal();
      
    } catch (error) {
      console.error('Merge JSON error:', error);
      showToast('❌ JSON dosyası okunamadı: ' + error.message, 'error');
    }
  };
  
  reader.readAsText(file);
  event.target.value = '';
}

// Show merge modal
function showMergeModal() {
  if (!pendingMergeData) return;
  
  const modal = document.getElementById('mergeJsonModal');
  const analysis = document.getElementById('mergeAnalysis');
  
  if (!modal || !analysis) return;
  
  // Analyze merge
  const currentCount = QUESTIONS.length;
  const newCount = pendingMergeData.questions.length;
  const totalCount = currentCount + newCount;
  
  // Find new categories
  const currentCategories = new Set(QUESTIONS.map(q => q.category).filter(Boolean));
  const newCategories = new Set(pendingMergeData.questions.map(q => q.category).filter(Boolean));
  const addedCategories = [...newCategories].filter(cat => !currentCategories.has(cat));
  
  // Find duplicates (simple check by question text)
  const currentQuestions = new Set(QUESTIONS.map(q => q.q.toLowerCase()));
  const duplicates = pendingMergeData.questions.filter(q => 
    currentQuestions.has(q.q.toLowerCase())
  ).length;
  
  analysis.innerHTML = `
    <div style="display: grid; gap: 12px;">
      <div style="display: flex; justify-content: space-between;">
        <span>📊 Mevcut sorular:</span>
        <strong>${currentCount}</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>➕ Yeni sorular:</span>
        <strong>${newCount}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; color: var(--primary);">
        <span>📈 Toplam olacak:</span>
        <strong>${totalCount}</strong>
      </div>
      ${addedCategories.length > 0 ? `
        <div>
          <span>🆕 Yeni kategoriler:</span>
          <div style="margin-top: 4px;">
            ${addedCategories.map(cat => 
              `<span style="background: var(--green); color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; margin-right: 4px;">${cat}</span>`
            ).join('')}
          </div>
        </div>
      ` : ''}
      ${duplicates > 0 ? `
        <div style="color: var(--yellow);">
          <span>⚠️ Olası tekrar sorular: ${duplicates}</span>
        </div>
      ` : ''}
    </div>
  `;
  
  modal.style.display = 'flex';
}

// Hide merge modal
function hideMergeModal() {
  const modal = document.getElementById('mergeJsonModal');
  if (modal) {
    modal.style.display = 'none';
  }
  // Clear pending data after a short delay to prevent race conditions
  setTimeout(() => {
    pendingMergeData = null;
  }, 100);
}

// Confirm JSON merge
function confirmJsonMerge() {
  if (!pendingMergeData) return;
  
  // Store pending data before modal closes
  const pendingQuestions = pendingMergeData.questions;
  const pendingCount = pendingQuestions.length;
  
  // Merge questions
  const mergedQuestions = [...QUESTIONS, ...pendingQuestions];
  
  // Save merged data
  const mergedFileName = `merged_${Date.now()}.json`;
  QUESTIONS = mergedQuestions;
  saveUserJsonData(mergedFileName, mergedQuestions);
  
  // Reset quiz
  resetQuiz();
  
  hideMergeModal();
  showToast(`✅ ${pendingCount} soru birleştirildi! (Toplam: ${mergedQuestions.length})`, 'success');
}

// Replace with new JSON
function replaceWithNewJson() {
  if (!pendingMergeData) return;
  
  // Replace questions
  QUESTIONS = pendingMergeData.questions;
  saveUserJsonData(pendingMergeData.fileName, pendingMergeData.questions);
  
  // Reset quiz
  resetQuiz();
  
  hideMergeModal();
  showToast(`🔄 ${pendingMergeData.fileName} ile değiştirildi! (${pendingMergeData.questions.length} soru)`, 'success');
}

// ==============================================
// SWIPE NAVIGATION
// ==============================================

// Setup swipe navigation for quick switch
function setupSwipeNavigation(container) {
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  
  // Touch events
  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: true });
  container.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // Mouse events for desktop
  container.addEventListener('mousedown', handleMouseDown);
  container.addEventListener('mousemove', handleMouseMove);
  container.addEventListener('mouseup', handleMouseUp);
  container.addEventListener('mouseleave', handleMouseUp);
  
  let isMouseDown = false;
  
  function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }
  
  function handleTouchMove(e) {
    if (!startX || !startY) return;
    
    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;
  }
  
  function handleTouchEnd() {
    if (!startX || !startY) return;
    
    const diffX = startX - currentX;
    const diffY = startY - currentY;
    
    // Check if horizontal swipe is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe left - next JSON
        swipeToNextJson();
      } else {
        // Swipe right - previous JSON
        swipeToPrevJson();
      }
    }
    
    // Reset
    startX = 0;
    startY = 0;
    currentX = 0;
    currentY = 0;
  }
  
  function handleMouseDown(e) {
    isMouseDown = true;
    startX = e.clientX;
    startY = e.clientY;
    e.preventDefault();
  }
  
  function handleMouseMove(e) {
    if (!isMouseDown) return;
    
    currentX = e.clientX;
    currentY = e.clientY;
  }
  
  function handleMouseUp() {
    if (!isMouseDown) return;
    
    const diffX = startX - currentX;
    const diffY = startY - currentY;
    
    // Check if horizontal swipe is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      if (diffX > 0) {
        swipeToNextJson();
      } else {
        swipeToPrevJson();
      }
    }
    
    isMouseDown = false;
    startX = 0;
    startY = 0;
    currentX = 0;
    currentY = 0;
  }
}

// Swipe to next JSON
function swipeToNextJson() {
  if (jsonHistory.length <= 1) return;
  
  const currentActive = document.querySelector('.json-quick-btn.active');
  if (!currentActive) return;
  
  const currentIndex = parseInt(currentActive.dataset.index) || 0;
  const nextIndex = (currentIndex + 1) % jsonHistory.length;
  
  switchToJsonFromHistory(nextIndex);
  showToast(`👈 ${jsonHistory[nextIndex].fileName}`, 'info');
}

// Swipe to previous JSON
function swipeToPrevJson() {
  if (jsonHistory.length <= 1) return;
  
  const currentActive = document.querySelector('.json-quick-btn.active');
  if (!currentActive) return;
  
  const currentIndex = parseInt(currentActive.dataset.index) || 0;
  const prevIndex = currentIndex === 0 ? jsonHistory.length - 1 : currentIndex - 1;
  
  switchToJsonFromHistory(prevIndex);
  showToast(`👉 ${jsonHistory[prevIndex].fileName}`, 'info');
}

// Modal click outside to close (initialize only once)
let outsideClickListenerAdded = false;

function initModalOutsideClickListener() {
  if (outsideClickListenerAdded) return;
  
  document.addEventListener('click', function(e) {
    // Close JSON modals when clicking outside
    const modals = ['jsonLibraryModal', 'mergeJsonModal', 'jsonDetailModal'];
    
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal && modal.style.display !== 'none' && e.target === modal) {
        // Prevent race conditions by checking if modal is actually visible
        if (modal.offsetParent !== null) {
          modal.style.display = 'none';
          if (modalId === 'mergeJsonModal') {
            pendingMergeData = null;
          }
        }
      }
    });
  });
  
  outsideClickListenerAdded = true;
}

// Event listener cleanup utility
const EventListenerManager = {
  listeners: new Map(),
  
  add(element, event, handler, options = {}) {
    if (!element) return;
    
    const key = `${element.tagName || 'window'}_${event}_${handler.name || 'anonymous'}`;
    
    // Remove existing listener if present
    if (this.listeners.has(key)) {
      const oldListener = this.listeners.get(key);
      element.removeEventListener(event, oldListener.handler, oldListener.options);
    }
    
    // Add new listener
    element.addEventListener(event, handler, options);
    this.listeners.set(key, { element, event, handler, options });
  },
  
  remove(element, event, handler, options = {}) {
    if (!element) return;
    
    const key = `${element.tagName || 'window'}_${event}_${handler.name || 'anonymous'}`;
    element.removeEventListener(event, handler, options);
    this.listeners.delete(key);
  },
  
  removeAll() {
    this.listeners.forEach(({ element, event, handler, options }) => {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler, options);
      }
    });
    this.listeners.clear();
  },
  
  getCount() {
    return this.listeners.size;
  }
};

// Initialize outside click listener with cleanup
initModalOutsideClickListener();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  EventListenerManager.removeAll();
});

// Performance monitoring utility
const PerformanceMonitor = {
  marks: new Map(),
  measures: new Map(),
  
  mark(name) {
    const timestamp = performance.now();
    this.marks.set(name, timestamp);
    if (performance.mark) {
      performance.mark(name);
    }
    return timestamp;
  },
  
  measure(name, startMark, endMark) {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    
    if (startTime && endTime) {
      const duration = endTime - startTime;
      this.measures.set(name, { startTime, endTime, duration });
      
      if (performance.measure) {
        try {
          performance.measure(name, startMark, endMark);
        } catch (e) {
          console.warn(`Performance measure failed: ${e.message}`);
        }
      }
      
      return duration;
    }
    return null;
  },
  
  getReport() {
    const report = {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures),
      listeners: EventListenerManager.getCount(),
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB'
      } : 'Not available'
    };
    
    return report;
  }
};

// Add performance monitoring to critical functions
PerformanceMonitor.mark('app-init-start');

// Export performance utilities for debugging
if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
  window.EventListenerManager = EventListenerManager;
  window.elementCache = elementCache;
  
  // Debug commands
  window.debugQuiz = () => {
    console.log('Performance Report:', PerformanceMonitor.getReport());
    console.log('Event Listeners:', EventListenerManager.getCount());
    console.log('Element Cache:', elementCache.size, 'items');
  };
}

// Mark app initialization complete
document.addEventListener('DOMContentLoaded', () => {
  PerformanceMonitor.mark('app-init-end');
  PerformanceMonitor.measure('app-init-duration', 'app-init-start', 'app-init-end');
  
  const initTime = PerformanceMonitor.measure('app-init-duration', 'app-init-start', 'app-init-end');
  if (initTime > 1000) {
    console.warn(`Slow app initialization: ${Math.round(initTime)}ms`);
  }
});
