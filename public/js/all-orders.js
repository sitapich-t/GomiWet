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

function openOrder(orderId){
  location.href = `status_details.html?order_id=${orderId}`;
}

async function loadAllOrders(){

  const list = document.getElementById("orderList");
  list.innerHTML = "กำลังโหลด...";

  const snap = await db.ref("seller_payouts")
                       .orderByChild("seller_id")
                       .equalTo(userId)
                       .once("value");

  list.innerHTML = "";

  if(!snap.exists()){
    list.innerHTML = "ยังไม่มีรายการที่สำเร็จ";
    return;
  }

  const payouts = Object.entries(snap.val())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.paid_at - a.paid_at);

  for (const p of payouts) {

    // 🔥 ดึง order เพื่อเอา display_id และ order_at
    const orderSnap = await db.ref("order/" + p.order_id).once("value");
    const orderData = orderSnap.exists() ? orderSnap.val() : null;

    const displayId = orderData?.display_id || p.order_id;

    const orderDate = orderData?.order_at
      ? new Date(orderData.order_at).toLocaleString("th-TH")
      : "-";

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
          <span>ยอดที่โอนจริง</span>
          <span class="order-price">
            ฿${Number(p.amount).toFixed(2)}
          </span>
        </div>
      </div>
    `;
  }
}

init();
