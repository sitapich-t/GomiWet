let userId = null;
const LIFF_ID = "2008999812-I2Dz19pN";

function goBack(){
  history.back();   // 🔙 กลับหน้าที่แล้ว
}

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

async function init(){

  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

  const profile = await liff.getProfile();
  userId = profile.userId;

  loadAllOrders();
}

async function loadAllOrders(){

  const snap = await db.ref("order")
                       .orderByChild("user_id")
                       .equalTo(userId)
                       .once("value");

  const list = document.getElementById("orderList");
  list.innerHTML = "";

  if(!snap.exists()){
    list.innerHTML = "ยังไม่มีรายการขาย";
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

init();
