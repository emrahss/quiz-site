/* Admin Panel Functionality */

// Use global $ function from script.js or define fallback
const adminQuery = (s) => {
  // Try to use global $ function first
  if (typeof $ === 'function') {
    return $(s);
  }
  
  // Fallback implementation
  const element = document.querySelector(s);
  if (!element) {
    console.warn(`Element not found: ${s}`);
  }
  return element;
};

// Use adminQuery instead of $ to avoid conflicts
const $admin = adminQuery;

// Admin state
let editingIndex = -1;

// Add option to admin form
function addOption() {
  const container = $admin("#adminOptions");
  if (!container) {
    console.warn('Admin options container not found');
    return;
  }
  const optionCount = container.querySelectorAll(".option-input").length;

  if (optionCount >= 6) {
    showToast("❌ Maksimum 6 seçenek eklenebilir!", "error");
    return;
  }

  const div = document.createElement("div");
  div.className = "option-input";
  safeInnerHTML(div, `
    <input type="text" class="form-input" placeholder="${letter(optionCount)} Seçenek ${optionCount + 1}" data-option="${optionCount}">
    <button class="btn danger" onclick="removeOption(this)">❌</button>
  `);

  container.appendChild(div);
  updateAnswerOptions();
}

// Remove option from admin form
function removeOption(btn) {
  if (!btn || !btn.parentElement) {
    console.warn('Invalid button element in removeOption');
    return;
  }
  
  const container = $admin("#adminOptions");
  if (!container) {
    console.warn('Admin options container not found');
    return;
  }
  const optionInputs = container.querySelectorAll(".option-input");

  if (optionInputs.length <= 2) {
    showToast("❌ En az 2 seçenek olmalı!", "error");
    return;
  }

  btn.parentElement.remove();

  // Reindex options
  const remainingInputs = container.querySelectorAll(".option-input input");
  remainingInputs.forEach((input, index) => {
    input.setAttribute("data-option", index);
    input.placeholder = `${letter(index)} Seçenek ${index + 1}`;
  });

  updateAnswerOptions();
}

