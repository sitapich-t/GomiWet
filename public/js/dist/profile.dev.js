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

function loadProfile() {
  var profile, userSnap, user, sellerSnap, seller;
  return regeneratorRuntime.async(function loadProfile$(_context) {
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
          /* ====================
             USERS
          ==================== */

          _context.next = 11;
          return regeneratorRuntime.awrap(db.ref("users/" + userId).once("value"));

        case 11:
          userSnap = _context.sent;
          user = userSnap.val();

          if (user) {
            document.getElementById("userName").innerText = user.display_name || "-";
            document.getElementById("userImg").src = user.picture_url || "https://via.placeholder.com/80";
          }
          /* ====================
             SELLERS
          ==================== */


          _context.next = 16;
          return regeneratorRuntime.awrap(db.ref("sellers/" + userId).once("value"));

        case 16:
          sellerSnap = _context.sent;
          seller = sellerSnap.val();

          if (seller) {
            document.getElementById("userPhone").innerText = seller.phone || "-";
            document.getElementById("userAddress").innerText = seller.address || "-";
          }

          loadMyOrders(userId);

        case 20:
        case "end":
          return _context.stop();
      }
    }
  });
}

function loadHistory(userId) {
  var list = document.getElementById("historyList");
  list.innerHTML = "";
  var totalSales = 0;
  var totalIncome = 0;
  db.ref("order").orderByChild("user_id").equalTo(userId).limitToLast(5).once("value", function (snap) {
    if (!snap.exists()) {
      list.innerHTML = "<p class=\"loading-text\">\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22</p>";
      document.getElementById("historyCount").innerText = "0 รายการ";
      return;
    }

    snap.forEach(function (child) {
      var d = child.val();
      totalSales++;
      totalIncome += d.total || 0;
      list.innerHTML += "\n          <div style=\"padding:10px 0;border-bottom:1px solid #eee\">\n            <strong>".concat(d.itemName || "รายการขาย", "</strong><br>\n            <small>\u0E3F").concat(d.total, "</small>\n          </div>\n        ");
    });
    document.getElementById("totalSales").innerText = totalSales;
    document.getElementById("totalIncome").innerText = totalIncome;
    document.getElementById("historyCount").innerText = "".concat(totalSales, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");
  });
}

function openAllOrders() {
  location.href = "all-orders.html";
}

function openOrder(orderId) {
  window.location.href = "order-status.html?orderId=".concat(orderId);
}

function loadMyOrders(shopId) {
  var list, snap, orders, count, totalIncome, _i2, _Object$entries, child, orderId, data, storeSnap, storeName;

  return regeneratorRuntime.async(function loadMyOrders$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          list = document.getElementById("historyList");
          list.innerHTML = "กำลังโหลด...";
          _context2.next = 4;
          return regeneratorRuntime.awrap(db.ref("order").orderByChild("user_id").equalTo(userId).limitToLast(10).once("value"));

        case 4:
          snap = _context2.sent;
          list.innerHTML = "";

          if (snap.exists()) {
            _context2.next = 9;
            break;
          }

          list.innerHTML = "ยังไม่มีประวัติการขาย";
          return _context2.abrupt("return");

        case 9:
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
          count = 0;
          totalIncome = 0;
          _i2 = 0, _Object$entries = Object.entries(snap.val());

        case 13:
          if (!(_i2 < _Object$entries.length)) {
            _context2.next = 27;
            break;
          }

          child = _Object$entries[_i2];
          orderId = child[0];
          data = child[1];
          count++;
          totalIncome += data.total_price || 0;
          _context2.next = 21;
          return regeneratorRuntime.awrap(db.ref("shops/" + data.shop_id).once("value"));

        case 21:
          storeSnap = _context2.sent;
          storeName = storeSnap.exists() ? storeSnap.val().shop_name : "-";
          list.innerHTML += "\n      <div class=\"order-card\" onclick=\"openOrder('".concat(orderId, "')\"\n       style=\"cursor:pointer\">\n        <div>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ").concat(data.order_at || "-", "</div>\n        <div>\u0E23\u0E49\u0E32\u0E19: ").concat(storeName, "</div>\n        <div>\u0E2A\u0E16\u0E32\u0E19\u0E30: ").concat(data.status, "</div>\n        <div>\u0E22\u0E2D\u0E14: \u0E3F").concat(Number(data.total_price || 0).toFixed(2), "</div>\n      </div>\n    ");

        case 24:
          _i2++;
          _context2.next = 13;
          break;

        case 27:
          document.getElementById("historyCount").innerText = "".concat(count, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");
          document.getElementById("totalSales").innerText = count;
          document.getElementById("totalIncome").innerText = Number(totalIncome).toFixed(2);

        case 30:
        case "end":
          return _context2.stop();
      }
    }
  });
}

loadProfile();