// 🔥 Firebase Compat (สำคัญมาก)
const firebaseConfig = {
  apiKey: "AIzaSyAzFZhLAipKzXg4pnLkBTd9dMQ-_Lzy6Dc",
  authDomain: "gomi-wet.firebaseapp.com",
  projectId: "gomiwet-2ba6e",
  storageBucket: "gomiwet-2ba6e.firebasestorage.app",
  messagingSenderId: "583759356106",
  appId: "1:583759356106:web:7192049c957472f822d433"
};

// ❗ ต้องเช็กก่อนว่า initialize แล้วหรือยัง
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// 🔥 ตัวนี้แหละที่ทุกหน้าใช้
const db = firebase.firestore();
db.useEmulator("127.0.0.1", 8080);