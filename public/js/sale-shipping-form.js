let wasteTypes = [];
const LIFF_ID = "2008999812-I2Dz19pN";

const COMPANY_LAT = 13.54062;
const COMPANY_LNG = 99.963823;

let currentLat = null;
let currentLng = null;

let shippingFee = 0;
let distanceKm = 0;

const params = new URLSearchParams(window.location.search);
const storeId = params.get("storeId");

document.addEventListener("DOMContentLoaded", async () => {

  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

  // set default date/time
  const now = new Date();
  document.getElementById("date").value =
    now.toISOString().split("T")[0];

  document.getElementById("time").value =
    now.toTimeString().slice(0,5);

  loadWasteTypes();
});

async function getUserId(){
  const profile = await liff.getProfile();
  return profile.userId;
}

async function loadWasteTypes() {
  const list = document.getElementById("wasteList");
  list.innerHTML = "กำลังโหลด...";

  // 1️⃣ ดึง waste_id ที่ร้านนี้รับซื้อ
  const acceptedSnap = await db.ref("shop_accepted")
    .orderByChild("shop_id")
    .equalTo(Number(storeId))   // ถ้า storeId เป็น string
    .once("value");

  const acceptedWasteIds = [];

  acceptedSnap.forEach(s => {
    acceptedWasteIds.push(String(s.val().waste_id));
  });

  // ถ้าร้านไม่รับซื้ออะไรเลย
  if (acceptedWasteIds.length === 0) {
    list.innerHTML = "ร้านนี้ไม่รับซื้อเศษอาหาร";
    return;
  }

  // 2️⃣ โหลดประเภทเศษอาหารทั้งหมด
  const wasteSnap = await db.ref("food_waste_types").once("value");

  list.innerHTML = "";
  wasteTypes = [];

  // 3️⃣ แสดงเฉพาะที่ร้านรับซื้อ
  wasteSnap.forEach(w => {

    if (acceptedWasteIds.includes(w.key)) {

      wasteTypes.push({ id: w.key, name: w.val().name });

      list.innerHTML += `
        <div class="waste-row">
          <span>${w.val().category}</span>
          <input type="number"
                 class="waste-input"
                 id="w_${w.key}"
                 placeholder="กก."
                 oninput="limitOneInput(this)">
        </div>
      `;
    }
  });
}

function limitOneInput(current){
  document.querySelectorAll(".waste-input").forEach(i=>{
    if(i !== current){
      i.value = "";
    }
  });
}

async function submitSale(){

  if(currentLat === null || currentLng === null){
    alert("กรุณากดใช้ตำแหน่งปัจจุบันก่อน");
    return;
  }

  const shopId = storeId;
  const userId = await getUserId();
  const address = document.getElementById("address").value;

  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const note = document.getElementById("note").value;

  distanceKm = calculateDistance(
    COMPANY_LAT,
    COMPANY_LNG,
    currentLat,
    currentLng
  );

  shippingFee = 0;
  if(distanceKm > 1){
    shippingFee = Math.ceil(distanceKm - 1) * 5;
  }

  const orderRef = db.ref("order").push();

  await orderRef.set({
    user_id: userId,
    shop_id: shopId,
    order_at: `${date} ${time}`,
    status: shippingFee > 0 ? "รอชำระเงิน" : "กำลังขนส่ง",
    note,
    address,
    distance_km: distanceKm,
    shipping_fee: shippingFee
  });

  if(shippingFee > 0){
    location.href = `payment.html?orderId=${orderRef.key}`;
  } else {
    alert("บันทึกสำเร็จ");
    location.href = "home.html";
  }
}

function getCurrentLocation(){

  if(!navigator.geolocation){
    alert("อุปกรณ์ไม่รองรับ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {

    currentLat = pos.coords.latitude;
    currentLng = pos.coords.longitude;

    document.getElementById("address").value =
      `Lat:${currentLat}, Lng:${currentLng}`;

    distanceKm = calculateDistance(
      COMPANY_LAT,
      COMPANY_LNG,
      currentLat,
      currentLng
    );

    shippingFee = 0;
    if(distanceKm > 1){
      shippingFee = Math.ceil(distanceKm - 1) * 5;
    }

    document.getElementById("shippingText").innerText =
      `ระยะทาง ${distanceKm.toFixed(2)} km | ค่าขนส่ง ${shippingFee} บาท`;

  }, () => {
    alert("ไม่สามารถดึงตำแหน่งได้");
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1) * Math.PI/180;
  const dLon = (lon2-lon1) * Math.PI/180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
