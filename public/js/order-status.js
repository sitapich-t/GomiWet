const params = new URLSearchParams(window.location.search);
const orderId = params.get("orderId");

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

async function loadOrderStatus() {
  const snap = await db.ref("order/" + orderId).once("value");

  if (!snap.exists()) {
    document.getElementById("orderInfo").innerText = "ไม่พบคำสั่งขาย";
    return;
  }

  const order = snap.val();

  const shopSnap = await db.ref(`shops/${order.shop_id}`).once("value");
  const shopData = shopSnap.val();
  const shopName = shopData ? shopData.shop_name : "-";

  document.getElementById("orderInfo").innerHTML = `
    <p>รหัสการขาย: <b>${order.display_id}</b></p>
    <p>ร้าน: ${shopName}</p>
    <p>สถานะ: <b>${STATUS_LABEL[order.status] || order.status || "-"}</b></p>
  `;
}

document.addEventListener("DOMContentLoaded", loadOrderStatus);
