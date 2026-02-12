// ============================================================
//  GomiWet Admin — Firebase RTDB Config
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAeuc1i5qjKd42_dKpNez4w7KnGnsB7E9c",
  authDomain: "gomiwet-2ba6e.firebaseapp.com",
  databaseURL: "https://gomiwet-2ba6e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gomiwet-2ba6e",
  storageBucket: "gomiwet-2ba6e.firebasestorage.app",
  messagingSenderId: "438646724029",
  appId: "1:438646724029:web:c11f2f40708c4bc84f2ed4",
};
// Initialize Firebase (ป้องกัน init ซ้ำ)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ประกาศ database ให้ scripts.js ใช้ได้ (global scope)
const database = firebase.database();

console.log("🔥 Admin Firebase connected to RTDB (Production)");
