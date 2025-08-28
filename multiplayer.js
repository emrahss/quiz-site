/* Multiplayer Quiz System */

// Global multiplayer variables
let currentRoom = null;
let currentPlayer = null;
let gameState = null;
let multiplayerUnsubscribers = [];
let isMultiplayerMode = false;

// Multiplayer Quiz Class
class MultiplayerQuiz {
  constructor() {
    this.rooms = new Map();
    this.currentRoomListener = null;
    this.gameListener = null;
  }

  // Initialize multiplayer system
  async init() {
    if (!db || !currentAuthUser) {
      showToast("❌ Firebase bağlantısı gerekli!", "error");
      return false;
    }
    
    this.attachEventListeners();
    await this.loadAvailableRooms();
    return true;
  }

  // Attach event listeners
  attachEventListeners() {
    $("#createRoomBtn")?.addEventListener("click", () => this.createRoom());
    $("#joinRoomBtn")?.addEventListener("click", () => this.joinRoom());
    $("#refreshRoomsBtn")?.addEventListener("click", () => this.loadAvailableRooms());
    $("#startGameBtn")?.addEventListener("click", () => this.startGame());
    $("#leaveRoomBtn")?.addEventListener("click", () => this.leaveRoom());
    $("#backToNormalBtn")?.addEventListener("click", () => this.exitMultiplayerMode());
    
    // Main toggle button
    $("#multiplayerToggle")?.addEventListener("click", () => this.showMultiplayerPanel());
  }

  // Show multiplayer panel
  showMultiplayerPanel() {
    const panel = $("#multiplayerPanel");
    const card = $(".card");
    
    if (panel) {
      panel.style.display = "block";
    } else {
      console.error("❌ Multiplayer panel elementi bulunamadı");
    }
    
    if (card) {
      card.style.display = "none";
    }
    
    isMultiplayerMode = true;
    this.init();
  }

  // Hide multiplayer panel
  hideMultiplayerPanel() {
    const panel = $("#multiplayerPanel");
    const card = $(".card");
    
    if (panel) panel.style.display = "none";
    if (card) card.style.display = "block";
    
    isMultiplayerMode = false;
    this.cleanup();
  }

  // Create new room
  async createRoom() {
    const roomName = $("#roomName")?.value?.trim();
    const playerName = $("#playerName")?.value?.trim();
    const roomPassword = $("#roomPassword")?.value?.trim();
    const isPrivate = $("#isPrivate")?.checked || false;
    const maxParticipants = parseInt($("#maxParticipants")?.value) || 8;

    if (!roomName || !playerName) {
      showToast("❌ Oda adı ve oyuncu adı gerekli!", "error");
      return;
    }

    // Validate password if room is private
    if (isPrivate && roomPassword && (roomPassword.length < 4 || roomPassword.length > 20)) {
      showToast("❌ Şifre 4-20 karakter arasında olmalıdır!", "error");
      return;
    }

    // Validate max participants
    if (maxParticipants < 2 || maxParticipants > 50) {
      showToast("❌ Katılımcı sayısı 2-50 arasında olmalıdır!", "error");
      return;
    }

    try {
      // Generate unique room code
      const roomCode = this.generateRoomCode();
      
      const roomData = {
        name: roomName,
        code: roomCode,
        ownerId: currentAuthUser.uid,
        host: currentAuthUser.uid, // backward compatibility
        hostName: playerName,
        visibility: isPrivate ? 'private' : 'public',
        maxParticipants: maxParticipants,
        participants: [currentAuthUser.uid],
        players: {
          [currentAuthUser.uid]: {
            name: playerName,
            email: currentAuthUser.email,
            score: 0,
            answered: false,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
          }
        },
        status: 'waiting', // waiting, playing, finished
        currentQuestion: 0,
        totalQuestions: 10,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        gameSettings: {
          timePerQuestion: 30,
          questionsSource: 'current' // current loaded questions
        }
      };

      // Add password if room is private
      if (isPrivate && roomPassword) {
        roomData.password = roomPassword;
      }

      const roomRef = await db.collection('multiplayerRooms').add(roomData);
      
      currentRoom = roomRef.id;
      currentPlayer = {
        id: currentAuthUser.uid,
        name: playerName,
        isHost: true
      };

      await this.joinRoomUI(roomRef.id, roomData);
      showToast(`✅ Oda "${roomName}" oluşturuldu! Kod: ${roomCode}`, "success");
      
    } catch (error) {
      console.error("Room creation error:", error);
      if (error.code === 'permission-denied') {
        showToast("⚠️ Firebase Rules güncelleme gerekli! firestore-security-rules.txt dosyasına bakın.", "error");
      } else {
        showToast("❌ Oda oluşturulamadı!", "error");
      }
    }
  }

