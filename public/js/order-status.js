const params = new URLSearchParams(window.location.search);
const orderId = params.get("orderId");

function goBack(){
  history.back();   // 🔙 กลับหน้าที่แล้ว
}

async function loadOrderStatus() {
  const snap = await db.ref("orders/" + orderId).once("value");

  if (!snap.exists()) {
    document.getElementById("orderInfo").innerText = "ไม่พบคำสั่งขาย";
    return;
  }

  const order = snap.val();

  document.getElementById("orderInfo").innerHTML = `
    <p>สถานะ: <b>${order.status}</b></p>
    <p>ร้านรับซื้อ: ${order.shop_id}</p>
  `;

  const canvas = document.getElementById("orderQR");

  QRCode.toCanvas(canvas, order.qr_data, { width: 200 });
}

document.addEventListener("DOMContentLoaded", loadOrderStatus);
