// ✅ แก้ไข: ต้องประกาศ LIFF_ID ไว้ที่นี่เพื่อให้ฟังก์ชันข้างล่างเรียกใช้ได้
const LIFF_ID = "2008999812-I2Dz19pN"; 

let map, userMarker;
let allStores = [];
let userCoords = null;

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

async function loadStores() {
    try {
        // ดึงข้อมูลจาก Firestore (ตรวจสอบชื่อ collection 'stores' ให้ตรง)
        const snapshot = await db.collection("stores").get();
        allStores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderStores(allStores);
    } catch (error) {
        console.error("Firestore Error:", error);
        document.getElementById("storeList").innerHTML = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
    }
}

function renderStores(stores) {
    const storeList = document.getElementById("storeList");
    storeList.innerHTML = "";

    stores.forEach(store => {
        let distanceInfo = "กรุณาเปิด GPS";
        if (userCoords && store.lat && store.lng) {
            const dist = calculateDistance(userCoords.lat, userCoords.lng, store.lat, store.lng);
            distanceInfo = `ห่างจากคุณ ${dist.toFixed(1)} กิโลเมตร`;
        }

        // สร้าง HTML Card
        storeList.innerHTML += `
            <div class="store-card">
                <span class="badge">${store.type || 'ผู้รับซื้อ'}</span>
                <h3 style="margin:0">${store.store_name}</h3>
                <div class="store-address">
                    <i class="fa-solid fa-location-dot" style="color:var(--main-teal)"></i>
                    ${store.address}
                </div>
                <div class="store-tags">
                    ${(store.tags || ['เศษอาหาร']).map(t => `<span class="tag">${t}</span>`).join('')}
                </div>
                <div class="buy-count">รับซื้อแล้ว ${store.sellCount || 0} ครั้ง</div>
                <div style="font-size:12px; color:#999; margin-top:5px;">${distanceInfo}</div>
                <button class="btn-sell">ขาย</button>
            </div>
        `;

        // ปักหมุดร้านค้าบน Map
        L.marker([store.lat, store.lng]).addTo(map).bindPopup(store.name);
    });
}

function filterStores() {
    const term = document.getElementById("searchInput").value.toLowerCase();
    const filtered = allStores.filter(s => 
        s.name.toLowerCase().includes(term) || 
        (s.category && s.category.toLowerCase().includes(term))
    );
    renderStores(filtered);
}

function logout() {
    liff.logout();
    window.location.replace("index.html");
}

document.addEventListener("DOMContentLoaded", checkLogin);