"use strict";

var wasteTypes = [];
var LIFF_ID = "2008999812-I2Dz19pN";
var params = new URLSearchParams(window.location.search);
var storeId = params.get("storeId");
var isSubmitting = false;

function generateDisplayOrderId() {
  var now, yyyy, mm, dd, dateKey, counterRef, result, runningNumber;
  return regeneratorRuntime.async(function generateDisplayOrderId$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          now = new Date();
          yyyy = now.getFullYear();
          mm = String(now.getMonth() + 1).padStart(2, '0');
          dd = String(now.getDate()).padStart(2, '0');
          dateKey = "".concat(yyyy).concat(mm).concat(dd);
          counterRef = db.ref("order_counters/".concat(dateKey));
          _context.next = 8;
          return regeneratorRuntime.awrap(counterRef.transaction(function (current) {
            return (current || 0) + 1;
          }));

        case 8:
          result = _context.sent;
          runningNumber = String(result.snapshot.val()).padStart(4, '0');
          return _context.abrupt("return", "ORD".concat(dateKey, "-").concat(runningNumber));

        case 11:
        case "end":
          return _context.stop();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function _callee() {
  var now;
  return regeneratorRuntime.async(function _callee$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(liff.init({
            liffId: LIFF_ID
          }));

        case 2:
          if (liff.isLoggedIn()) {
            _context2.next = 5;
            break;
          }

          liff.login();
          return _context2.abrupt("return");

        case 5:
          now = new Date();
          document.getElementById("date").value = now.toISOString().split("T")[0];
          document.getElementById("time").value = now.toTimeString().slice(0, 5);
          loadWasteTypes();

        case 9:
        case "end":
          return _context2.stop();
      }
    }
  });
});

function getUserId() {
  var profile;
  return regeneratorRuntime.async(function getUserId$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(liff.getProfile());

        case 2:
          profile = _context3.sent;
          return _context3.abrupt("return", profile.userId);

        case 4:
        case "end":
          return _context3.stop();
      }
    }
  });
}

