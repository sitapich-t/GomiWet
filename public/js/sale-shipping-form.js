let wasteTypes = [];
const LIFF_ID = "2008999812-I2Dz19pN";

let isSubmitting = false;

const COMPANY_LAT = 13.868180264449515;
const COMPANY_LNG = 100.0101689952242;

let currentLat = null;
let currentLng = null;
let geoAddressData = null;

let shippingFee = 0;
let distanceKm = 0;

const params = new URLSearchParams(window.location.search);
const storeId = params.get("storeId");

async function generateDisplayOrderId() {

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const dateKey = `${yyyy}${mm}${dd}`;

  const counterRef = db.ref(`order_counters/${dateKey}`);

  const result = await counterRef.transaction(current => {
    return (current || 0) + 1;
  });

  const runningNumber = String(result.snapshot.val()).padStart(4, '0');

  return `ORD${dateKey}-${runningNumber}`;
}

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

function calculateShippingByDistance(distanceKm) {
  if (distanceKm <= 10) {
    return { fee: 0, status: "ok", text: "ฟรี" };
  } 
  else if (distanceKm <= 20) {
    return { fee: 20, status: "ok", text: "20 บาท" };
  } 
  else {
    return { fee: -1, status: "too_far", text: "เกินระยะให้บริการ" };
  }
}

