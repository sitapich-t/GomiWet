"use strict";

var userId = null;
var LIFF_ID = "2008999812-I2Dz19pN";

function goBack() {
  history.back(); // 🔙 กลับหน้าที่แล้ว
}

function init() {
  var profile;
  return regeneratorRuntime.async(function init$(_context) {
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
          _context.next = 7;
          return regeneratorRuntime.awrap(liff.getProfile());

        case 7:
          profile = _context.sent;
          userId = profile.userId;
          loadAllOrders();

        case 10:
        case "end":
          return _context.stop();
      }
    }
  });
}

function loadAllOrders() {
  var snap, list;
  return regeneratorRuntime.async(function loadAllOrders$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(db.ref("order").orderByChild("user_id").equalTo(userId).once("value"));

        case 2:
          snap = _context2.sent;
          list = document.getElementById("orderList");
          list.innerHTML = "";

          if (snap.exists()) {
            _context2.next = 8;
            break;
          }

          list.innerHTML = "ยังไม่มีรายการขาย";
          return _context2.abrupt("return");

        case 8:
          snap.forEach(function (child) {
            var d = child.val();
            list.innerHTML += "\n  <div class=\"order-card\">\n    <div class=\"order-row\">\n      <span>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</span>\n      <span>".concat(d.order_at, "</span>\n    </div>\n\n    <div class=\"order-row\">\n      <span>\u0E2A\u0E16\u0E32\u0E19\u0E30</span>\n      <span class=\"order-status status-").concat(d.status, "\">\n        ").concat(d.status, "\n      </span>\n    </div>\n\n    <div class=\"order-row\">\n      <span>\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21</span>\n      <span class=\"order-price\">\n        \u0E3F").concat(Number(d.total_price).toFixed(2), "\n      </span>\n    </div>\n  </div>\n");
          });

        case 9:
        case "end":
          return _context2.stop();
      }
    }
  });
}

init();