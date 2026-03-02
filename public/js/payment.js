const params = new URLSearchParams(window.location.search);
const orderKey = params.get("orderId"); // key ของ Firebase

let shippingFee = 0;

async function loadOrder() {

  if (!orderKey) {
    alert("ไม่พบ orderId");
    return;
  }

  const snap = await db.ref("order/" + orderKey).once("value");

  if (!snap.exists()) {
    alert("ไม่พบ order");
    return;
  }

  const data = snap.val();

  shippingFee = data.shipping_fee || 0;

  // ✅ ใช้ display order id แทน key
  document.getElementById("orderId").innerText = data.display_id || "-";

  document.getElementById("fee").innerText = shippingFee + " บาท";
}

async function payNow() {

  if (!orderKey) {
    alert("ไม่พบ orderId");
    return;
  }

  const now = Date.now();

  await db.ref("order/" + orderKey).update({
    payment_status: "paid",
    status: "order_received",
    "status_history/order_received": now
  });

  alert("ชำระเงินเรียบร้อย");
  location.href = "home.html";
}

loadOrder();
