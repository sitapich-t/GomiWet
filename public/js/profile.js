let userId = null;
const LIFF_ID = "2008999812-I2Dz19pN";

const STATUS_LABEL = {
	'order_received': 'ได้รับคำสั่งซื้อ',
	'picked_up': 'กำลังส่งไปโกดัง',
	'inbound': 'ถึงโกดังและคัดแยก',
	'sorted': 'คัดแยกเสร็จสิ้น',
	'evaluated': 'ประเมินราคา',
	'outbound': 'กำลังขาย',
	'sold': 'ขายให้ผู้ซื้อ',
	'completed': 'จ่ายเงินเสร็จสิ้น'
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
  location.href = `status_details.html?order_id=${orderId}`;
}

async function loadMyOrders() {

  const list = document.getElementById("historyList");
  list.innerHTML = "กำลังโหลด...";

  const allSnap = await db.ref("seller_payouts")
    .orderByChild("seller_id")
    .equalTo(userId)
    .once("value");

  let allCount = 0;
  let allIncome = 0;

  if (allSnap.exists()) {
    Object.values(allSnap.val()).forEach(p => {
      allCount++;
      allIncome += p.amount || 0;
    });
  }

  const snap = await db.ref("seller_payouts")
    .orderByChild("seller_id")
    .equalTo(userId)
    .limitToLast(5)
    .once("value");

  list.innerHTML = "";

  if (!snap.exists()) {
    list.innerHTML = "ยังไม่มีประวัติการรับเงิน";
    document.getElementById("historyCount").innerText = "0 รายการ";
    document.getElementById("totalSales").innerText = "0";
    document.getElementById("totalIncome").innerText = "0.00";
    return;
  }

  const payouts = Object.entries(snap.val())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.paid_at - a.paid_at); // เรียงจากใหม่ไปเก่า

  let totalIncome = 0;

  for (const p of payouts) {

    totalIncome += p.amount || 0;
  
    const paidDate = p.paid_at
      ? new Date(p.paid_at).toLocaleString("th-TH")
      : "-";
  
    // 🔥 ดึงข้อมูล order เพิ่ม
    const orderSnap = await db.ref("order/" + p.order_id).once("value");
    const orderData = orderSnap.exists() ? orderSnap.val() : null;
  
    const orderDate = orderData && orderData.order_at
      ? new Date(orderData.order_at).toLocaleString("th-TH")
      : "-";
  
    const displayId = orderData?.display_id || p.order_id;
    
    list.innerHTML += `
      <div class="order-card" onclick="openOrder('${p.order_id}')" style="cursor:pointer">
        <div class="order-row">
          <span>รหัสการขาย</span>
          <span>${displayId}</span>
        </div>
        <div class="order-row">
          <span>วันที่ขาย</span>
          <span>${orderDate}</span>
        </div>
        <div class="order-row">
          <span>ยอดขาย</span>
          <span class="order-price">
            ฿${Number(p.amount).toFixed(2)}
          </span>
        </div>
      </div>
    `;
  }
  
  document.getElementById("historyCount").innerText =
    `${allCount} รายการ`;

  document.getElementById("totalSales").innerText =
    allCount;

  document.getElementById("totalIncome").innerText =
    Number(allIncome).toFixed(2);
}

loadProfile();