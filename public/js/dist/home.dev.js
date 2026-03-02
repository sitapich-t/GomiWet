"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// ✅ แก้ไข: ต้องประกาศ LIFF_ID ไว้ที่นี่เพื่อให้ฟังก์ชันข้างล่างเรียกใช้ได้
var LIFF_ID = "2008999812-I2Dz19pN";
var COMPANY_COORDS = {
  lat: 13.868180264449515,
  lng: 100.0101689952242
};
var map, userMarker;
var allStores = [];
var categoriesMap = {};
var userCoords = null;
var storeMarkers = [];
var wasteTypes = [];

function checkLogin() {
  return regeneratorRuntime.async(function checkLogin$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          console.log("Initializing LIFF...");
          _context.next = 4;
          return regeneratorRuntime.awrap(liff.init({
            liffId: LIFF_ID
          }));

        case 4:
          if (liff.isLoggedIn()) {
            _context.next = 7;
            break;
          }

          window.location.replace("index.html");
          return _context.abrupt("return");

        case 7:
          initMap();
          loadStores();
          getUserLocation();
          checkLocationPermission();
          _context.next = 16;
          break;

        case 13:
          _context.prev = 13;
          _context.t0 = _context["catch"](0);
          console.error("LIFF Init Error:", _context.t0);

        case 16:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 13]]);
}

function initMap() {
  map = L.map("map", {
    zoomControl: false
  }).setView([COMPANY_COORDS.lat, COMPANY_COORDS.lng], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
  L.marker([COMPANY_COORDS.lat, COMPANY_COORDS.lng]).addTo(map).bindPopup("โกดัง Gomi Wet").openPopup(); // เปิด popup ให้เห็นชัด ๆ
}

function getUserLocation() {
  if (!navigator.geolocation) {
    alert("อุปกรณ์ไม่รองรับ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition( // ✅ SUCCESS
  function (pos) {
    userCoords = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };
    map.setView([userCoords.lat, userCoords.lng], 14);
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.marker([userCoords.lat, userCoords.lng]).addTo(map).bindPopup("คุณอยู่ที่นี่").openPopup();
    renderStores(allStores); // 🔥 ซ่อนปุ่ม retry ถ้าเคยแสดง

    document.getElementById("retryLocationBtn").style.display = "none";
  }, // ❌ ERROR
  function (err) {
    if (err.code === 1) {
      // Permission denied
      document.getElementById("retryLocationBtn").style.display = "block";
    }

    console.log("Location error:", err);
  });
}

function checkLocationPermission() {
  var result;
  return regeneratorRuntime.async(function checkLocationPermission$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (navigator.permissions) {
            _context2.next = 2;
            break;
          }

          return _context2.abrupt("return");

        case 2:
          _context2.next = 4;
          return regeneratorRuntime.awrap(navigator.permissions.query({
            name: "geolocation"
          }));

        case 4:
          result = _context2.sent;

          if (result.state === "denied") {
            document.getElementById("retryLocationBtn").style.display = "block";
          }

        case 6:
        case "end":
          return _context2.stop();
      }
    }
  });
}

function requestLocation() {
  var permission;
  return regeneratorRuntime.async(function requestLocation$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(navigator.permissions.query({
            name: "geolocation"
          }));

        case 2:
          permission = _context3.sent;

          if (!(permission.state === "denied")) {
            _context3.next = 6;
            break;
          }

          alert("คุณปิดการเข้าถึงตำแหน่งไว้\nกรุณาไปเปิดใน Settings");
          return _context3.abrupt("return");

        case 6:
          navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            console.log("ตำแหน่ง:", lat, lng);
            initMap(lat, lng); // เรียกฟังก์ชันที่คุณใช้สร้าง map
          }, function (err) {
            if (err.code === 1) {
              alert("คุณปฏิเสธการเข้าถึงตำแหน่ง");
            }

            console.error("Location error:", err);
          });

        case 7:
        case "end":
          return _context3.stop();
      }
    }
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function loadCategories() {
  var snap, data;
  return regeneratorRuntime.async(function loadCategories$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(db.ref("shop_categories").once("value"));

        case 2:
          snap = _context4.sent;

          if (snap.exists()) {
            _context4.next = 5;
            break;
          }

          return _context4.abrupt("return");

        case 5:
          data = snap.val(); // แปลงเป็น map: { 1: "ฟาร์มหมู", 2: "..." }

          categoriesMap = Object.keys(data).reduce(function (acc, key) {
            acc[key] = data[key].category;
            return acc;
          }, {});

        case 7:
        case "end":
          return _context4.stop();
      }
    }
  });
}

