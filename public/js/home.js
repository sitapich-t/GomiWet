// ✅ แก้ไข: ต้องประกาศ LIFF_ID ไว้ที่นี่เพื่อให้ฟังก์ชันข้างล่างเรียกใช้ได้
const LIFF_ID = "2008999812-I2Dz19pN"; 

const COMPANY_COORDS = {
  lat: 13.868180264449515,
  lng: 100.0101689952242
};


let map, userMarker;
let allStores = [];
let categoriesMap = {};
let userCoords = null;
let storeMarkers = [];
let wasteTypes = [];

async function checkLogin() {
    try {
        console.log("Initializing LIFF...");
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
            window.location.replace("index.html");
            return;
        }

        initMap();
        loadStores();

        getUserLocation();
        checkLocationPermission();

    } catch (error) {
        console.error("LIFF Init Error:", error);
    }
}

function initMap() {
  map = L.map("map", { zoomControl: false })
    .setView([COMPANY_COORDS.lat, COMPANY_COORDS.lng], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  L.marker([COMPANY_COORDS.lat, COMPANY_COORDS.lng])
    .addTo(map)
    .bindPopup("โกดัง Gomi Wet")
    .openPopup();   // เปิด popup ให้เห็นชัด ๆ
}

function getUserLocation() {

  if (!navigator.geolocation) {
    alert("อุปกรณ์ไม่รองรับ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(

    // ✅ SUCCESS
    (pos) => {

      userCoords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      map.setView([userCoords.lat, userCoords.lng], 14);

      if (userMarker) map.removeLayer(userMarker);

      userMarker = L.marker([userCoords.lat, userCoords.lng])
        .addTo(map)
        .bindPopup("คุณอยู่ที่นี่")
        .openPopup();

      renderStores(allStores);

      // 🔥 ซ่อนปุ่ม retry ถ้าเคยแสดง
      document.getElementById("retryLocationBtn").style.display = "none";
    },

    // ❌ ERROR
    (err) => {

      if (err.code === 1) {
        // Permission denied
        document.getElementById("retryLocationBtn").style.display = "block";
      }

      console.log("Location error:", err);
    }

  );
}

async function checkLocationPermission() {

  if (!navigator.permissions) return;

  const result = await navigator.permissions.query({ name: "geolocation" });

  if (result.state === "denied") {
    document.getElementById("retryLocationBtn").style.display = "block";
  }
}

async function requestLocation() {

  const permission = await navigator.permissions.query({ name: "geolocation" });

  if (permission.state === "denied") {
    alert("คุณปิดการเข้าถึงตำแหน่งไว้\nกรุณาไปเปิดใน Settings");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (position) {

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      console.log("ตำแหน่ง:", lat, lng);

      initMap(lat, lng); // เรียกฟังก์ชันที่คุณใช้สร้าง map

    },
    function (err) {

      if (err.code === 1) {
        alert("คุณปฏิเสธการเข้าถึงตำแหน่ง");
      }

      console.error("Location error:", err);
    }
  );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

async function loadCategories() {
  const snap = await db.ref("shop_categories").once("value");
  if (!snap.exists()) return;

  const data = snap.val();

  // แปลงเป็น map: { 1: "ฟาร์มหมู", 2: "..." }
  categoriesMap = Object.keys(data).reduce((acc, key) => {
    acc[key] = data[key].category;
    return acc;
  }, {});
}

async function getWasteTypesByShop(shopId) {
  const acceptedSnap = await db.ref("shop_accepted")
    .orderByChild("shop_id")
    .equalTo(Number(shopId))
    .once("value");

  if (!acceptedSnap.exists()) return [];

  const wasteIds = [];
  acceptedSnap.forEach(s => {
    wasteIds.push(String(s.val().waste_id));
  });

  const wasteSnap = await db.ref("food_waste_types").once("value");
  const result = [];

  wasteSnap.forEach(w => {
    if (wasteIds.includes(w.key)) {
      result.push(w.val().category);
    }
  });

  return result;
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

async function loadStores() {
  await loadCategories(); // 🔥 สำคัญ ต้องโหลดหมวดก่อน

  const snapshot = await db.ref("shops").once("value");
  if (!snapshot.exists()) return;

  const data = snapshot.val();

  allStores = Object.keys(data).map(key => {
    const store = data[key];
    return {
      id: key,
      ...store,
      category_name: categoriesMap[store.category_id] || "ไม่ระบุหมวด"
    };
  });

  console.log("✅ ร้านพร้อมหมวด:", allStores);
  renderStores(allStores);
}

async function renderStores(stores) {
  const storeList = document.getElementById("storeList");
  storeList.innerHTML = "";

  storeMarkers.forEach(m => map.removeLayer(m));
  storeMarkers = [];

  const storeCards = await Promise.all(
    stores.map(async (store) => {

      let distanceInfo = "กรุณาเปิด GPS";

      if (userCoords) {
        const dist = calculateDistance(
          userCoords.lat,
          userCoords.lng,
          COMPANY_COORDS.lat,
          COMPANY_COORDS.lng
        );
        distanceInfo = `ห่างจากบริษัท ${dist.toFixed(1)} กม.`;
      }

      const wasteList = await getWasteTypesByShop(store.id);

      return `
        <div class="store-card">
          <div class="store-header">
            <h2 class="store-name">${store.shop_name}</h2>
            <span class="badge-yellow">${store.category_name}</span>
          </div>

          <div class="store-types">
            ${
              wasteList.length
                ? wasteList.map(w => `<span class="type-pill">${w}</span>`).join("")
                : `<span class="type-pill">ไม่รับเศษอาหาร</span>`
            }
          </div>

          <div class="card-footer">
            📞 ${store.telephone}
            <button class="sell-btn" onclick="startSell('${store.id}')">
              ขาย
            </button>
          </div>
        </div>
      `;
    })
  );

  storeList.innerHTML = storeCards.join("");
}

function startSell(storeId) {
  console.log("CLICK SELL:", storeId);
  location.href = `shipping.html?storeId=${storeId}`;
}

function handleSearchInput(e) {
    const term = e.target.value
        .toLowerCase()
        .trim();

    console.log("🔍 search:", term);

    if (!allStores || allStores.length === 0) {
        console.warn("❌ allStores ว่าง");
        return;
    }

    if (!term) {
        renderStores(allStores);
        return;
    }

    const filtered = allStores.filter(store => {
        const name = String(store.shop_name || "").toLowerCase();
        return name.includes(term);
    });

    console.log("✅ filtered:", filtered.length);
    renderStores(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
    checkLogin();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", handleSearchInput);
    }
});