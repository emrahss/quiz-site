# 🎯 Quiz Platformu

Modern ve interactive quiz uygulaması. Hem tek oyuncu hem çok oyunculu quiz deneyimi sunar.

## 🚀 Özellikler

### 📚 Tek Oyuncu
- ✅ Soru bankası yönetimi
- ✅ Kategori bazlı filtreleme  
- ✅ Skor takibi ve istatistikler
- ✅ Favori sorular sistemi
- ✅ Not alma özelliği
- ✅ Admin paneli

### 🎮 Çok Oyunculu (Professional)
- ✅ Real-time multiplayer quiz
- 🔐 Şifreli oda sistemi (4-20 karakter)
- 👥 Oda kapasitesi (2-50 oyuncu)
- ✅ Canlı chat sistemi (5 dakika düzenleme)
- ✅ Skor tablosu ve analytics
- 👑 Admin/Moderator sistemi
- 🏆 Turnuva yönetimi
- 🚫 Ban/Report moderation sistemi
- 📊 Detaylı kullanıcı istatistikleri

## 🛠️ Kurulum

### 1. Firebase Kurulumu (Opsiyonel)
Multiplayer özellikler için Firebase projesi gereklidir:

1. [Firebase Console](https://console.firebase.google.com/) üzerinde yeni proje oluşturun
2. Authentication ve Firestore aktifleştirin
3. `firebase-config.js` dosyasındaki `FIREBASE_CONFIG` nesnesini güncelleyin

### 2. Demo Modda Çalıştırma
Firebase kurulumu yapmadan demo modda çalışır:
- Demo kullanıcılar: 
  - `test@demo.com` / `test123`
  - `admin@demo.com` / `admin123`
  - `demo@test.com` / `demo123`

### 3. GitHub Pages Deployment
1. Repository'yi fork edin
2. Settings > Pages > Source: Deploy from a branch
3. Branch: main seçin
4. Save'e tıklayın

## 📁 Dosya Yapısı

```
├── index.html              # Ana quiz uygulaması
├── multiplayer-quiz.html   # Çok oyunculu quiz
├── quiz.html              # Quiz sayfası  
├── admin.js               # Admin panel mantığı
├── script.js              # Ana JavaScript dosyası
├── multiplayer.js         # Multiplayer sistem
├── firebase-config.js     # Firebase yapılandırması
├── security-utils.js      # Güvenlik araçları
└── styles.css             # CSS stilleri
```

## 🔧 Teknolojiler

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Firebase (Authentication + Firestore)
- **Real-time:** Firebase Firestore real-time listeners
- **Deployment:** GitHub Pages, Netlify uyumlu

## 🎯 Kullanım

### Tek Oyuncu Quiz
1. Ana sayfayı açın (`index.html`)
2. Demo kullanıcı ile giriş yapın
3. Quiz'e başlayın

### Çok Oyunculu Quiz  
1. `multiplayer-quiz.html` sayfasını açın
2. Kullanıcı adı girin
3. Oda oluşturun veya mevcut odaya katılın
4. Arkadaşlarınızla quiz çözün

## ⚙️ Firebase Security Rules

Professional güvenlik kuralları otomatik olarak yapılandırılmıştır:
- 🔐 Şifreli oda doğrulama
- 👑 Admin/Moderator yetkilendirme  
- 🚫 Ban/Report moderation
- 📊 Analytics güvenliği
- ⏱️ Zaman bazlı kısıtlamalar

Detaylı rules için `firebase-rules-final.txt` dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🆘 Destek

Herhangi bir sorun yaşarsanız Issues bölümünden bildirin.