function getWasteTypesByShop(shopId) {
  var acceptedSnap, wasteIds, wasteSnap, result;
  return regeneratorRuntime.async(function getWasteTypesByShop$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.next = 2;
          return regeneratorRuntime.awrap(db.ref("shop_accepted").orderByChild("shop_id").equalTo(Number(shopId)).once("value"));

        case 2:
          acceptedSnap = _context5.sent;

          if (acceptedSnap.exists()) {
            _context5.next = 5;
            break;
          }

          return _context5.abrupt("return", []);

        case 5:
          wasteIds = [];
          acceptedSnap.forEach(function (s) {
            wasteIds.push(String(s.val().waste_id));
          });
          _context5.next = 9;
          return regeneratorRuntime.awrap(db.ref("food_waste_types").once("value"));

        case 9:
          wasteSnap = _context5.sent;
          result = [];
          wasteSnap.forEach(function (w) {
            if (wasteIds.includes(w.key)) {
              result.push(w.val().category);
            }
          });
          return _context5.abrupt("return", result);

        case 13:
        case "end":
          return _context5.stop();
      }
    }
  });
}

function loadWasteTypes() {
  var list, acceptedSnap, acceptedWasteIds, wasteSnap;
  return regeneratorRuntime.async(function loadWasteTypes$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          list = document.getElementById("wasteList");
          list.innerHTML = "กำลังโหลด..."; // 1️⃣ ดึง waste_id ที่ร้านนี้รับซื้อ

          _context6.next = 4;
          return regeneratorRuntime.awrap(db.ref("shop_accepted").orderByChild("shop_id").equalTo(Number(storeId)) // ถ้า storeId เป็น string
          .once("value"));

        case 4:
          acceptedSnap = _context6.sent;
          acceptedWasteIds = [];
          acceptedSnap.forEach(function (s) {
            acceptedWasteIds.push(String(s.val().waste_id));
          }); // ถ้าร้านไม่รับซื้ออะไรเลย

          if (!(acceptedWasteIds.length === 0)) {
            _context6.next = 10;
            break;
          }

          list.innerHTML = "ร้านนี้ไม่รับซื้อเศษอาหาร";
          return _context6.abrupt("return");

        case 10:
          _context6.next = 12;
          return regeneratorRuntime.awrap(db.ref("food_waste_types").once("value"));

        case 12:
          wasteSnap = _context6.sent;
          list.innerHTML = "";
          wasteTypes = []; // 3️⃣ แสดงเฉพาะที่ร้านรับซื้อ

          wasteSnap.forEach(function (w) {
            if (acceptedWasteIds.includes(w.key)) {
              wasteTypes.push({
                id: w.key,
                name: w.val().category
              });
              list.innerHTML += "\n        <div class=\"waste-row\">\n          <span>".concat(w.val().category, "</span>\n          <input type=\"number\"\n                 class=\"waste-input\"\n                 id=\"w_").concat(w.key, "\"\n                 placeholder=\"\u0E01\u0E01.\"\n                 oninput=\"limitOneInput(this)\">\n        </div>\n      ");
            }
          });

        case 16:
        case "end":
          return _context6.stop();
      }
    }
  });
}

