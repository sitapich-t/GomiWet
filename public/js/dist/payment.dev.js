"use strict";

var params = new URLSearchParams(window.location.search);
var orderId = params.get("orderId");
document.getElementById("orderId").innerText = orderId;
var shippingFee = 0;

function loadOrder() {
  var snap, data;
  return regeneratorRuntime.async(function loadOrder$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (orderId) {
            _context.next = 3;
            break;
          }

          alert("ไม่พบ orderId");
          return _context.abrupt("return");

        case 3:
          _context.next = 5;
          return regeneratorRuntime.awrap(db.ref("order/" + orderId).once("value"));

        case 5:
          snap = _context.sent;

          if (snap.exists()) {
            _context.next = 9;
            break;
          }

          alert("ไม่พบ order");
          return _context.abrupt("return");

        case 9:
          data = snap.val();
          shippingFee = data.shipping_fee || 0;
          document.getElementById("fee").innerText = shippingFee + " บาท";

        case 12:
        case "end":
          return _context.stop();
      }
    }
  });
}

function payNow() {
  var now;
  return regeneratorRuntime.async(function payNow$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (orderId) {
            _context2.next = 3;
            break;
          }

          alert("ไม่พบ orderId");
          return _context2.abrupt("return");

        case 3:
          now = Date.now();
          _context2.next = 6;
          return regeneratorRuntime.awrap(db.ref("order/" + orderId).update({
            payment_status: "paid",
            status: "order_received",
            "status_history/order_received": now
          }));

        case 6:
          alert("ชำระเงินเรียบร้อย");
          location.href = "home.html";

        case 8:
        case "end":
          return _context2.stop();
      }
    }
  });
}

loadOrder();