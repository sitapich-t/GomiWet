import { db } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const userId = "user_01";
// หรือ uid จาก Firebase Auth

// โหลดข้อมูลเดิม
async function loadProfile() {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    name.value = data.name || "";
    phone.value = data.phone || "";
    address.value = data.address || "";
  }
}
loadProfile();

// กดบันทึก
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("SUBMIT TRIGGERED");

  await setDoc(doc(db, "users", userId), {
    name: name.value,
    phone: phone.value,
    address: address.value
  }, { merge: true });

  alert("บันทึกข้อมูลเรียบร้อย");
});