function loadStores() {
  var snapshot, data;
  return regeneratorRuntime.async(function loadStores$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return regeneratorRuntime.awrap(loadCategories());

        case 2:
          _context7.next = 4;
          return regeneratorRuntime.awrap(db.ref("shops").once("value"));

        case 4:
          snapshot = _context7.sent;

          if (snapshot.exists()) {
            _context7.next = 7;
            break;
          }

          return _context7.abrupt("return");

        case 7:
          data = snapshot.val();
          allStores = Object.keys(data).map(function (key) {
            var store = data[key];
            return _objectSpread({
              id: key
            }, store, {
              category_name: categoriesMap[store.category_id] || "ไม่ระบุหมวด"
            });
          });
          console.log("✅ ร้านพร้อมหมวด:", allStores);
          renderStores(allStores);

        case 11:
        case "end":
          return _context7.stop();
      }
    }
  });
}

function renderStores(stores) {
  var storeList, storeCards;
  return regeneratorRuntime.async(function renderStores$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          storeList = document.getElementById("storeList");
          storeList.innerHTML = "";
          storeMarkers.forEach(function (m) {
            return map.removeLayer(m);
          });
          storeMarkers = [];
          _context9.next = 6;
          return regeneratorRuntime.awrap(Promise.all(stores.map(function _callee(store) {
            var distanceInfo, dist, wasteList;
            return regeneratorRuntime.async(function _callee$(_context8) {
              while (1) {
                switch (_context8.prev = _context8.next) {
                  case 0:
                    distanceInfo = "กรุณาเปิด GPS";

                    if (userCoords) {
                      dist = calculateDistance(userCoords.lat, userCoords.lng, COMPANY_COORDS.lat, COMPANY_COORDS.lng);
                      distanceInfo = "\u0E2B\u0E48\u0E32\u0E07\u0E08\u0E32\u0E01\u0E1A\u0E23\u0E34\u0E29\u0E31\u0E17 ".concat(dist.toFixed(1), " \u0E01\u0E21.");
                    }

                    _context8.next = 4;
                    return regeneratorRuntime.awrap(getWasteTypesByShop(store.id));

                  case 4:
                    wasteList = _context8.sent;
                    return _context8.abrupt("return", "\n        <div class=\"store-card\">\n          <div class=\"store-header\">\n            <h2 class=\"store-name\">".concat(store.shop_name, "</h2>\n            <span class=\"badge-yellow\">").concat(store.category_name, "</span>\n          </div>\n\n          <div class=\"store-types\">\n            ").concat(wasteList.length ? wasteList.map(function (w) {
                      return "<span class=\"type-pill\">".concat(w, "</span>");
                    }).join("") : "<span class=\"type-pill\">\u0E44\u0E21\u0E48\u0E23\u0E31\u0E1A\u0E40\u0E28\u0E29\u0E2D\u0E32\u0E2B\u0E32\u0E23</span>", "\n          </div>\n\n          <div class=\"card-footer\">\n            \uD83D\uDCDE ").concat(store.telephone, "\n            <button class=\"sell-btn\" onclick=\"startSell('").concat(store.id, "')\">\n              \u0E02\u0E32\u0E22\n            </button>\n          </div>\n        </div>\n      "));

                  case 6:
                  case "end":
                    return _context8.stop();
                }
              }
            });
          })));

        case 6:
          storeCards = _context9.sent;
          storeList.innerHTML = storeCards.join("");

        case 8:
        case "end":
          return _context9.stop();
      }
    }
  });
}

function startSell(storeId) {
  console.log("CLICK SELL:", storeId);
  location.href = "shipping.html?storeId=".concat(storeId);
}

function handleSearchInput(e) {
  var term = e.target.value.toLowerCase().trim();
  console.log("🔍 search:", term);

  if (!allStores || allStores.length === 0) {
    console.warn("❌ allStores ว่าง");
    return;
  }

  if (!term) {
    renderStores(allStores);
    return;
  }

  var filtered = allStores.filter(function (store) {
    var name = String(store.shop_name || "").toLowerCase();
    return name.includes(term);
  });
  console.log("✅ filtered:", filtered.length);
  renderStores(filtered);
}

document.addEventListener("DOMContentLoaded", function () {
  checkLogin();
  var searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", handleSearchInput);
  }
});