  // Join existing room
  async joinRoom() {
    const roomCode = $("#roomName")?.value?.trim().toUpperCase();
    const playerName = $("#playerName")?.value?.trim();
    const roomPassword = $("#roomPassword")?.value?.trim();

    if (!roomCode || !playerName) {
      showToast("❌ Oda kodu ve oyuncu adı gerekli!", "error");
      return;
    }

    try {
      const roomsSnapshot = await db.collection('multiplayerRooms')
        .where('code', '==', roomCode)
        .where('status', '==', 'waiting')
        .get();

      if (roomsSnapshot.empty) {
        showToast("❌ Oda bulunamadı veya oyun başlamış!", "error");
        return;
      }

      const roomDoc = roomsSnapshot.docs[0];
      const roomData = roomDoc.data();
      
      // Check if room requires password
      if (roomData.password && roomData.password !== roomPassword) {
        showToast("❌ Yanlış şifre! Bu oda şifreli.", "error");
        return;
      }
      
      // Check if player already in room
      if (roomData.players[currentAuthUser.uid]) {
        showToast("⚠️ Bu odaya zaten katılmışsınız!", "warning");
        return;
      }

      // Check room capacity
      const currentParticipantCount = Object.keys(roomData.players || {}).length;
      if (currentParticipantCount >= (roomData.maxParticipants || 8)) {
        showToast("❌ Oda dolu! Maksimum katılımcı sayısına ulaşıldı.", "error");
        return;
      }

      // Add player to room
      const updatedPlayers = {
        ...roomData.players,
        [currentAuthUser.uid]: {
          name: playerName,
          email: currentAuthUser.email,
          score: 0,
          answered: false,
          joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        }
      };

      const updatedParticipants = [...(roomData.participants || []), currentAuthUser.uid];

      await roomDoc.ref.update({
        players: updatedPlayers,
        participants: updatedParticipants
      });

      currentRoom = roomDoc.id;
      currentPlayer = {
        id: currentAuthUser.uid,
        name: playerName,
        isHost: false
      };

      await this.joinRoomUI(roomDoc.id, { ...roomData, players: updatedPlayers });
      
      const roomTypeText = roomData.password ? "🔒 Şifreli" : "🌍 Açık";
      showToast(`✅ "${roomData.name}" odasına katıldınız! ${roomTypeText}`, "success");

    } catch (error) {
      console.error("Room join error:", error);
      if (error.code === 'permission-denied') {
        showToast("⚠️ Firebase Rules güncelleme gerekli! firestore-security-rules.txt dosyasına bakın.", "error");
      } else {
        showToast("❌ Odaya katılınamadı!", "error");
      }
    }
  }

