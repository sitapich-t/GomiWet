const db = firebase.firestore();

async function loadProfile() {
  try {
    await liff.init({ liffId: "2008999812-I2Dz19pN" });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const userId = profile.userId;

    document.getElementById("userName").innerText = profile.displayName;
    document.getElementById("userImg").src = profile.pictureUrl;

    const userRef = db.collection("users").doc(userId);
    const snap = await userRef.get();

    if (snap.exists) {
      const data = snap.data();
      document.getElementById("userPhone").innerText = data.phone || "-";
      document.getElementById("userAddress").innerText = data.address || "-";
    }

    loadHistory(userId);

  } catch (err) {
    console.error(err);
  }
}

async function loadHistory(userId) {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  const querySnap = await db
    .collection("orders")
    .where("sellerId", "==", userId)
    .limit(5)
    .get();

  document.getElementById("historyCount").innerText =
    `${querySnap.size} รายการ`;

  let totalSales = 0;
  let totalIncome = 0;

  querySnap.forEach(doc => {
    const d = doc.data();
    totalSales++;
    totalIncome += d.total || 0;

    list.innerHTML += `
      <div style="padding:10px 0;border-bottom:1px solid #eee">
        <strong>${d.itemName}</strong><br>
        <small>฿${d.total}</small>
      </div>
    `;
  });

  document.getElementById("totalSales").innerText = totalSales;
  document.getElementById("totalIncome").innerText = totalIncome;
}

loadProfile();
