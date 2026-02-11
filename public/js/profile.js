let userId = null;
const LIFF_ID = "2008999812-I2Dz19pN";

const STATUS_LABEL = { 
  order_received: 'ได้รับรายการขายแล้ว', 
  picked_up: 'รถมารับเศษอาหาร', 
  inbound: 'ถึงโกดังและคัดแยก', 
  sorted: 'ถึงโกดังและคัดแยก', 
  evaluated: 'ประเมินราคา', 
  outbound: 'กำลังขาย', 
  sold: 'ขายให้ร้านค้า', 
  paid: 'จ่ายเงิน', 
  completed: 'เสร็จสิ้น' 
};

async function loadProfile(){

  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

  const profile = await liff.getProfile();
  userId = profile.userId;

  /* ====================
     USERS
  ==================== */

  const userSnap = await db.ref("users/" + userId).once("value");
  const user = userSnap.val();

  if(user){
    document.getElementById("userName").innerText =
      user.display_name || "-";

    document.getElementById("userImg").src =
      user.picture_url || "https://via.placeholder.com/80";
  }

  /* ====================
     SELLERS
  ==================== */

  const sellerSnap = await db.ref("sellers/" + userId).once("value");
  const seller = sellerSnap.val();

  if(seller){
    document.getElementById("userPhone").innerText =
      seller.phone || "-";

    document.getElementById("userAddress").innerText =
      seller.address || "-";
  }

  loadMyOrders(userId);
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

function openAllOrders(){
  location.href = "all-orders.html";
}

function openOrder(orderId){
  window.location.href = `status_detail.html?orderId=${orderId}`;
}

async function loadMyOrders() {

  const list = document.getElementById("historyList");
  list.innerHTML = "กำลังโหลด...";

  /* ==========================
     1️⃣ ดึงทั้งหมดเพื่อคำนวณ
  ========================== */

  const allSnap = await db.ref("order")
    .orderByChild("user_id")
    .equalTo(userId)
    .once("value");

  let totalCount = 0;
  let totalIncome = 0;

  if (allSnap.exists()) {
    allSnap.forEach(child => {
      totalCount++;
      totalIncome += child.val().total_price || 0;
    });
  }

  document.getElementById("historyCount").innerText = `${totalCount} รายการ`;
  document.getElementById("totalSales").innerText = totalCount;
  document.getElementById("totalIncome").innerText =
    Number(totalIncome).toFixed(2);

  /* ==========================
     2️⃣ ดึงแค่ 10 รายการล่าสุด
  ========================== */

  const snap = await db.ref("order")
    .orderByChild("user_id")
    .equalTo(userId)
    .limitToLast(10)
    .once("value");

  list.innerHTML = "";

  if (!snap.exists()) {
    list.innerHTML = "ยังไม่มีประวัติการขาย";
    return;
  }

  const orders = Object.entries(snap.val())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => new Date(b.order_at) - new Date(a.order_at));

  for (const order of orders) {

    const storeSnap = await db.ref("shops/" + order.shop_id).once("value");
    const storeName = storeSnap.exists()
      ? storeSnap.val().shop_name
      : "-";

    list.innerHTML += `
      <div class="order-card" onclick="openOrder('${order.id}')" style="cursor:pointer">
        <div class="order-row">
          <span>วันที่</span>
          <span>${order.pickup_at || "-"}</span>
        </div>
        <div class="order-row">
          <span>ร้านค้า</span>
          <span>${storeName || "-"}</span>
        </div>
        <div class="order-row">
          <span>สถานะ</span>
          <span>${STATUS_LABEL[order.status] || order.status || "-"}</span>
        </div>
        <div class="order-row">
          <span>ยอด</span>
          <span class="order-price">฿${Number(order.total_price).toFixed(2) || "-"}</span>
        </div>
      </div>
    `;
  }
}


loadProfile();
