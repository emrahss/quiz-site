/* Admin Panel Functionality */

// Admin state
let editingIndex = -1;

// Add option to admin form
function addOption() {
  const container = $("#adminOptions");
  const optionCount = container.querySelectorAll(".option-input").length;

  if (optionCount >= 6) {
    showToast("❌ Maksimum 6 seçenek eklenebilir!", "error");
    return;
  }

  const div = document.createElement("div");
  div.className = "option-input";
  div.innerHTML = `
    <input type="text" class="form-input" placeholder="${letter(optionCount)} Seçenek ${optionCount + 1}" data-option="${optionCount}">
    <button class="btn danger" onclick="removeOption(this)">❌</button>
  `;

  container.appendChild(div);
  updateAnswerOptions();
}

// Remove option from admin form
function removeOption(btn) {
  const container = $("#adminOptions");
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
  const answerSelect = $("#adminAnswer");
  const optionInputs = $("#adminOptions").querySelectorAll(
    ".option-input input",
  );

  answerSelect.innerHTML = "";
  optionInputs.forEach((input, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${letter(index)} Seçeneği`;
    answerSelect.appendChild(option);
  });
}

// Clear admin form
function clearAdminForm() {
  $("#adminQuestion").value = "";
  $("#adminCategory").value = "";
  $("#adminDifficulty").value = "easy";
  $("#adminMadde").value = "";

  // Reset to 2 options
  const container = $("#adminOptions");
  container.innerHTML = `
    <div class="option-input">
      <input type="text" class="form-input" placeholder="A) Seçenek 1" data-option="0">
      <button class="btn danger" onclick="removeOption(this)">❌</button>
    </div>
    <div class="option-input">
      <input type="text" class="form-input" placeholder="B) Seçenek 2" data-option="1">
      <button class="btn danger" onclick="removeOption(this)">❌</button>
    </div>
  `;

  updateAnswerOptions();
  editingIndex = -1;
  $("#addQuestion").style.display = "inline-block";
  $("#editQuestion").style.display = "none";
}

// Add new question
function addQuestion() {
  const questionText = $("#adminQuestion").value.trim();
  const category = $("#adminCategory").value.trim() || "Genel";
  const difficulty = $("#adminDifficulty").value;
  const madde = $("#adminMadde").value.trim();

  if (!questionText) {
    showToast("❌ Soru metni boş olamaz!", "error");
    return;
  }

  const optionInputs = $("#adminOptions").querySelectorAll(
    ".option-input input",
  );
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

  const answerIndex = parseInt($("#adminAnswer").value);
  const answer = options[answerIndex];

  const newQuestion = {
    q: questionText,
    options: options,
    answer: answer,
    category: category,
    difficulty: difficulty,
    madde: madde ? parseInt(madde) : null,
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
  if (editingIndex === -1) return;

  const questionText = $("#adminQuestion").value.trim();
  const category = $("#adminCategory").value.trim() || "Genel";
  const difficulty = $("#adminDifficulty").value;
  const madde = $("#adminMadde").value.trim();

  if (!questionText) {
    showToast("❌ Soru metni boş olamaz!", "error");
    return;
  }

  const optionInputs = $("#adminOptions").querySelectorAll(
    ".option-input input",
  );
  const options = [];

  for (let input of optionInputs) {
    const value = input.value.trim();
    if (!value) {
      showToast("❌ Tüm seçenekler doldurulmalı!", "error");
      return;
    }
    options.push(value);
  }

  const answerIndex = parseInt($("#adminAnswer").value);
  const answer = options[answerIndex];

  ORIGINAL[editingIndex] = {
    q: questionText,
    options: options,
    answer: answer,
    category: category,
    difficulty: difficulty,
    madde: madde ? parseInt(madde) : null,
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
  if (QUESTIONS.length === 0) {
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
  if (QUESTIONS.length === 0) return;

  const q = QUESTIONS[idx];
  const originalIndex = ORIGINAL.findIndex(
    (orig) => orig.q === q.q && orig.answer === q.answer,
  );

  if (originalIndex === -1) return;

  editingIndex = originalIndex;

  $("#adminQuestion").value = q.q;
  $("#adminCategory").value = q.category || "";
  $("#adminDifficulty").value = q.difficulty || "easy";
  $("#adminMadde").value = q.madde || "";

  // Clear and populate options
  const container = $("#adminOptions");
  container.innerHTML = "";

  q.options.forEach((option, index) => {
    const div = document.createElement("div");
    div.className = "option-input";
    div.innerHTML = `
      <input type="text" class="form-input" value="${option}" data-option="${index}">
      <button class="btn danger" onclick="removeOption(this)">❌</button>
    `;
    container.appendChild(div);
  });

  updateAnswerOptions();

  // Set correct answer
  const answerIndex = q.options.findIndex((opt) => opt === q.answer);
  if (answerIndex !== -1) {
    $("#adminAnswer").value = answerIndex;
  }

  $("#addQuestion").style.display = "none";
  $("#editQuestion").style.display = "inline-block";

  // Open admin panel
  $("#adminPanel").classList.add("open");

  showToast("📝 Soru düzenleme modunda!", "success");
}

// Export questions to JSON
function exportJson() {
  if (ORIGINAL.length === 0) {
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
  const categoryFilter = $("#categoryFilter");

  if (categoryFilter) {
    const currentValue = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="">🌐 Tüm Kategoriler</option>';
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
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      const questions = (Array.isArray(data) ? data : [])
        .map((item) => {
          let ansText = item.answer;
          if (typeof ansText === "number" && Array.isArray(item.options)) {
            ansText = item.options[ansText];
          }

          let obj = {
            q: String(item.q || ""),
            options: Array.isArray(item.options) ? item.options.slice(0) : [],
            answer: String(ansText || ""),
            category: item.category || "Genel",
            difficulty: item.difficulty || "easy",
          };

          if (typeof item.madde !== "undefined") {
            obj.madde = item.madde;
          }

          return obj;
        })
        .filter((x) => x.q && x.options.length > 0 && x.answer);

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
      $("#endScreen").style.display = "none";
      $(".card").classList.remove("hidden");
      $(".nav").classList.remove("hidden");

      render();
      updateCategoryFilter();

      showToast(`✅ ${questions.length} soru yüklendi!`, "success");
    } catch (err) {
      console.error(err);
      showToast("❌ JSON dosyası okunamadı!", "error");
    }
  };
  reader.readAsText(file, "utf-8");
}

// Initialize admin panel event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Admin panel controls
  $("#addOption")?.addEventListener("click", addOption);
  $("#addQuestion")?.addEventListener("click", addQuestion);
  $("#editQuestion")?.addEventListener("click", editQuestion);
  $("#deleteQuestion")?.addEventListener("click", deleteQuestion);
  $("#exportJson")?.addEventListener("click", exportJson);
  $("#clearAll")?.addEventListener("click", clearAll);

  // Double-click question to edit
  document.addEventListener("dblclick", (e) => {
    if (e.target.closest(".card") && QUESTIONS.length > 0) {
      loadQuestionForEdit();
    }
  });

  // JSON file loading
  $("#loadJsonBtn")?.addEventListener("click", () => {
    $("#jsonFile").click();
  });

  $("#jsonFile")?.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      loadJsonFile(file);
    }
  });

  // Category and difficulty filters
  $("#categoryFilter")?.addEventListener("change", applyFilters);
  $("#difficultyFilter")?.addEventListener("change", applyFilters);

  // Quiz mode changes
  $("#mode")?.addEventListener("change", (e) => {
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
  $("#exportCsvBtn")?.addEventListener("click", exportCSV);
  $("#exportPdfBtn")?.addEventListener("click", exportPDF);
});

// Apply filters function
function applyFilters() {
  let filtered = [...ORIGINAL];

  // Search filter
  const searchTerm = $("#search").value.trim().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter((q) => q.q.toLowerCase().includes(searchTerm));
  }

  // Category filter
  const categoryFilter = $("#categoryFilter").value;
  if (categoryFilter) {
    filtered = filtered.filter(
      (q) => (q.category || "Genel") === categoryFilter,
    );
  }

  // Difficulty filter
  const difficultyFilter = $("#difficultyFilter").value;
  if (difficultyFilter) {
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
  $("#endScreen").style.display = "none";
  $(".card").classList.remove("hidden");
  $(".nav").classList.remove("hidden");
  render();
}

// Export CSV function
function exportCSV() {
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
    let chosen = userAnswers[i] || "";
    let correct = q.answer;
    let sonuc = chosen === "" ? "Boş" : chosen === correct ? "Doğru" : "Yanlış";
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
  let w = window.open("", "_blank");
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
    let chosen = userAnswers[i] || "";
    let correct = q.answer;
    let sonuc =
      chosen === ""
        ? '<span class="empty">Boş</span>'
        : chosen === correct
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

  w.document.write(html);
  w.document.close();
  setTimeout(() => {
    w.print();
  }, 500);

  showToast("📄 PDF yazdırma hazırlandı!", "success");
}

// Countdown timer function
function startCountdown(secs) {
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
  const timer = $("#timer");
  if (timer) timer.textContent = `⏳ ${fmtTime(countdown)}`;
}
