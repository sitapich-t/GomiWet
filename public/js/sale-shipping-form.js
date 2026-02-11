let wasteTypes = [];
const LIFF_ID = "2008999812-I2Dz19pN";

const COMPANY_LAT = 14.024777585012503;
const COMPANY_LNG = 99.97828225092593;

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

      wasteTypes.push({ id: w.key, name: w.val().category });

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
    if(distanceKm > 0.1){
      shippingFee = Math.ceil(distanceKm - 0.1) * 5;
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

async function submitSale(){

  if(currentLat === null || currentLng === null){
    alert("กรุณากดใช้ตำแหน่งปัจจุบันก่อน");
    return;
  }

  const shopId = storeId;
  const userId = await getUserId();
  const address = document.getElementById("address").value;
  const deliveryType = localStorage.getItem("delivery_type")

  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const note = document.getElementById("note").value;

  // -------------------------
  // หา waste ที่ผู้ใช้เลือก
  // -------------------------
  let selectedWaste = null;

  wasteTypes.forEach(w => {
    const input = document.getElementById(`w_${w.id}`);
    if(input && input.value){
      selectedWaste = {
        waste_id: w.id,
        weight: Number(input.value)
      };
    }
  });

  if(!selectedWaste){
    alert("กรุณาเลือกประเภทเศษอาหาร");
    return;
  }

  // -------------------------
  // ดึงข้อมูล waste ทั้ง object
  // -------------------------
  const priceSnap = await db
  .ref(`food_waste_types/${selectedWaste.waste_id}/price`)
  .once("value");

const pricePerKg = Number(priceSnap.val()) || 0;
const totalPrice = selectedWaste.weight * pricePerKg;

console.log("Waste:", selectedWaste.waste_id);
console.log("Price:", pricePerKg);
console.log("Total:", totalPrice);
  // -------------------------
  // คำนวณระยะทาง
  // -------------------------
  distanceKm = calculateDistance(
    COMPANY_LAT,
    COMPANY_LNG,
    currentLat,
    currentLng
  );

  shippingFee = 0;
  if(distanceKm > 0.1){
    shippingFee = Math.ceil(distanceKm - 0.1) * 5;
  }

  // -------------------------
  // สร้าง order
  // -------------------------
  const orderRef = db.ref("order").push();

  await orderRef.set({
    user_id: userId,
    shop_id: shopId,
    delivery_type: deliveryType,
    order_at: `${date} ${time}`,
    status: shippingFee > 0 ? "รอชำระเงิน" : "รอขนส่งเข้ารับ",
    note,
    address,
    distance_km: distanceKm,
    shipping_fee: shippingFee,
    total_price: totalPrice
  });

  // -------------------------
  // บันทึก order_items
  // -------------------------
  await db.ref("order_items").push({
    order_id: orderRef.key,
    waste_id: selectedWaste.waste_id,
    weight: selectedWaste.weight,
    price_per_kg: pricePerKg,
    total_price: totalPrice
  });

  // -------------------------
  // redirect
  // -------------------------
  if(shippingFee > 0){
    location.href = `payment.html?orderId=${orderRef.key}`;
  }else{
    alert("บันทึกสำเร็จ");
    location.href = "home.html";
  }
}
