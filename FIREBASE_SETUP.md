# 🔥 Firebase Kurulum Rehberi

Bu dosya, Quiz Platform'unu gerçek Firebase projesi ile çalıştırmak için gerekli adımları anlatır.

## 📋 Adım 1: Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Add project" butonuna tıklayın
3. Proje ismi girin (örn: "quiz-platform")
4. Google Analytics'i enable/disable edin (opsiyonel)
5. "Create project" butonuna tıklayın

## ⚙️ Adım 2: Authentication Kurulumu

1. Firebase Console'da projenizi seçin
2. Sol menüden "Authentication" seçin
3. "Get started" butonuna tıklayın
4. "Sign-in method" tab'ına gidin
5. "Email/Password" provider'ı aktifleştirin:
   - Email/Password: ✅ Enable
   - Email link: ❌ Disable (şimdilik)

## 📊 Adım 3: Firestore Database Kurulumu

1. Sol menüden "Firestore Database" seçin
2. "Create database" butonuna tıklayın
3. Security rules için "Start in test mode" seçin (geçici)
4. Location seçin (tercihen yakın bir bölge)
5. "Done" butonuna tıklayın

## 🔒 Adım 4: Security Rules Güncelleme

1. Firestore Database sayfasında "Rules" tab'ına gidin
2. Aşağıdaki kuralları kopyalayıp yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && 
                   request.auth.uid == userId &&
                   request.resource.data.uid == request.auth.uid &&
                   request.resource.data.email == request.auth.token.email;
      allow read, update: if request.auth != null && 
                          exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
      allow delete: if request.auth != null && 
                   exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Multiplayer rooms
    match /multiplayerRooms/{roomId} {
      allow read, write: if request.auth != null;
      
      match /chat/{messageId} {
        allow read, write: if request.auth != null;
      }
      
      match /answers/{answerId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Questions collection
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                  exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

3. "Publish" butonuna tıklayın

## 🔑 Adım 5: Web App Oluşturma

1. Firebase Console'da Project Settings'e gidin (sol üstteki ⚙️ ikonu)
2. "General" tab'ında aşağıya scroll edin
3. "Your apps" bölümünde web app ikonu (</>) tıklayın
4. App nickname girin (örn: "quiz-web-app")
5. "Register app" butonuna tıklayın
6. Firebase config objesini kopyalayın

## 📝 Adım 6: Config Dosyasını Güncelleme

1. `firebase-config.js` dosyasını açın
2. Firebase Console'dan kopyaladığınız config ile değiştirin:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB....", // Kendi API key'iniz
  authDomain: "quiz-platform-xxxxx.firebaseapp.com",
  projectId: "quiz-platform-xxxxx",
  storageBucket: "quiz-platform-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 👤 Adım 7: İlk Admin Kullanıcısı Oluşturma

1. Uygulamayı açın ve kayıt olun
2. Firebase Console > Authentication > Users bölümüne gidin
3. Yeni oluşturulan kullanıcıyı bulun
4. Firestore Database'e gidin
5. `users` collection'ında bu kullanıcının UID'sini bulun
6. Document'i düzenleyip aşağıdaki field'ları ekleyin:
   - `isAdmin: true`
   - `isApproved: true`

## ✅ Adım 8: Test Etme

1. Uygulamayı yenileyin
2. Console'da "🚀 Firebase production configuration loaded" mesajını görmelisiniz
3. Kendi email/şifrenizle giriş yapabilmelisiniz
4. Admin paneli erişiminiz olmalı

## 🔧 Sorun Giderme

### Giriş Yapamıyorum
- Firebase Console > Authentication'da kullanıcınızın olduğunu kontrol edin
- Firestore'da users/{uid} document'inde `isApproved: true` olduğunu kontrol edin

### Console Hataları
- Browser Developer Tools > Console'da hataları kontrol edin
- Firebase config'in doğru olduğundan emin olun
- Security rules'ların publish edildiğinden emin olun

### Demo Mode'a Geri Dönmek
`firebase-config.js` dosyasında:
```javascript
// Bu satırları comment'leyin:
// apiKey: "your-real-api-key",

// Bu satırları uncomment edin:
apiKey: "demo-key-fallback-mode",
```

## 📞 Destek

Sorun yaşarsanız:
1. Browser Console'daki hataları kontrol edin
2. Firebase Console > Usage bölümünde quota'larınızı kontrol edin
3. Issues bölümünden bildirim yapın