// ✅ แก้ไข: ต้องประกาศ LIFF_ID ไว้ที่นี่เพื่อให้ฟังก์ชันข้างล่างเรียกใช้ได้
const LIFF_ID = "2008999812-I2Dz19pN"; 

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
        getUserLocation();
        loadStores();

    } catch (error) {
        console.error("LIFF Init Error:", error);
    }
}

function initMap() {
    // ปิด zoomControl เพื่อให้เหมือนแอปมือถือ
    map = L.map("map", { zoomControl: false }).setView([13.7563, 100.5018], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            map.setView([userCoords.lat, userCoords.lng], 14);
            
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([userCoords.lat, userCoords.lng])
                .addTo(map)
                .bindPopup("คุณอยู่ที่นี่")
                .openPopup();
            
            // หลังจากได้พิกัด user แล้ว ให้วาดร้านค้าใหม่เพื่ออัปเดตระยะทาง
            renderStores(allStores);
        }, (err) => {
            document.getElementById("distDisplay").innerText = "ไม่สามารถเข้าถึงตำแหน่งได้";
        });
    }
}

// สูตรคำนวณระยะทาง
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

function renderStores(stores) {
  const storeList = document.getElementById("storeList");
  storeList.innerHTML = "";

  // ลบ marker เก่า
  storeMarkers.forEach(m => map.removeLayer(m));
  storeMarkers = [];

  stores.forEach(store => {
    let distanceInfo = "กรุณาเปิด GPS";
    let distanceValue = null;

    if (userCoords && store.latitude && store.longitude) {
      const dist = calculateDistance(
        userCoords.lat,
        userCoords.lng,
        store.latitude,
        store.longitude
      );
      distanceValue = dist;
      distanceInfo = `ห่างจากคุณ ${dist.toFixed(1)} กม.`;
    }

    // 🟢 การ์ดร้าน
    storeList.innerHTML += `
      <div class="store-card">
        <div class="card-header">
          <h2 class="store-name">${store.shop_name}</h2>
          <span class="badge-yellow">${store.category_name}</span>
        </div>

        <div class="store-types" id="waste-types-${store.id}">
          ${
            wasteTypes.length
            ? wasteTypes.map(w => `<span class="type-pill">${w}</span>`).join("")
            : `<span class="type-pill">ไม่ระบุ</span>`
          }
        </div>

        <div class="store-distance">
          📍 ${distanceInfo}
        </div>

        <div class="card-footer">
          📞 ${store.telephone}
          <button class="sell-btn" onclick="startSell('${store.id}')">
            ขาย
          </button>
        </div>
      </div>
    `;

    // 📍 marker ร้าน
    if (store.latitude && store.longitude) {
      const marker = L.marker([store.latitude, store.longitude])
        .addTo(map)
        .bindPopup(`
          <b>${store.shop_name}</b><br/>
          ${distanceInfo}<br/>
          📞 ${store.telephone}
        `);

      storeMarkers.push(marker);
    }
  });
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