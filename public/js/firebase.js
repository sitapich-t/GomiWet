const firebaseConfig = {
  apiKey: "AIzaSyAzFZhLAipKzXg4pnLkBTd9dMQ-_Lzy6Dc",
  authDomain: "gomi-wet.firebaseapp.com",
  projectId: "gomiwet-2ba6e",
  storageBucket: "gomiwet-2ba6e.firebasestorage.app",
  messagingSenderId: "583759356106",
  appId: "1:583759356106:web:7192049c957472f822d433"
};

// init
firebase.initializeApp(firebaseConfig);

// IMPORTANT
const db = firebase.firestore();
