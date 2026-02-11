let userId = null;
const LIFF_ID = "2008999812-I2Dz19pN";

function goBack(){
  history.back();   // 🔙 กลับหน้าที่แล้ว
}

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

  snap.forEach(child => {
    const d = child.val();

    list.innerHTML += `
  <div class="order-card">
    <div class="order-row">
      <span>วันที่</span>
      <span>${d.order_at}</span>
    </div>

    <div class="order-row">
      <span>สถานะ</span>
      <span class="order-status status-${d.status}">
        ${d.status}
      </span>
    </div>

    <div class="order-row">
      <span>ยอดรวม</span>
      <span class="order-price">
        ฿${Number(d.total_price).toFixed(2)}
      </span>
    </div>
  </div>
`;

  });
}

init();
