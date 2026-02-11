const params = new URLSearchParams(window.location.search);
const orderId = params.get("orderId");

document.getElementById("orderId").innerText = orderId;

let shippingFee = 0;

async function loadOrder(){

  if(!orderId){
    alert("ไม่พบ orderId");
    return;
  }

  const snap = await db.ref("order/" + orderId).once("value");

  if(!snap.exists()){
    alert("ไม่พบ order");
    return;
  }

  const data = snap.val();
  shippingFee = data.shipping_fee || 0;

  document.getElementById("fee").innerText = shippingFee + " บาท";
}

async function payNow(){

  if(!orderId){
    alert("ไม่พบ orderId");
    return;
  }

  const now = Date.now();

  await db.ref("order/" + orderId).update({
    payment_status: "paid",
    status: "order_received",
    "status_history/order_received": now
  });

  alert("ชำระเงินเรียบร้อย");
  location.href="home.html";
}

loadOrder();
