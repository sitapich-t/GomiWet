"use strict";

var params = new URLSearchParams(window.location.search);
var orderId = params.get("orderId");

function goBack() {
  history.back(); // 🔙 กลับหน้าที่แล้ว
}

var STATUS_LABEL = {
  'order_received': 'ได้รับคำสั่งซื้อ',
  'picked_up': 'กำลังส่งไปโกดัง',
  'inbound': 'ถึงโกดังและคัดแยก',
  'sorted': 'คัดแยกเสร็จสิ้น',
  'evaluated': 'ประเมินราคา',
  'outbound': 'กำลังขาย',
  'sold': 'ขายให้ผู้ซื้อ',
  'completed': 'จ่ายเงินเสร็จสิ้น'
};

function loadOrderStatus() {
  var snap, order, shopSnap, shopData, shopName;
  return regeneratorRuntime.async(function loadOrderStatus$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(db.ref("order/" + orderId).once("value"));

        case 2:
          snap = _context.sent;

          if (snap.exists()) {
            _context.next = 6;
            break;
          }

          document.getElementById("orderInfo").innerText = "ไม่พบคำสั่งขาย";
          return _context.abrupt("return");

        case 6:
          order = snap.val();
          _context.next = 9;
          return regeneratorRuntime.awrap(db.ref("shops/".concat(order.shop_id)).once("value"));

        case 9:
          shopSnap = _context.sent;
          shopData = shopSnap.val();
          shopName = shopData ? shopData.shop_name : "-";
          document.getElementById("orderInfo").innerHTML = "\n    <p>\u0E23\u0E2B\u0E31\u0E2A\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22: <b>".concat(order.display_id, "</b></p>\n    <p>\u0E23\u0E49\u0E32\u0E19: ").concat(shopName, "</p>\n    <p>\u0E2A\u0E16\u0E32\u0E19\u0E30: <b>").concat(STATUS_LABEL[order.status] || order.status || "-", "</b></p>\n  ");

        case 13:
        case "end":
          return _context.stop();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", loadOrderStatus);