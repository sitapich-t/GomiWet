"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var userId = null;
var LIFF_ID = "2008999812-I2Dz19pN";

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

function openOrder(orderId) {
  location.href = "status_details.html?order_id=".concat(orderId);
}

function loadAllOrders() {
  var snap, list, orders, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, order, storeSnap, storeName;

  return regeneratorRuntime.async(function loadAllOrders$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(db.ref("seller_payouts").orderByChild("seller_id").equalTo(userId).once("value"));

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
          orders = Object.entries(snap.val()).map(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
                id = _ref2[0],
                data = _ref2[1];

            return _objectSpread({
              id: id
            }, data);
          }).sort(function (a, b) {
            return new Date(b.order_at) - new Date(a.order_at);
          });
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context2.prev = 12;
          _iterator = orders[Symbol.iterator]();

        case 14:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context2.next = 24;
            break;
          }

          order = _step.value;
          _context2.next = 18;
          return regeneratorRuntime.awrap(db.ref("shops/" + order.shop_id).once("value"));

        case 18:
          storeSnap = _context2.sent;
          storeName = storeSnap.exists() ? storeSnap.val().shop_name : "-";
          list.innerHTML += "\n      <div class=\"order-card\" onclick=\"openOrder('".concat(order.id, "')\" style=\"cursor:pointer\">\n        <div class=\"order-row\">\n          <span>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48</span>\n          <span>").concat(order.pickup_at || "-", "</span>\n        </div>\n        <div class=\"order-row\">\n          <span>\u0E23\u0E49\u0E32\u0E19\u0E04\u0E49\u0E32</span>\n          <span>").concat(storeName || "-", "</span>\n        </div>\n        <div class=\"order-row\">\n          <span>\u0E2A\u0E16\u0E32\u0E19\u0E30</span>\n          <span>").concat(STATUS_LABEL[order.status] || order.status || "-", "</span>\n        </div>\n        <div class=\"order-row\">\n          <span>\u0E22\u0E2D\u0E14</span>\n          <span class=\"order-price\">\u0E3F").concat(Number(order.total_price).toFixed(2) || "-", "</span>\n        </div>\n      </div>\n    ");

        case 21:
          _iteratorNormalCompletion = true;
          _context2.next = 14;
          break;

        case 24:
          _context2.next = 30;
          break;

        case 26:
          _context2.prev = 26;
          _context2.t0 = _context2["catch"](12);
          _didIteratorError = true;
          _iteratorError = _context2.t0;

        case 30:
          _context2.prev = 30;
          _context2.prev = 31;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 33:
          _context2.prev = 33;

          if (!_didIteratorError) {
            _context2.next = 36;
            break;
          }

          throw _iteratorError;

        case 36:
          return _context2.finish(33);

        case 37:
          return _context2.finish(30);

        case 38:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[12, 26, 30, 38], [31,, 33, 37]]);
}

init();