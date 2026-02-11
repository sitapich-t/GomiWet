let userId = null;
const LIFF_ID = "2008999812-I2Dz19pN";

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
  window.location.href = `order-status.html?orderId=${orderId}`;
}

async function loadMyOrders(shopId){

  const list = document.getElementById("historyList");
  list.innerHTML = "กำลังโหลด...";

  const snap = await db.ref("order")
                       .orderByChild("user_id")
                       .equalTo(userId)
                       .limitToLast(10)
                       .once("value");

  list.innerHTML = "";

  if(!snap.exists()){
    list.innerHTML = "ยังไม่มีประวัติการขาย";
    return;
  }

   const orders = Object.entries(snap.val())
                       .map(([id,data]) => ({id,...data}))
                       .sort((a,b)=> new Date(b.order_at) - new Date(a.order_at));

  let count = 0;
  let totalIncome = 0;

  for (const child of Object.entries(snap.val())) {

    const orderId = child[0];
    const data = child[1];

    count++;
    totalIncome += data.total_price || 0;

    const storeSnap = await db.ref("shops/" + data.shop_id).once("value");
    const storeName = storeSnap.exists() ? storeSnap.val().shop_name : "-";

    list.innerHTML += `
      <div class="order-card" onclick="openOrder('${orderId}')"
       style="cursor:pointer">
        <div>วันที่: ${data.order_at || "-"}</div>
        <div>ร้าน: ${storeName}</div>
        <div>สถานะ: ${data.status}</div>
        <div>ยอด: ฿${Number(data.total_price || 0).toFixed(2)}</div>
      </div>
    `;
  }

  document.getElementById("historyCount").innerText = `${count} รายการ`;
  document.getElementById("totalSales").innerText = count;
  document.getElementById("totalIncome").innerText = Number(totalIncome).toFixed(2);
}

loadProfile();
