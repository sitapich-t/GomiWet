const params = new URLSearchParams(window.location.search);
const orderId = params.get("orderId");

document.getElementById("orderId").innerText = orderId;

let shippingFee = 0;

async function loadOrder(){

  const snap = await db.ref("order/" + orderId).once("value");

  if(!snap.exists()){
    alert("ไม่พบ order");
    return;
  }

  const data = snap.val();
  shippingFee = data.shipping_fee || 0;

  document.getElementById("fee").innerText = shippingFee;
}

async function payNow(){

  await db.ref("order/" + orderId).update({
    payment_status: "paid",
    status: "รอรับสินค้า"
  });

  alert("ชำระเงินเรียบร้อย");
  location.href="home.html";
}

loadOrder();
