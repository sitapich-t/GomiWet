let userId = null;
const LIFF_ID = "2008999812-I2Dz19pN";

async function loadProfile() {
  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

  const profile = await liff.getProfile();
  userId = profile.userId;

  // แสดงข้อมูล LINE ทันที
  document.getElementById("userName").innerText = profile.displayName;
  document.getElementById("userImg").src =
    profile.pictureUrl || "https://via.placeholder.com/80";

  const userRef = db.ref(`users/${userId}`);

  // ✅ สร้าง user ถ้ายังไม่มี
  userRef.once("value").then(snapshot => {
    if (!snapshot.exists()) {
      userRef.set({
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl || "",
        phone: "",
        address: "",
        createdAt: Date.now()
      });
    }
  }).catch(err => {
    console.error("CREATE USER ERROR:", err);
  });

  // ✅ โหลดข้อมูล user
  userRef.on("value", snap => {
    const data = snap.val();
    if (!data) return;

    document.getElementById("userPhone").innerText = data.phone || "-";
    document.getElementById("userAddress").innerText = data.address || "-";
  });

  // ✅ โหลดประวัติขาย (อย่าให้พังทั้งหน้า)
  try {
    loadMyOrders();
  } catch (e) {
    console.warn("Load history failed:", e);
  }
}

function loadHistory(userId) {
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  let totalSales = 0;
  let totalIncome = 0;

  db.ref("order")
    .orderByChild("user_id")
    .equalTo(userId)
    .limitToLast(5)
    .once("value", snap => {

      if (!snap.exists()) {
        list.innerHTML = `<p class="loading-text">ยังไม่มีประวัติการขาย</p>`;
        document.getElementById("historyCount").innerText = "0 รายการ";
        return;
      }

      snap.forEach(child => {
        const d = child.val();
        totalSales++;
        totalIncome += d.total || 0;

        list.innerHTML += `
          <div style="padding:10px 0;border-bottom:1px solid #eee">
            <strong>${d.itemName || "รายการขาย"}</strong><br>
            <small>฿${d.total}</small>
          </div>
        `;
      });

      document.getElementById("totalSales").innerText = totalSales;
      document.getElementById("totalIncome").innerText = totalIncome;
      document.getElementById("historyCount").innerText = `${totalSales} รายการ`;
    });
}

async function loadMyOrders(){

  const list = document.getElementById("historyList");
  list.innerHTML = "กำลังโหลด...";

  const snap = await db.ref("order")
                       .orderByChild("user_id")
                       .equalTo(userId)
                       .once("value");

  list.innerHTML = "";

  if(!snap.exists()){
    list.innerHTML = "ยังไม่มีประวัติการขาย";
    return;
  }

  let count = 0;

  for (const child of Object.entries(snap.val())) {

    const orderId = child[0];
    const data = child[1];

    count++;

    const storeSnap = await db.ref("shops/" + data.shop_id).once("value");
    const storeName = storeSnap.exists() ? storeSnap.val().shop_name : "-";

    list.innerHTML += `
      <div class="order-card">
        <div>วันที่: ${data.order_at || "-"}</div>
        <div>ร้าน: ${storeName}</div>
        <div>สถานะ: ${data.status}</div>
      </div>
    `;
  }

  document.getElementById("historyCount").innerText = `${count} รายการ`;
  document.getElementById("totalSales").innerText = count;
}

loadProfile();
