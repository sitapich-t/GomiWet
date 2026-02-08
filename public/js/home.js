const LIFF_ID = "2008999812-I2Dz19pN";

let map, userMarker;
let userCoords = null;
let storeMarkers = [];

let allStores = [];
let categoriesMap = {};
let wasteTypesMap = {};
let shopAcceptedMap = {};

/* ===================== LOGIN ===================== */
async function checkLogin() {
  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    location.replace("index.html");
    return;
  }

  initMap();
  getUserLocation();
  loadStores();
}

/* ===================== MAP ===================== */
function initMap() {
    // กำหนดพิกัดเริ่มต้น (กรุงเทพฯ)
    map = L.map("map", { 
        zoomControl: false,  /* ปิดปุ่ม +/- เพื่อให้เหมือนในรูป */
        attributionControl: false /* ปิดข้อความลิขสิทธิ์เล็กๆ เพื่อความคลีน */
    }).setView([13.7563, 100.5018], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
     .addTo(map);

    // 🔥 บังคับให้แผนที่คำนวณขนาดใหม่หลังจากโหลดหน้าเสร็จ
    setTimeout(() => {
        map.invalidateSize();
    }, 500);
}

function getUserLocation() {
  navigator.geolocation?.getCurrentPosition(pos => {
    userCoords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };

    map.setView([userCoords.lat, userCoords.lng], 14);

    userMarker = L.marker([userCoords.lat, userCoords.lng])
      .addTo(map)
      .bindPopup("คุณอยู่ที่นี่")
      .openPopup();

    renderStores(allStores);
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/* ===================== LOAD DATA ===================== */
async function loadCategories() {
  const snap = await db.ref("shop_categories").once("value");
  categoriesMap = {};
  snap.forEach(c => {
    categoriesMap[c.key] = c.val().category;
  });
}

async function loadWasteTypes() {
  const snap = await db.ref("waste_types").once("value");
  wasteTypesMap = {};
  snap.forEach(w => {
    wasteTypesMap[w.key] = w.val().name;
  });
}

async function loadShopAccepted() {
  const snap = await db.ref("shop_accepted").once("value");
  shopAcceptedMap = snap.val() || {};
  console.log("shopAcceptedMap:", shopAcceptedMap);
}

async function loadStores() {
  await loadCategories();
  await loadWasteTypes();
  await loadShopAccepted();

  const snap = await db.ref("shops").once("value");
  allStores = [];

  snap.forEach(s => {
    const store = s.val();
    const shopId = s.key; // 🔥 ต้องใช้ key เท่านั้น

    const acceptedObj = shopAcceptedMap[shopId] || {};
    const wasteIds = Object.keys(acceptedObj);

    const foodTypes = wasteIds
      .map(id => wasteTypesMap[id])
      .filter(Boolean);

    allStores.push({
      id: shopId,
      ...store,
      category_name: categoriesMap[store.category_id] || "",
      food_types: foodTypes
    });
  });

  console.log("allStores:", allStores);
  renderStores(allStores);
}

/* ===================== RENDER ===================== */
function renderStores(stores) {
  const list = document.getElementById("storeList");
  if (!list) return;
  list.innerHTML = "";

  storeMarkers.forEach(m => map.removeLayer(m));
  storeMarkers = [];

  stores.forEach(store => {
    let distanceText = "กรุณาเปิด GPS";
    if (userCoords && store.latitude && store.longitude) {
      const d = calculateDistance(userCoords.lat, userCoords.lng, store.latitude, store.longitude);
      distanceText = `ห่างจากคุณ ${d.toFixed(1)} กม.`;
    }

    // สร้าง Card HTML
    list.innerHTML += `
      <div class="store-card">
        <div class="store-header">
          <div>
            <h2 class="store-name">${store.shop_name}</h2>
            <div class="store-address"><i class="fa-solid fa-location-dot"></i> ${store.address || ""}</div>
          </div>
          <span class="store-tag">${store.category}</span>
        </div>
        <div class="store-types">
          ${store.food_wates_types.length ? store.food_waste_types.map(t => `<span class="type-chip">${t}</span>`).join("") : `<span class="type-chip empty">ไม่ระบุประเภท</span>`}
        </div>
        <div>
          <div class="store-distance">${distanceText}</div>
          <button class="sell-btn" onclick="location.href='shipping.html?storeId=${store.id}'">ขาย</button>
        </div>
        
      </div>`;

    // เพิ่ม Marker
    if (store.latitude && store.longitude) {
      const m = L.marker([store.latitude, store.longitude])
        .addTo(map)
        .bindPopup(`<b>${store.shop_name}</b><br>${distanceText}`);
      storeMarkers.push(m);
    }
  });

  // ✅ ย้ายมาตรงนี้! เรียกครั้งเดียวหลังจากลูปเสร็จ
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }
}

/* ===================== INIT ===================== */
document.addEventListener("DOMContentLoaded", () => {
  checkLogin();

  document.getElementById("searchInput")
    .addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      renderStores(
        allStores.filter(s =>
          s.shop_name.toLowerCase().includes(q)
        )
      );
    });
});