  // Join room UI
  async joinRoomUI(roomId, roomData) {
    // Hide setup, show room
    const roomSetup = $("#roomSetup");
    const availableRooms = $("#availableRooms");
    const gameRoom = $("#gameRoom");
    const roomTitle = $("#roomTitle");
    const roomCode = $("#roomCode");
    const startGameBtn = $("#startGameBtn");

    if (roomSetup) roomSetup.style.display = "none";
    if (availableRooms) availableRooms.style.display = "none";
    if (gameRoom) gameRoom.style.display = "block";
    
    if (roomTitle) roomTitle.textContent = `🏠 Oda: ${roomData.name}`;
    if (roomCode) roomCode.textContent = `Kod: ${roomData.code}`;
    
    // Show start button only for host
    if (startGameBtn && currentPlayer.isHost) {
      startGameBtn.style.display = "block";
    }

    // Start listening to room updates
    this.listenToRoom(roomId);
  }

  // Listen to room updates
  listenToRoom(roomId) {
    if (this.currentRoomListener) {
      this.currentRoomListener();
    }

    this.currentRoomListener = db.collection('multiplayerRooms')
      .doc(roomId)
      .onSnapshot((doc) => {
        if (!doc.exists) {
          showToast("❌ Oda silinmiş!", "error");
          this.exitMultiplayerMode();
          return;
        }

        const roomData = doc.data();
        this.updatePlayersDisplay(roomData.players);
        
        // Handle game state changes
        if (roomData.status === 'playing' && gameState?.status !== 'playing') {
          this.startGameUI();
        }
      });
  }

