"use strict";

console.count("🔥 firebase.js loaded");
var firebaseConfig = {
  apiKey: "AIzaSyAeuc1i5qjKd42_dKpNez4w7KnGnsB7E9c",
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

var db = firebase.database();
var auth = firebase.auth();
window.auth = auth;