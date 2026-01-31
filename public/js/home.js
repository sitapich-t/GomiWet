const db = firebase.firestore();

let map;

// ขอโลเคชันผู้ใช้
navigator.geolocation.getCurrentPosition(
  (pos) => {
    const userLat = pos.coords.latitude;
    const userLng = pos.coords.longitude;

    initMap(userLat, userLng);
    loadStores(userLat, userLng);
  },
  () => {
    alert("กรุณาเปิดตำแหน่งที่ตั้ง");
  }
);

// สร้าง Map
function initMap(lat, lng) {
  map = L.map("map").setView([lat, lng], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  // marker ผู้ใช้
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup("ตำแหน่งของคุณ")
    .openPopup();
}

// โหลดร้านค้า
async function loadStores(userLat, userLng) {
  const snapshot = await db.collection("stores").get();
  const storeList = document.getElementById("storeList");

  snapshot.forEach((doc) => {
    const store = doc.data();

    // แสดงรายการ
    storeList.innerHTML += `
      <div class="store">
        <h3>${store.name}</h3>
        <p>${store.address}</p>
      </div>
    `;

    // marker ร้านค้า
    L.marker([store.lat, store.lng])
      .addTo(map)
      .bindPopup(store.name);
  });
}