function loadWasteTypes() {
  var list, acceptedSnap, acceptedWasteIds, wasteSnap;
  return regeneratorRuntime.async(function loadWasteTypes$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          list = document.getElementById("wasteList");
          list.innerHTML = "กำลังโหลด...";
          _context4.next = 4;
          return regeneratorRuntime.awrap(db.ref("shop_accepted").orderByChild("shop_id").equalTo(Number(storeId)).once("value"));

        case 4:
          acceptedSnap = _context4.sent;
          acceptedWasteIds = [];
          acceptedSnap.forEach(function (s) {
            acceptedWasteIds.push(String(s.val().waste_id));
          });

          if (!(acceptedWasteIds.length === 0)) {
            _context4.next = 10;
            break;
          }

          list.innerHTML = "ร้านนี้ไม่รับซื้อเศษอาหาร";
          return _context4.abrupt("return");

        case 10:
          _context4.next = 12;
          return regeneratorRuntime.awrap(db.ref("food_waste_types").once("value"));

        case 12:
          wasteSnap = _context4.sent;
          list.innerHTML = "";
          wasteTypes = [];
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
          return _context4.stop();
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

function saveSaleDraft() {
  var date = document.getElementById("date").value;
  var time = document.getElementById("time").value;
  var note = document.getElementById("note").value;
  var selectedWaste = null;
  wasteTypes.forEach(function (w) {
    var input = document.getElementById("w_".concat(w.id));

    if (input && input.value) {
      selectedWaste = {
        waste_id: w.id,
        weight: input.value
      };
    }
  });
  var draft = {
    date: date,
    time: time,
    note: note,
    selectedWaste: selectedWaste
  };
  localStorage.setItem("sale_draft", JSON.stringify(draft));
}

function submitSale() {
  var shopId, userId, deliveryType, date, time, note, selectedWaste, isProfileComplete, hasBank, currentPage, priceSnap, pricePerKg, totalPrice, displayId, orderRef;
  return regeneratorRuntime.async(function submitSale$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          if (!isSubmitting) {
            _context5.next = 2;
            break;
          }

          return _context5.abrupt("return");

        case 2:
          isSubmitting = true;
          _context5.prev = 3;
          shopId = storeId;
          _context5.next = 7;
          return regeneratorRuntime.awrap(getUserId());

        case 7:
          userId = _context5.sent;
          deliveryType = localStorage.getItem("delivery_type");
          date = document.getElementById("date").value;
          time = document.getElementById("time").value;
          note = document.getElementById("note").value;
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
            _context5.next = 18;
            break;
          }

          alert("กรุณาเลือกประเภทเศษอาหาร");
          isSubmitting = false;
          return _context5.abrupt("return");

        case 18:
          _context5.next = 20;
          return regeneratorRuntime.awrap(checkProfileComplete(userId));

        case 20:
          isProfileComplete = _context5.sent;
          _context5.next = 23;
          return regeneratorRuntime.awrap(checkUserBankAccount(userId));

        case 23:
          hasBank = _context5.sent;

          if (!(!isProfileComplete || !hasBank)) {
            _context5.next = 30;
            break;
          }

          saveSaleDraft();
          alert("กรุณากรอกข้อมูลส่วนตัวและบัญชีธนาคารให้ครบก่อนทำรายการขาย");
          currentPage = encodeURIComponent(window.location.href);
          window.location.href = "profile-edit.html?redirect=".concat(currentPage);
          return _context5.abrupt("return");

        case 30:
          _context5.next = 32;
          return regeneratorRuntime.awrap(db.ref("food_waste_types/".concat(selectedWaste.waste_id, "/price")).once("value"));

        case 32:
          priceSnap = _context5.sent;
          pricePerKg = Number(priceSnap.val()) || 0;
          totalPrice = selectedWaste.weight * pricePerKg;
          _context5.next = 37;
          return regeneratorRuntime.awrap(generateDisplayOrderId());

        case 37:
          displayId = _context5.sent;
          orderRef = db.ref("order").push();
          _context5.next = 41;
          return regeneratorRuntime.awrap(orderRef.set({
            display_id: displayId,
            user_id: userId,
            shop_id: shopId,
            order_at: firebase.database.ServerValue.TIMESTAMP,
            pickup_at: "".concat(date, " ").concat(time),
            delivery_type: deliveryType,
            status: "order_received",
            note: note,
            total_price: totalPrice
          }));

        case 41:
          _context5.next = 43;
          return regeneratorRuntime.awrap(db.ref("order_items").push({
            order_id: orderRef.key,
            waste_id: selectedWaste.waste_id,
            weight: selectedWaste.weight,
            price_per_kg: pricePerKg,
            total_price: totalPrice
          }));

        case 43:
          alert("บันทึกสำเร็จ");
          location.href = "home.html";
          _context5.next = 52;
          break;

        case 47:
          _context5.prev = 47;
          _context5.t0 = _context5["catch"](3);
          console.error(_context5.t0);
          alert("เกิดข้อผิดพลาด");
          isSubmitting = false;

        case 52:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[3, 47]]);
}

function checkProfileComplete(userId) {
  var snap, seller;
  return regeneratorRuntime.async(function checkProfileComplete$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.next = 2;
          return regeneratorRuntime.awrap(db.ref("sellers/".concat(userId)).once("value"));

        case 2:
          snap = _context6.sent;

          if (snap.exists()) {
            _context6.next = 5;
            break;
          }

          return _context6.abrupt("return", false);

        case 5:
          seller = snap.val();

          if (!(!seller.fullname || !seller.phone || !seller.address)) {
            _context6.next = 8;
            break;
          }

          return _context6.abrupt("return", false);

        case 8:
          return _context6.abrupt("return", true);

        case 9:
        case "end":
          return _context6.stop();
      }
    }
  });
}

function checkUserBankAccount(userId) {
  var snap;
  return regeneratorRuntime.async(function checkUserBankAccount$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _context7.next = 2;
          return regeneratorRuntime.awrap(db.ref("bank_accounts/".concat(userId)).once("value"));

        case 2:
          snap = _context7.sent;
          return _context7.abrupt("return", snap.exists());

        case 4:
        case "end":
          return _context7.stop();
      }
    }
  });
}