  // Update players display
  updatePlayersDisplay(players) {
    const playersList = $("#playersList");
    if (!playersList) return;

    const playersArray = Object.entries(players).map(([uid, data]) => ({
      uid,
      ...data
    }));

    let html = '';
    playersArray.forEach((player, index) => {
      const isHost = index === 0; // First player is host
      const hostBadge = isHost ? ' 👑' : '';
      const onlineStatus = '🟢'; // Always online in this context
      
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--line);">
          <div>
            <strong>${player.name}${hostBadge}</strong>
            <div style="font-size: 0.8em; color: var(--muted);">${player.email}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>${onlineStatus}</span>
            <span style="background: var(--primary); color: white; padding: 2px 6px; border-radius: 12px; font-size: 0.8em;">
              ${player.score || 0} puan
            </span>
          </div>
        </div>
      `;
    });

    playersList.innerHTML = html || '<p style="text-align: center; color: var(--muted);">Oyuncu yok</p>';
  }

  // Start game
  async startGame() {
    if (!currentRoom || !currentPlayer.isHost) {
      showToast("❌ Sadece oda sahibi oyunu başlatabilir!", "error");
      return;
    }

    if (QUESTIONS.length < 5) {
      showToast("❌ En az 5 soru yüklü olmalı!", "error");
      return;
    }

    try {
      // Prepare game questions
      const gameQuestions = shuffle([...QUESTIONS]).slice(0, 10);
      
      await db.collection('multiplayerRooms').doc(currentRoom).update({
        status: 'playing',
        currentQuestion: 0,
        gameStartedAt: firebase.firestore.FieldValue.serverTimestamp(),
        questions: gameQuestions.map(q => ({
          q: q.q,
          options: q.options,
          answer: q.answer,
          category: q.category || 'Genel',
          difficulty: q.difficulty || 'easy'
        }))
      });

      showToast("🚀 Oyun başlıyor!", "success");

    } catch (error) {
      console.error("Start game error:", error);
      showToast("❌ Oyun başlatılamadı!", "error");
    }
  }

  // Start game UI
  startGameUI() {
    gameState = { status: 'playing', currentQuestion: 0 };
    
    const gameStatus = $("#gameStatus");
    if (gameStatus) gameStatus.style.display = "block";
    
    // Start question timer and load first question
    this.loadMultiplayerQuestion(0);
  }

  // Load multiplayer question
  async loadMultiplayerQuestion(questionIndex) {
    try {
      const roomDoc = await db.collection('multiplayerRooms').doc(currentRoom).get();
      const roomData = roomDoc.data();
      
      if (!roomData || !roomData.questions || questionIndex >= roomData.questions.length) {
        this.endMultiplayerGame();
        return;
      }

      const question = roomData.questions[questionIndex];
      
      // Update UI with question
      const questionEl = $("#question");
      const choicesEl = $("#choices");
      const currentQuestionEl = $("#currentQuestion");
      
      if (questionEl) questionEl.textContent = question.q;
      if (currentQuestionEl) currentQuestionEl.textContent = `📋 Soru ${questionIndex + 1}/${roomData.questions.length}`;
      
      if (choicesEl) {
        choicesEl.innerHTML = '';
        question.options.forEach((option, index) => {
          const btn = document.createElement("button");
          btn.className = "choice";
          btn.innerHTML = `<span class="badge">${letter(index)}</span><span class="label">${option}</span>`;
          btn.addEventListener("click", () => this.submitAnswer(questionIndex, option));
          choicesEl.appendChild(btn);
        });
      }

      // Start question timer
      this.startQuestionTimer(30); // 30 seconds per question

    } catch (error) {
      console.error("Load question error:", error);
      showToast("❌ Soru yüklenemedi!", "error");
    }
  }

  // Submit answer
  async submitAnswer(questionIndex, selectedAnswer) {
    if (!currentRoom || !currentPlayer) return;

    try {
      const roomRef = db.collection('multiplayerRooms').doc(currentRoom);
      const answerRef = roomRef.collection('answers').doc(`${currentPlayer.id}_${questionIndex}`);
      
      await answerRef.set({
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        questionIndex,
        answer: selectedAnswer,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Disable choices
      const choicesContainer = $("#choices");
      if (!choicesContainer) {
        console.warn('Choices container not found in multiplayer');
        return;
      }
      const choices = choicesContainer.querySelectorAll(".choice");
      choices?.forEach(choice => {
        choice.classList.add("disabled");
        choice.style.pointerEvents = "none";
      });

      showToast("✅ Cevabınız kaydedildi!", "success");

    } catch (error) {
      console.error("Submit answer error:", error);
      showToast("❌ Cevap kaydedilemedi!", "error");
    }
  }

  // Start question timer
  startQuestionTimer(seconds) {
    const gameTimer = $("#gameTimer");
    let timeLeft = seconds;

    const timerInterval = setInterval(() => {
      if (gameTimer) {
        const minutes = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        gameTimer.textContent = `⏱️ ${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }

      timeLeft--;
      
      if (timeLeft < 0) {
        clearInterval(timerInterval);
        this.timeUp();
      }
    }, 1000);
  }

  // Time up
  timeUp() {
    showToast("⏰ Süre doldu!", "warning");
    // Move to next question or end game
    // This would be handled by the host
  }

  // End multiplayer game
  endMultiplayerGame() {
    showToast("🎉 Multiplayer quiz tamamlandı!", "success");
    // Show results, cleanup, etc.
  }

  // Leave room
  async leaveRoom() {
    if (!currentRoom || !currentPlayer) return;

    try {
      const roomRef = db.collection('multiplayerRooms').doc(currentRoom);
      
      if (currentPlayer.isHost) {
        // If host leaves, delete room
        await roomRef.delete();
        showToast("🏠 Oda kapatıldı", "info");
      } else {
        // Remove player from room
        const roomDoc = await roomRef.get();
        const roomData = roomDoc.data();
        
        if (roomData && roomData.players) {
          delete roomData.players[currentPlayer.id];
          await roomRef.update({ players: roomData.players });
        }
        
        showToast("🚪 Odadan çıktınız", "info");
      }
      
      this.exitMultiplayerMode();

    } catch (error) {
      console.error("Leave room error:", error);
      showToast("❌ Odadan çıkılamadı!", "error");
    }
  }

  // Exit multiplayer mode
  exitMultiplayerMode() {
    this.cleanup();
    this.hideMultiplayerPanel();
    
    // Reset mode selector
    const modeSelect = $("#mode");
    if (modeSelect) modeSelect.value = "normal";
    
    showToast("⬅️ Normal moda dönüldü", "info");
  }

  // Load available rooms
  async loadAvailableRooms() {
    const roomsList = $("#roomsList");
    if (!roomsList) return;

    try {
      const roomsSnapshot = await db.collection('multiplayerRooms')
        .where('status', '==', 'waiting')
        .limit(10)
        .get();

      if (roomsSnapshot.empty) {
        this.showDemoRooms();
        return;
      }

      let html = '';
      roomsSnapshot.forEach((doc) => {
        const room = doc.data();
        const playerCount = Object.keys(room.players || {}).length;
        const maxPlayers = 8; // Maximum players per room
        
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid var(--line); cursor: pointer;" onclick="multiplayerQuiz.quickJoin('${room.code}')">
            <div>
              <strong>${room.name}</strong>
              <div style="font-size: 0.8em; color: var(--muted);">Host: ${room.hostName}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="chip" style="font-size: 0.7em; padding: 2px 6px;">👥 ${playerCount}/${maxPlayers}</span>
              <span class="chip" style="font-size: 0.7em; padding: 2px 6px;">🔑 ${room.code}</span>
            </div>
          </div>
        `;
      });

      roomsList.innerHTML = html;

    } catch (error) {
      console.error("Load rooms error:", error);
      this.showDemoRooms();
    }
  }

  // Show demo rooms when Firestore access fails
  showDemoRooms() {
    const roomsList = $("#roomsList");
    if (!roomsList) return;

    roomsList.innerHTML = `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
        <p style="color: #92400e; font-size: 0.9em; margin: 0;">
          <strong>⚠️ Firebase Rules Güncelleme Gerekli</strong><br>
          Multiplayer özelliği için Firebase Firestore Rules'u güncellemeniz gerekiyor.
        </p>
      </div>
      <div style="padding: 8px; border: 1px dashed var(--line); border-radius: 8px; text-align: center;">
        <p style="color: var(--muted); margin: 0;">🏗️ Demo Odaları</p>
        <div style="margin-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; background: var(--card); border-radius: 6px; margin: 4px 0;">
            <div>
              <strong>Quiz Odası #1</strong>
              <div style="font-size: 0.8em; color: var(--muted);">Host: Demo User</div>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="chip" style="font-size: 0.7em; padding: 2px 4px;">👥 2/4</span>
              <span class="chip" style="font-size: 0.7em; padding: 2px 4px;">🔑 DEMO1</span>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px; background: var(--card); border-radius: 6px; margin: 4px 0;">
            <div>
              <strong>Hızlı Quiz</strong>
              <div style="font-size: 0.8em; color: var(--muted);">Host: Test Host</div>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span class="chip" style="font-size: 0.7em; padding: 2px 4px;">👥 1/6</span>
              <span class="chip" style="font-size: 0.7em; padding: 2px 4px;">🔑 DEMO2</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Quick join room
  async quickJoin(roomCode) {
    const roomName = $("#roomName");
    if (roomName) roomName.value = roomCode;
    
    // Auto-fill player name if empty
    const playerName = $("#playerName");
    if (playerName && !playerName.value.trim()) {
      playerName.value = currentAuthUser.email.split('@')[0];
    }
  }

  // Generate unique room code
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Removed confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Cleanup
  cleanup() {
    if (this.currentRoomListener) {
      this.currentRoomListener();
      this.currentRoomListener = null;
    }
    
    if (this.gameListener) {
      this.gameListener();
      this.gameListener = null;
    }
    
    multiplayerUnsubscribers.forEach(unsubscribe => unsubscribe());
    multiplayerUnsubscribers = [];
    
    currentRoom = null;
    currentPlayer = null;
    gameState = null;
  }
}

// Global multiplayer instance
const multiplayerQuiz = new MultiplayerQuiz();

// Global function for script.js compatibility
window.showMultiplayerPanel = function() {
  multiplayerQuiz.showMultiplayerPanel();
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MultiplayerQuiz, multiplayerQuiz };
}