// Update answer dropdown options
function updateAnswerOptions() {
  const answerSelect = $admin("#adminAnswer");
  const adminOptions = $admin("#adminOptions");
  
  if (!answerSelect) {
    console.warn('Admin answer select not found');
    return;
  }
  
  if (!adminOptions) {
    console.warn('Admin options container not found');
    return;
  }
  
  const optionInputs = adminOptions.querySelectorAll(".option-input input");

  safeInnerHTML(answerSelect, "");
  optionInputs.forEach((input, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${letter(index)} Seçeneği`;
    answerSelect.appendChild(option);
  });
}

// Clear admin form
function clearAdminForm() {
  $admin("#adminQuestion").value = "";

  // Reset to 2 options
  const container = $admin("#adminOptions");
  safeInnerHTML(container, `
    <div class="option-input">
      <input type="text" class="form-input" placeholder="A) Seçenek 1" data-option="0">
      <button class="btn danger" onclick="removeOption(this)">❌</button>
    </div>
    <div class="option-input">
      <input type="text" class="form-input" placeholder="B) Seçenek 2" data-option="1">
      <button class="btn danger" onclick="removeOption(this)">❌</button>
    </div>
  `);

  updateAnswerOptions();
  editingIndex = -1;
  $admin("#addQuestion").style.display = "inline-block";
  $admin("#editQuestion").style.display = "none";
}

// Add new question
function addQuestion() {
  const adminQuestion = $admin("#adminQuestion");
  if (!adminQuestion) {
    showToast("❌ Admin form elementi bulunamadı!", "error");
    return;
  }
  
  const questionText = adminQuestion.value.trim();

  if (!questionText) {
    showToast("❌ Soru metni boş olamaz!", "error");
    return;
  }

  const adminOptions = $admin("#adminOptions");
  if (!adminOptions) {
    showToast("❌ Seçenekler konteynerı bulunamadı!", "error");
    return;
  }
  
  const optionInputs = adminOptions.querySelectorAll(".option-input input");
  const options = [];

  for (let input of optionInputs) {
    const value = input.value.trim();
    if (!value) {
      showToast("❌ Tüm seçenekler doldurulmalı!", "error");
      return;
    }
    options.push(value);
  }

  if (options.length < 2) {
    showToast("❌ En az 2 seçenek olmalı!", "error");
    return;
  }

  const adminAnswer = $admin("#adminAnswer");
  if (!adminAnswer) {
    showToast("❌ Cevap seçimi bulunamadı!", "error");
    return;
  }
  
  const answerIndex = parseInt(adminAnswer.value);

  const newQuestion = {
    q: questionText,
    options: options,
    answer: answerIndex,
    category: "Genel",
    difficulty: "easy",
    madde: null,
  };

  ORIGINAL.push(newQuestion);
  QUESTIONS = [...ORIGINAL];

  // Reset arrays
  userAnswers = Array(QUESTIONS.length).fill(null);
  STATS = QUESTIONS.map(() => ({ attempts: 0, correct: 0, wrong: 0 }));

  clearAdminForm();
  render();
  updateCategoryFilter();

  showToast("✅ Yeni soru eklendi!", "success");
}

// Edit existing question
function editQuestion() {
  if (editingIndex === -1) {
    showToast("❌ Düzenlenecek soru seçilmemiş!", "error");
    return;
  }
  
  const adminQuestion = $admin("#adminQuestion");
  if (!adminQuestion) {
    showToast("❌ Admin form elementi bulunamadı!", "error");
    return;
  }

  const questionText = adminQuestion.value.trim();

  if (!questionText) {
    showToast("❌ Soru metni boş olamaz!", "error");
    return;
  }

  const adminOptions = $admin("#adminOptions");
  if (!adminOptions) {
    showToast("❌ Seçenekler konteynerı bulunamadı!", "error");
    return;
  }
  
  const optionInputs = adminOptions.querySelectorAll(".option-input input");
  const options = [];

  for (let input of optionInputs) {
    const value = input.value.trim();
    if (!value) {
      showToast("❌ Tüm seçenekler doldurulmalı!", "error");
      return;
    }
    options.push(value);
  }

  const adminAnswer = $admin("#adminAnswer");
  if (!adminAnswer) {
    showToast("❌ Cevap seçimi bulunamadı!", "error");
    return;
  }
  
  const answerIndex = parseInt(adminAnswer.value);
  
  if (!ORIGINAL || !Array.isArray(ORIGINAL)) {
    showToast("❌ Soru dizisi bulunamadı!", "error");
    return;
  }

  ORIGINAL[editingIndex] = {
    q: questionText,
    options: options,
    answer: answerIndex,
    category: "Genel",
    difficulty: "easy",
    madde: null,
  };

  QUESTIONS = [...ORIGINAL];

  // Reset arrays
  userAnswers = Array(QUESTIONS.length).fill(null);
  STATS = QUESTIONS.map(() => ({ attempts: 0, correct: 0, wrong: 0 }));

  clearAdminForm();
  render();
  updateCategoryFilter();

  showToast("✅ Soru güncellendi!", "success");
}

// Delete current question
function deleteQuestion() {
  if (!QUESTIONS || !Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
    showToast("❌ Silinecek soru yok!", "error");
    return;
  }

  showModal(
    "Soru Silme",
    "Bu soruyu silmek istediğinizden emin misiniz?",
    () => {
      const currentQuestion = QUESTIONS[idx];
      const originalIndex = ORIGINAL.findIndex(
        (q) => q.q === currentQuestion.q && q.answer === currentQuestion.answer,
      );

      if (originalIndex !== -1) {
        ORIGINAL.splice(originalIndex, 1);
        QUESTIONS = [...ORIGINAL];

        // Adjust current index
        if (idx >= QUESTIONS.length) {
          idx = Math.max(0, QUESTIONS.length - 1);
        }

        // Reset arrays
        userAnswers = Array(QUESTIONS.length).fill(null);
        STATS = QUESTIONS.map(() => ({ attempts: 0, correct: 0, wrong: 0 }));

        render();
        updateCategoryFilter();
        showToast("✅ Soru silindi!", "success");
      }
    },
  );
}

// Load question into admin form for editing
function loadQuestionForEdit() {
  if (!QUESTIONS || !Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
    showToast("❌ Düzenlenecek soru yok!", "error");
    return;
  }
  
  if (typeof idx === 'undefined' || idx < 0 || idx >= QUESTIONS.length) {
    showToast("❌ Geçerli soru indexi bulunamadı!", "error");
    return;
  }

  const q = QUESTIONS[idx];
  if (!q || typeof q !== 'object') {
    showToast("❌ Soru verisi geçersiz!", "error");
    return;
  }
  if (!ORIGINAL || !Array.isArray(ORIGINAL)) {
    showToast("❌ Orijinal soru dizisi bulunamadı!", "error");
    return;
  }
  
  const originalIndex = ORIGINAL.findIndex(
    (orig) => orig && orig.q === q.q && orig.answer === q.answer,
  );

  if (originalIndex === -1) {
    showToast("❌ Soru orijinal listede bulunamadı!", "error");
    return;
  }

  editingIndex = originalIndex;

  const adminQuestion = $admin("#adminQuestion");
  if (!adminQuestion) {
    showToast("❌ Admin form elementi bulunamadı!", "error");
    return;
  }
  
  adminQuestion.value = q.q;

  // Clear and populate options
  const container = $admin("#adminOptions");
  if (!container) {
    showToast("❌ Seçenekler konteynerı bulunamadı!", "error");
    return;
  }
  
  if (!q.options || !Array.isArray(q.options)) {
    showToast("❌ Soru seçenekleri geçersiz!", "error");
    return;
  }
  
  safeInnerHTML(container, "");

  q.options.forEach((option, index) => {
    const div = document.createElement("div");
    div.className = "option-input";
    safeInnerHTML(div, `
      <input type="text" class="form-input" value="${option}" data-option="${index}">
      <button class="btn danger" onclick="removeOption(this)">❌</button>
    `);
    container.appendChild(div);
  });

  updateAnswerOptions();

  // Set correct answer
  const answerIndex = typeof q.answer === 'number' ? q.answer : q.options.findIndex((opt) => opt === q.answer);
  if (answerIndex !== -1) {
    const adminAnswer = $admin("#adminAnswer");
    if (adminAnswer) {
      adminAnswer.value = answerIndex;
    }
  }

  const addQuestionBtn = $admin("#addQuestion");
  const editQuestionBtn = $admin("#editQuestion");
  const adminPanel = $admin("#adminPanel");
  
  if (addQuestionBtn) addQuestionBtn.style.display = "none";
  if (editQuestionBtn) editQuestionBtn.style.display = "inline-block";
  
  // Open admin panel
  if (adminPanel) {
    adminPanel.classList.add("open");
  }

  showToast("📝 Soru düzenleme modunda!", "success");
}

// Export questions to JSON
function exportJson() {
  if (!ORIGINAL || !Array.isArray(ORIGINAL) || ORIGINAL.length === 0) {
    showToast("❌ Export edilecek soru yok!", "error");
    return;
  }

  const jsonData = JSON.stringify(ORIGINAL, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quiz_sorulari_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 100);

  showToast("📤 JSON dosyası indirildi!", "success");
}

// Delete current question (wrapper function)
function deleteCurrentQuestion() {
  return deleteQuestion();
}

// Export questions (wrapper function) 
function exportQuestions() {
  return exportJson();
}

// Clear all questions (wrapper function)
function clearAllQuestions() {
  return clearAll();
}

// Clear all questions
function clearAll() {
  showModal(
    "Tüm Soruları Sil",
    "TÜM sorular silinecek! Bu işlem geri alınamaz. Emin misiniz?",
    () => {
      ORIGINAL = [];
      QUESTIONS = [];
      userAnswers = [];
      STATS = [];
      MARKED.clear();
      NOTES = {};
      FAVS.clear();
      idx = 0;
      score = 0;

      clearAdminForm();
      render();
      updateCategoryFilter();

      showToast("🧹 Tüm sorular silindi!", "success");
    },
  );
}

// Update category filter dropdown
function updateCategoryFilter() {
  const categories = [...new Set(ORIGINAL.map((q) => q.category || "Genel"))];
  const categoryFilter = $admin("#categoryFilter");

  if (categoryFilter) {
    const currentValue = categoryFilter.value;
    safeInnerHTML(categoryFilter, '<option value="">🌐 Tüm Kategoriler</option>');
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = `📂 ${cat}`;
      categoryFilter.appendChild(option);
    });
    categoryFilter.value = currentValue;
  }
}

// Load JSON file
function loadJsonFile(file) {
  if (!file) {
    showToast("❌ Geçerli dosya bulunamadı!", "error");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (evt) => {
    if (!evt || !evt.target || !evt.target.result) {
      showToast("❌ Dosya okuma hatası!", "error");
      return;
    }
    
    try {
      const data = JSON.parse(evt.target.result);
      const questions = (Array.isArray(data) ? data : [])
        .map((item) => {
          let answerValue = item.answer;
          
          // Backward compatibility: metin tabanlı answer'ları index'e çevir
          if (typeof answerValue === "string" && Array.isArray(item.options)) {
            const index = item.options.findIndex(opt => opt === answerValue);
            answerValue = index !== -1 ? index : 0;
          } else if (typeof answerValue === "number") {
            answerValue = answerValue; // Zaten index formatında
          } else {
            answerValue = 0; // Default to first option
          }

          if (!item || typeof item !== 'object') {
            return null; // Skip invalid items
          }
          
          let obj = {
            q: String(item.q || ""),
            options: Array.isArray(item.options) ? item.options.slice(0) : [],
            answer: answerValue,
            category: item.category || "Genel",
            difficulty: item.difficulty || "easy",
          };

          if (typeof item.madde !== "undefined") {
            obj.madde = item.madde;
          }

          return obj;
        })
        .filter((x) => x && x.q && x.options && x.options.length > 0 && typeof x.answer === 'number');

      if (questions.length === 0) {
        showToast("❌ Geçerli soru bulunamadı!", "error");
        return;
      }

      ORIGINAL = questions;
      QUESTIONS = [...ORIGINAL];
      score = 0;
      idx = 0;
      userAnswers = Array(QUESTIONS.length).fill(null);
      STATS = QUESTIONS.map(() => ({ attempts: 0, correct: 0, wrong: 0 }));
      QUESTIONS.forEach((q) => {
        delete q._shuffled;
      });
      const endScreen = $admin("#endScreen");
      const card = $(".card");
      const nav = $(".nav");
      
      if (endScreen) endScreen.style.display = "none";
      if (card) card.classList.remove("hidden");
      if (nav) nav.classList.remove("hidden");

      render();
      updateCategoryFilter();

      showToast(`✅ ${questions.length} soru yüklendi!`, "success");
      
      // Dosya input'ını temizle ki bir dahaki yüklemede sorun çıkmasın
      const fileInput = $admin("#jsonFile");
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('JSON Parse Error:', err);
      showToast(`❌ JSON hatası: ${err.message || 'Dosya formatı geçersiz'}`, "error");
    }
  };
  reader.readAsText(file, "utf-8");
}

// Initialize admin panel event listeners - sadece bir kez
let adminInitialized = false;

function initializeAdminEventListeners() {
  if (adminInitialized) return;
  
  // Admin panel controls
  $admin("#addOption")?.addEventListener("click", addOption);
  $admin("#addQuestion")?.addEventListener("click", addQuestion);
  $admin("#editQuestion")?.addEventListener("click", editQuestion);
  $admin("#deleteQuestion")?.addEventListener("click", deleteQuestion);
  $admin("#exportJson")?.addEventListener("click", exportJson);
  $admin("#clearAll")?.addEventListener("click", clearAll);

  // Double-click question to edit functionality removed - moved to tools menu

  // JSON file loading handled by JSON Management System (script.js)
  // Removing duplicate event listener to prevent conflicts
  // const loadJsonButton = $admin("#loadJsonBtn");
  // const jsonFileInput = $admin("#jsonFile");
  
  // JSON Management System now handles all JSON loading functionality
  
  adminInitialized = true;
}

document.addEventListener("DOMContentLoaded", function () {
  initializeAdminEventListeners();

  // Category and difficulty filters - sadece varsa event listener ekle
  const categoryFilter = $admin("#categoryFilter");
  const difficultyFilter = $admin("#difficultyFilter");
  if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
  if (difficultyFilter) difficultyFilter.addEventListener("change", applyFilters);

  // Quiz mode changes
  $admin("#mode")?.addEventListener("change", (e) => {
    const mode = e.target.value;

    switch (mode) {
      case "normal":
        QUESTIONS = [...ORIGINAL];
        break;
      case "random":
        QUESTIONS = shuffle([...ORIGINAL]);
        break;
      case "hard":
        QUESTIONS = [...ORIGINAL].sort((a, b) => {
          const diffOrder = { easy: 1, medium: 2, hard: 3 };
          return (
            (diffOrder[b.difficulty] || 1) - (diffOrder[a.difficulty] || 1)
          );
        });
        break;
      case "countdown":
        let mins = prompt("Kaç dakika? (örn: 20)", "20");
        let totalSecs = Math.max(1, parseInt(mins, 10) || 20) * 60;
        startCountdown(totalSecs);
        break;
    }

    if (mode !== "countdown") {
      resetQuizState();
    }
  });

  // Export functions
  $admin("#exportCsvBtn")?.addEventListener("click", exportCSV);
  $admin("#exportPdfBtn")?.addEventListener("click", exportPDF);
});

// Apply filters function
function applyFilters() {
  if (!ORIGINAL || !Array.isArray(ORIGINAL)) {
    console.warn('ORIGINAL questions array not available');
    return;
  }
  
  let filtered = [...ORIGINAL];

  // Search filter
  const searchEl = $admin("#search");
  const searchTerm = searchEl ? searchEl.value.trim().toLowerCase() : '';
  if (searchTerm) {
    filtered = filtered.filter((q) => q.q.toLowerCase().includes(searchTerm));
  }

  // Category filter - sadece element varsa
  const categoryFilterEl = $admin("#categoryFilter");
  if (categoryFilterEl && categoryFilterEl.value) {
    const categoryFilter = categoryFilterEl.value;
    filtered = filtered.filter(
      (q) => (q.category || "Genel") === categoryFilter,
    );
  }

  // Difficulty filter - sadece element varsa
  const difficultyFilterEl = $admin("#difficultyFilter");
  if (difficultyFilterEl && difficultyFilterEl.value) {
    const difficultyFilter = difficultyFilterEl.value;
    filtered = filtered.filter(
      (q) => (q.difficulty || "easy") === difficultyFilter,
    );
  }

  QUESTIONS = filtered;
  resetQuizState();

  showToast(`🔍 ${QUESTIONS.length} soru bulundu`, "success");
}

// Reset quiz state
function resetQuizState() {
  score = 0;
  idx = 0;
  userAnswers = Array(QUESTIONS.length).fill(null);
  STATS = QUESTIONS.map(() => ({ attempts: 0, correct: 0, wrong: 0 }));
  QUESTIONS.forEach((q) => {
    delete q._shuffled;
  });
  
  const endScreen = $admin("#endScreen");
  const card = $(".card");
  const nav = $(".nav");
  
  if (endScreen) endScreen.style.display = "none";
  if (card) card.classList.remove("hidden");
  if (nav) nav.classList.remove("hidden");
  
  render();
}

// Export CSV function
function exportCSV() {
  if (!QUESTIONS || !Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
    showToast("❌ Export edilecek veri yok!", "error");
    return;
  }
  
  let rows = [
    [
      "#",
      "Soru",
      "Kategori",
      "Zorluk",
      "Seçtiğim",
      "Doğru Cevap",
      "Sonuç",
      "İşaretli",
      "Açıklama",
    ],
  ];

  for (let i = 0; i < QUESTIONS.length; i++) {
    let q = QUESTIONS[i];
    let chosenText = userAnswers[i];
    let chosen = chosenText || "";
    let correctText = typeof q.answer === 'number' ? q.options[q.answer] : q.answer;
    let correct = correctText || "";
    let sonuc = chosenText === null ? "Boş" : chosenText === correctText ? "Doğru" : "Yanlış";
    let marked = MARKED.has(i) ? "Evet" : "Hayır";
    let note = NOTES[i] || "";
    let category = q.category || "Genel";
    let difficulty = q.difficulty || "easy";

    rows.push([
      i + 1,
      q.q,
      category,
      difficulty,
      chosen,
      correct,
      sonuc,
      marked,
      note.replace(/\r?\n/g, " "),
    ]);
  }

  let csv = rows
    .map((r) => r.map((x) => `"${(x || "").replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  let blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = url;
  a.download = `quiz_sonuclari_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 100);

  showToast("📊 CSV dosyası indirildi!", "success");
}

// Export PDF function
function exportPDF() {
  if (!QUESTIONS || !Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
    showToast("❌ Export edilecek veri yok!", "error");
    return;
  }
  
  let w = safeWindowOpen("", "_blank");
  let html = `
    <html>
      <head>
        <title>Quiz Sonuçları</title>
        <style>
          body { font-family: sans-serif; font-size: 12px; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .stats { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; }
          .correct { color: #22c55e; font-weight: bold; }
          .wrong { color: #ef4444; font-weight: bold; }
          .empty { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 Quiz Sonuçları</h1>
          <p>Tarih: ${new Date().toLocaleDateString("tr-TR")}</p>
        </div>
        
        <div class="stats">
          <h3>📊 Özet</h3>
          <p><strong>Toplam Soru:</strong> ${QUESTIONS.length}</p>
          <p><strong>Doğru Cevap:</strong> ${score}</p>
          <p><strong>Yanlış Cevap:</strong> ${QUESTIONS.length - score}</p>
          <p><strong>Başarı Oranı:</strong> %${Math.round((score / QUESTIONS.length) * 100)}</p>
          <p><strong>Süre:</strong> ${fmtTime(elapsed)}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Soru</th>
              <th>Kategori</th>
              <th>Zorluk</th>
              <th>Seçtiğim</th>
              <th>Doğru Cevap</th>
              <th>Sonuç</th>
              <th>Açıklama</th>
            </tr>
          </thead>
          <tbody>
  `;

  for (let i = 0; i < QUESTIONS.length; i++) {
    let q = QUESTIONS[i];
    let chosenText = userAnswers[i];
    let chosen = chosenText || "";
    let correctText = typeof q.answer === 'number' ? q.options[q.answer] : q.answer;
    let correct = correctText || "";
    let sonuc =
      chosenText === null
        ? '<span class="empty">Boş</span>'
        : chosenText === correctText
          ? '<span class="correct">Doğru</span>'
          : '<span class="wrong">Yanlış</span>';
    let note = (NOTES[i] || "").replace(/\r?\n/g, " ");
    let category = q.category || "Genel";
    let difficulty = q.difficulty || "easy";

    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${q.q.replace(/</g, "&lt;")}</td>
        <td>${category}</td>
        <td>${difficulty}</td>
        <td>${chosen.replace(/</g, "&lt;")}</td>
        <td>${correct.replace(/</g, "&lt;")}</td>
        <td>${sonuc}</td>
        <td>${note.replace(/</g, "&lt;")}</td>
      </tr>
    `;
  }

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  if (w && w.document) {
    w.document.write(html);
  } else {
    console.warn('⚠️ Could not open new window for PDF export');
  }
  if (w && w.document) {
    w.document.close();
    setTimeout(() => {
      if (w) {
        w.print();
      }
    }, 500);
  }

  showToast("📄 PDF yazdırma hazırlandı!", "success");
}

// Countdown timer function
function startCountdown(secs) {
  if (typeof secs !== 'number' || secs <= 0) {
    console.warn('Invalid countdown seconds provided');
    return;
  }
  
  if (countdownId) clearInterval(countdownId);
  countdown = secs;
  updateCountdown();
  countdownId = setInterval(() => {
    if (countdown > 0) {
      countdown--;
      updateCountdown();
    } else {
      clearInterval(countdownId);
      countdownId = null;
      showToast("⏰ Süre doldu!", "error");
      endQuiz();
    }
  }, 1000);
}

function updateCountdown() {
  const timer = $admin("#timer");
  if (!timer) {
    console.warn('Timer element not found in updateCountdown');
    return;
  }
  
  if (typeof countdown !== 'number') {
    console.warn('Invalid countdown value');
    return;
  }
  
  timer.textContent = `⏳ ${fmtTime(countdown)}`;
}

// Initialize admin functions when DOM and scripts are loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for other scripts to load and $ function to be available
  setTimeout(() => {
    if (typeof $ === 'function') {
      initializeAdminEventListeners();
    } else {
      console.warn('❌ $ function not available in admin.js');
    }
  }, 200);
});
