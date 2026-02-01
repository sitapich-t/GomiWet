const userId = "user_01";

async function loadProfile() {
  const docRef = db.collection("users").doc(userId);
  const snap = await docRef.get();

  if (snap.exists) {
    const data = snap.data();
    name.value = data.name || "";
    phone.value = data.phone || "";
    address.value = data.address || "";
  }
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  await db.collection("users").doc(userId).set({
    name: name.value,
    phone: phone.value,
    address: address.value
  }, { merge: true });

  alert("บันทึกข้อมูลเรียบร้อย");
});

loadProfile();
