const params = new URLSearchParams(window.location.search);
const orderId = params.get("orderId");

function goBack(){
  history.back();   // 🔙 กลับหน้าที่แล้ว
}

async function loadOrder(){

  if(!orderId){
    document.getElementById("orderInfo").innerHTML = "ไม่พบ order";
    return;
  }

  const snap = await db.ref("order/" + orderId).once("value");

  if(!snap.exists()){
    document.getElementById("orderInfo").innerHTML = "ไม่พบข้อมูล";
    return;
  }

  const data = snap.val();

  const shopSnap = await db.ref("shops/" + data.shop_id).once("value");
  const shopName = shopSnap.exists()
        ? shopSnap.val().shop_name
        : "-";

  document.getElementById("orderInfo").innerHTML = `
      <p>รหัส: ${orderId}</p>
      <p>ร้าน: ${shopName}</p>
      <p>วันที่: ${data.order_at || "-"}</p>
      <p>สถานะ: ${data.status}</p>
      <p>ยอดเงิน: ฿${data.total_price || 0}</p>
  `;
}

loadOrder();