async function getCurrentLocation(){

  if(!navigator.geolocation){
    alert("อุปกรณ์ไม่รองรับ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {

      currentLat = pos.coords.latitude;
      currentLng = pos.coords.longitude;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLat}&lon=${currentLng}`,
          {
            headers: {
              "Accept": "application/json",
              "User-Agent": "foodwaste-app"
            }
          }
        );

        const data = await response.json();

        // ✅ เอาแค่ข้อความที่อยู่ยาว ๆ ตรง ๆ
        const textAddress =
          data.display_name ||
          `พิกัด: ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;

        document.getElementById("address").value = textAddress;

        // คำนวณระยะ + ค่าส่งตามเดิม
        distanceKm = calculateDistance(
          COMPANY_LAT,
          COMPANY_LNG,
          currentLat,
          currentLng
        );

        const shippingResult = calculateShippingByDistance(distanceKm);
        shippingFee = shippingResult.fee;

        let shippingText = "";

        if (shippingResult.status === "ok") {
          shippingText = `ระยะทาง ${distanceKm.toFixed(2)} กม. | ค่าขนส่ง ${shippingResult.text}`;
        } else {
          shippingText = `❌ ระยะทาง ${distanceKm.toFixed(2)} กม. | เกินระยะให้บริการ (ไม่เกิน 20 กม.)`;
        }

        document.getElementById("shippingText").innerText = shippingText;
        document.getElementById("submitBtn").disabled =
          shippingResult.status === "too_far";

      } catch (e) {
        console.error(e);

        // 🔥 fallback: ใช้พิกัดแทนข้อความที่อยู่
        document.getElementById("address").value =
          `พิกัด: ${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;

        distanceKm = calculateDistance(
          COMPANY_LAT,
          COMPANY_LNG,
          currentLat,
          currentLng
        );

        const shippingResult = calculateShippingByDistance(distanceKm);
        shippingFee = shippingResult.fee;

        document.getElementById("shippingText").innerText =
          `ระยะทาง ${distanceKm.toFixed(2)} กม. | ค่าขนส่ง ${shippingResult.text}`;

        document.getElementById("submitBtn").disabled =
          shippingResult.status === "too_far";
      }
    },

    // ❌ ผู้ใช้กดไม่อนุญาตตำแหน่ง
    () => {
      alert(
        "กรุณาเปิดอนุญาตตำแหน่งให้เว็บไซต์นี้\n\n" +
        "วิธีเปิด:\n" +
        "👉 iPhone: การตั้งค่า > Safari > ตำแหน่งที่ตั้ง > อนุญาต\n" +
        "👉 Android: การตั้งค่า > ตำแหน่ง > อนุญาตการเข้าถึง\n" +
        "👉 Chrome: แตะรูปกุญแจข้าง URL แล้วเลือก 'อนุญาตตำแหน่ง'\n\n" +
        "แล้วรีเฟรชหน้าใหม่อีกครั้ง"
      );
    }
  );
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

function saveSaleDraft() {

  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const note = document.getElementById("note").value;

  let selectedWaste = null;

  wasteTypes.forEach(w => {
    const input = document.getElementById(`w_${w.id}`);
    if (input && input.value) {
      selectedWaste = {
        waste_id: w.id,
        weight: input.value
      };
    }
  });

  const draft = {
    date,
    time,
    note,
    selectedWaste
  };

  localStorage.setItem("sale_draft", JSON.stringify(draft));
}

async function submitSale(){
  if (isSubmitting) return;
  isSubmitting = true;

  try {
    if(currentLat === null || currentLng === null){
      alert("กรุณาใช้ GPS หรือกดค้นหาที่อยู่ก่อน");
      isSubmitting = false;
      return;
    }
  
    const shopId = storeId;
    const userId = await getUserId();
    const address = document.getElementById("address").value;
    const addressDetail = document.getElementById("addressDetail").value;
    const deliveryType = localStorage.getItem("delivery_type")
  
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const note = document.getElementById("note").value;
  
    if (!address || address === "ไม่ทราบตำแหน่ง") {
      alert("กรุณากด GPS หรือค้นหาที่อยู่ก่อนทำรายการ");
      isSubmitting = false;
      return;
    }

    const fullAddress = addressDetail ? `${addressDetail}, ${address}` : address;
  
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
      isSubmitting = false;
      return;
    }
    const isProfileComplete = await checkProfileComplete(userId);
    const hasBank = await checkUserBankAccount(userId);
  
    if (!isProfileComplete || !hasBank) {
  
      saveSaleDraft();

      alert("กรุณากรอกข้อมูลส่วนตัวและบัญชีธนาคารให้ครบก่อนทำรายการขาย");
  
      const currentPage = encodeURIComponent(window.location.href);
      window.location.href = `profile-edit.html?redirect=${currentPage}`;
      return;
    }
  
    const priceSnap = await db
    .ref(`food_waste_types/${selectedWaste.waste_id}/price`)
    .once("value");
  
    const pricePerKg = Number(priceSnap.val()) || 0;
    const totalPrice = selectedWaste.weight * pricePerKg;
  
    distanceKm = calculateDistance(
      COMPANY_LAT,
      COMPANY_LNG,
      currentLat,
      currentLng
    );
  
    const shippingResult = calculateShippingByDistance(distanceKm);
    shippingFee = shippingResult.fee;

    if (shippingResult.status === "too_far") {
      alert("ระยะทางไกลเกินไป ทางร้านไม่รับให้บริการในระยะนี้");
      isSubmitting = false;
      return;
    }

    const displayId = await generateDisplayOrderId();
    const orderRef = db.ref("order").push();
  
    await orderRef.set({
      display_id: displayId,
      user_id: userId,
      shop_id: shopId,
      delivery_type: deliveryType,
      order_at: firebase.database.ServerValue.TIMESTAMP,
      pickup_at: `${date} ${time}`,
      status: shippingFee > 0 ? "waiting_payment" : "order_received",
      note,
      address: {
        full: fullAddress,
        detail: addressDetail,
        lat: currentLat,
        lng: currentLng,
      },
      distance_km: distanceKm,
      shipping_fee: shippingFee,
      total_price: totalPrice
    });
  
    await db.ref("order_items").push({
      order_id: orderRef.key,
      waste_id: selectedWaste.waste_id,
      weight: selectedWaste.weight,
      price_per_kg: pricePerKg,
      total_price: totalPrice
    });
  
    await db.ref(`pickup_addresses/${orderRef.key}`).set({
      order_id: orderRef.key,
      address: {
        full: fullAddress,
        detail: addressDetail,
        lat: currentLat,
        lng: currentLng,
        province: geoAddressData?.province || '',
        district: geoAddressData?.district || '',
        subDistrict: geoAddressData?.subDistrict || '',
        postalCode: geoAddressData?.postalCode || '',
        road: geoAddressData?.road || ''
      },
      distance_km: distanceKm,
      shipping_fee: shippingFee,
    })
  
    if(shippingFee > 0){
      location.href = `payment.html?orderId=${orderRef.key}`;
    }else{
      alert("บันทึกสำเร็จ");
      location.href = "home.html";
    }
  } catch (error) {
    console.error(error);
  alert("เกิดข้อผิดพลาด");
  isSubmitting = false;
  }
}

async function checkProfileComplete(userId) {
  const snap = await db.ref(`sellers/${userId}`).once("value");

  if (!snap.exists()) return false;

  const seller = snap.val();

  if (!seller.fullname || !seller.phone || !seller.address) {
    return false;
  }

  return true;
}

async function checkUserBankAccount(userId) {
  const snap = await db.ref(`bank_accounts/${userId}`).once("value");
  return snap.exists();
}

