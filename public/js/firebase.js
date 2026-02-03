const firebaseConfig = {
  apiKey: "...",
  authDomain: "gomi-wet.firebaseapp.com",
  databaseURL: "https://gomiwet-2ba6e-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "gomiwet-2ba6e",
  storageBucket: "gomiwet-2ba6e.firebasestorage.app",
  messagingSenderId: "583759356106",
  appId: "1:583759356106:web:7192049c957472f822d433"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();