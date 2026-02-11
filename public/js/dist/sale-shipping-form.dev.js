"use strict";

var wasteTypes = [];
var LIFF_ID = "2008999812-I2Dz19pN";
var COMPANY_LAT = 14.024777585012503;
var COMPANY_LNG = 99.97828225092593;
var currentLat = null;
var currentLng = null;
var shippingFee = 0;
var distanceKm = 0;
var params = new URLSearchParams(window.location.search);
var storeId = params.get("storeId");
document.addEventListener("DOMContentLoaded", function _callee() {
  var now;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(liff.init({
            liffId: LIFF_ID
          }));

        case 2:
          if (liff.isLoggedIn()) {
            _context.next = 5;
            break;
          }

          liff.login();
          return _context.abrupt("return");

        case 5:
          // set default date/time
          now = new Date();
          document.getElementById("date").value = now.toISOString().split("T")[0];
          document.getElementById("time").value = now.toTimeString().slice(0, 5);
          loadWasteTypes();

        case 9:
        case "end":
          return _context.stop();
      }
    }
  });
});

function getUserId() {
  var profile;
  return regeneratorRuntime.async(function getUserId$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(liff.getProfile());

        case 2:
          profile = _context2.sent;
          return _context2.abrupt("return", profile.userId);

        case 4:
        case "end":
          return _context2.stop();
      }
    }
  });
}

function loadWasteTypes() {
  var list, acceptedSnap, acceptedWasteIds, wasteSnap;
  return regeneratorRuntime.async(function loadWasteTypes$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          list = document.getElementById("wasteList");
          list.innerHTML = "กำลังโหลด..."; // 1️⃣ ดึง waste_id ที่ร้านนี้รับซื้อ

          _context3.next = 4;
          return regeneratorRuntime.awrap(db.ref("shop_accepted").orderByChild("shop_id").equalTo(Number(storeId)) // ถ้า storeId เป็น string
          .once("value"));

        case 4:
          acceptedSnap = _context3.sent;
          acceptedWasteIds = [];
          acceptedSnap.forEach(function (s) {
            acceptedWasteIds.push(String(s.val().waste_id));
          }); // ถ้าร้านไม่รับซื้ออะไรเลย

          if (!(acceptedWasteIds.length === 0)) {
            _context3.next = 10;
            break;
          }

          list.innerHTML = "ร้านนี้ไม่รับซื้อเศษอาหาร";
          return _context3.abrupt("return");

        case 10:
          _context3.next = 12;
          return regeneratorRuntime.awrap(db.ref("food_waste_types").once("value"));

        case 12:
          wasteSnap = _context3.sent;
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
          return _context3.stop();
      }
    }
  });
}

function limitOneInput(current) {
  document.querySelectorAll(".waste-input").forEach(function (i) {
    if (i !== current) {
      i.value = "";
    }
  });
}

function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert("อุปกรณ์ไม่รองรับ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(function (pos) {
    currentLat = pos.coords.latitude;
    currentLng = pos.coords.longitude;
    document.getElementById("address").value = "Lat:".concat(currentLat, ", Lng:").concat(currentLng);
    distanceKm = calculateDistance(COMPANY_LAT, COMPANY_LNG, currentLat, currentLng);
    shippingFee = 0;

    if (distanceKm > 0.1) {
      shippingFee = Math.ceil(distanceKm - 0.1) * 5;
    }

    document.getElementById("shippingText").innerText = "\u0E23\u0E30\u0E22\u0E30\u0E17\u0E32\u0E07 ".concat(distanceKm.toFixed(2), " km | \u0E04\u0E48\u0E32\u0E02\u0E19\u0E2A\u0E48\u0E07 ").concat(shippingFee, " \u0E1A\u0E32\u0E17");
  }, function () {
    alert("ไม่สามารถดึงตำแหน่งได้");
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function submitSale() {
  var shopId, userId, address, deliveryType, date, time, note, selectedWaste, priceSnap, pricePerKg, totalPrice, orderRef;
  return regeneratorRuntime.async(function submitSale$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          if (!(currentLat === null || currentLng === null)) {
            _context4.next = 3;
            break;
          }

          alert("กรุณากดใช้ตำแหน่งปัจจุบันก่อน");
          return _context4.abrupt("return");

        case 3:
          shopId = storeId;
          _context4.next = 6;
          return regeneratorRuntime.awrap(getUserId());

        case 6:
          userId = _context4.sent;
          address = document.getElementById("address").value;
          deliveryType = localStorage.getItem("delivery_type");
          date = document.getElementById("date").value;
          time = document.getElementById("time").value;
          note = document.getElementById("note").value; // -------------------------
          // หา waste ที่ผู้ใช้เลือก
          // -------------------------

          selectedWaste = null;
          wasteTypes.forEach(function (w) {
            var input = document.getElementById("w_".concat(w.id));

            if (input && input.value) {
              selectedWaste = {
                waste_id: w.id,
                weight: Number(input.value)
              };
            }
          });

          if (selectedWaste) {
            _context4.next = 17;
            break;
          }

          alert("กรุณาเลือกประเภทเศษอาหาร");
          return _context4.abrupt("return");

        case 17:
          _context4.next = 19;
          return regeneratorRuntime.awrap(db.ref("food_waste_types/".concat(selectedWaste.waste_id, "/price")).once("value"));

        case 19:
          priceSnap = _context4.sent;
          pricePerKg = Number(priceSnap.val()) || 0;
          totalPrice = selectedWaste.weight * pricePerKg;
          console.log("Waste:", selectedWaste.waste_id);
          console.log("Price:", pricePerKg);
          console.log("Total:", totalPrice); // -------------------------
          // คำนวณระยะทาง
          // -------------------------

          distanceKm = calculateDistance(COMPANY_LAT, COMPANY_LNG, currentLat, currentLng);
          shippingFee = 0;

          if (distanceKm > 0.1) {
            shippingFee = Math.ceil(distanceKm - 0.1) * 5;
          } // -------------------------
          // สร้าง order
          // -------------------------


          orderRef = db.ref("order").push();
          _context4.next = 31;
          return regeneratorRuntime.awrap(orderRef.set({
            user_id: userId,
            shop_id: shopId,
            delivery_type: deliveryType,
            order_at: "".concat(date, " ").concat(time),
            status: shippingFee > 0 ? "รอชำระเงิน" : "รอขนส่งเข้ารับ",
            note: note,
            address: address,
            distance_km: distanceKm,
            shipping_fee: shippingFee,
            total_price: totalPrice
          }));

        case 31:
          _context4.next = 33;
          return regeneratorRuntime.awrap(db.ref("order_items").push({
            order_id: orderRef.key,
            waste_id: selectedWaste.waste_id,
            weight: selectedWaste.weight,
            price_per_kg: pricePerKg,
            total_price: totalPrice
          }));

        case 33:
          // -------------------------
          // redirect
          // -------------------------
          if (shippingFee > 0) {
            location.href = "payment.html?orderId=".concat(orderRef.key);
          } else {
            alert("บันทึกสำเร็จ");
            location.href = "home.html";
          }

        case 34:
        case "end":
          return _context4.stop();
      }
    }
  });
}