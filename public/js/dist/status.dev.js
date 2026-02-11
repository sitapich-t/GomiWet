"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

// ==================== Global Variables ====================
var currentUserId = 'U4ea11ac1926aecf3fb62406f5f2759b6'; // TODO: แก้เป็น real user ID จาก auth

var ongoingOrders = []; // รายการที่กำลังดำเนินการ

var allShops = {}; // ==================== Status Labels ====================

var STATUS_LABEL = {
  'order_received': 'ได้รับคำสั่งซื้อ',
  'picked_up': 'กำลังส่งไปโกดัง',
  'inbound': 'ถึงโกดังและคัดแยก',
  'sorted': 'คัดแยกเสร็จสิ้น',
  'evaluated': 'ประเมินราคา',
  'outbound': 'กำลังขาย',
  'sold': 'ขายให้ผู้ซื้อ',
  'completed': 'จ่ายเงินเสร็จสิ้น'
}; // ==================== Format Date/Time ====================

function formatDate(dateValue) {
  if (!dateValue) return '-'; // ถ้าเป็น number (timestamp)

  if (typeof dateValue === 'number') {
    var d = new Date(dateValue);
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yy = String(d.getFullYear()).slice(-2);
    return "".concat(dd, "/").concat(mm, "/").concat(yy);
  } // ถ้าเป็น string แบบเดิม


  if (typeof dateValue === 'string') {
    var parts = dateValue.split(' ')[0].split('-');

    if (parts.length === 3) {
      return "".concat(parts[2], "/").concat(parts[1], "/").concat(parts[0].slice(-2));
    }
  }

  return '-';
}

function formatTime(dateValue) {
  if (!dateValue) return '-';

  if (typeof dateValue === 'number') {
    var d = new Date(dateValue);
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return "".concat(h, ":").concat(m, " \u0E19.");
  }

  if (typeof dateValue === 'string') {
    var timePart = dateValue.split(' ')[1];

    if (timePart) {
      var _timePart$split = timePart.split(':'),
          _timePart$split2 = _slicedToArray(_timePart$split, 2),
          _h = _timePart$split2[0],
          _m = _timePart$split2[1];

      return "".concat(_h, ":").concat(_m, " \u0E19.");
    }
  }

  return '-';
} // ==================== Create Order ID ====================


function createOrderId(orderNo, orderAt) {
  var dateStr = orderAt || '';
  var dateFormatted = '';

  if (dateStr) {
    var dateParts = dateStr.split(' ')[0].split('-');

    if (dateParts.length === 3) {
      dateFormatted = dateParts.join('');
    }
  }

  var orderKeyPadded = String(orderNo).padStart(4, '0');
  return dateFormatted ? "ORD".concat(dateFormatted, "-").concat(orderKeyPadded) : "ORD-".concat(orderKeyPadded);
} // ==================== Load Firebase Data ====================


function loadFirebaseData() {
  var _ref, _ref2, orderSnap, shopsSnap, orderData, shopsData;

  return regeneratorRuntime.async(function loadFirebaseData$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log('🔄 Loading Firebase data for user:', currentUserId);
          _context.prev = 1;
          _context.next = 4;
          return regeneratorRuntime.awrap(Promise.all([db.ref('order').orderByChild('user_id').equalTo(currentUserId).once('value'), db.ref('shops').once('value')]));

        case 4:
          _ref = _context.sent;
          _ref2 = _slicedToArray(_ref, 2);
          orderSnap = _ref2[0];
          shopsSnap = _ref2[1];
          orderData = orderSnap.val() || {};
          shopsData = shopsSnap.val() || {}; // กรองเฉพาะ status ไม่ใช่ completed (filter เล็กนี้ทำ client-side ได้เลย)

          ongoingOrders = Object.entries(orderData).filter(function (_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2),
                key = _ref4[0],
                order = _ref4[1];

            return order && order.status !== 'completed';
          }).map(function (_ref5) {
            var _ref6 = _slicedToArray(_ref5, 2),
                key = _ref6[0],
                order = _ref6[1];

            return _objectSpread({}, order, {
              order_id: key
            });
          }); // Build shops map

          allShops = shopsData;
          console.log('✅ Data loaded:', {
            ongoingOrders: ongoingOrders.length,
            shops: Object.keys(allShops).length
          });
          return _context.abrupt("return", true);

        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](1);
          console.error('❌ Error loading Firebase data:', _context.t0);
          return _context.abrupt("return", false);

        case 20:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 16]]);
} // ==================== Get Status Progress ====================


function getStatusProgress(status) {
  var statusOrder = ['order_received', 'picked_up', 'inbound', 'sorted', 'evaluated', 'outbound', 'sold'];
  var currentIndex = statusOrder.indexOf(status);
  var totalSteps = statusOrder.length;
  var progress = currentIndex >= 0 ? (currentIndex + 1) / totalSteps * 100 : 0;
  return {
    progress: Math.round(progress),
    currentStep: currentIndex + 1,
    totalSteps: totalSteps
  };
} // ==================== Render Order Card ====================


function renderOrderCard(order) {
  var orderId = order.display_id;
  var shopName = allShops[order.shop_id] ? allShops[order.shop_id].shop_name : 'ร้านค้า';
  var date = formatDate(order.order_at);
  var time = formatTime(order.order_at);
  var statusText = STATUS_LABEL[order.status] || order.status;
  var deliveryType = order.delivery_type === 'pickup' ? 'รับที่หน้าบ้าน' : 'ส่งเอง';
  var bookedDate = formatDate(order.pickup_at); // คำนวณ progress

  var statusInfo = getStatusProgress(order.status);
  return "\n        <div class=\"order-card\" onclick=\"viewOrderDetails('".concat(order.order_id, "')\">\n            <div class=\"order-header\">\n                <h4>").concat(shopName, "</h4>\n                <span class=\"order-id\">").concat(orderId, "</span>\n            </div>\n            \n            <div class=\"status-progress\">\n                <div class=\"progress-bar\">\n                    <div class=\"progress-fill\" style=\"width: ").concat(statusInfo.progress, "%\"></div>\n                </div>\n                <div class=\"status-text\">\n                    <span class=\"current-status\">").concat(statusText, "</span>\n                    <span class=\"progress-info\">\u0E02\u0E31\u0E49\u0E19\u0E17\u0E35\u0E48 ").concat(statusInfo.currentStep, "/").concat(statusInfo.totalSteps, "</span>\n                </div>\n            </div>\n            \n            <div class=\"order-details\">\n                <p><strong>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E31\u0E48\u0E07:</strong> ").concat(date, " ").concat(time, "</p>\n                <p><strong>\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E2A\u0E48\u0E07:</strong> ").concat(bookedDate, "</p>\n                <p><strong>\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17:</strong> ").concat(deliveryType, "</p>\n            </div>\n            \n            <button class=\"btn-view-details\" onclick=\"event.stopPropagation(); viewOrderDetails(").concat(order.order_id, ")\">\n                \u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\n            </button>\n        </div>\n    ");
} // ==================== Display Orders ====================


function displayOrders() {
  var resultDiv = document.getElementById('trackResult');

  if (!resultDiv) {
    console.warn('trackResult element not found');
    return;
  }

  if (ongoingOrders.length === 0) {
    resultDiv.innerHTML = "\n            <div class=\"no-orders\">\n                <div class=\"no-orders-icon\">\uD83D\uDCE6</div>\n                <h3>\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23</h3>\n                <p>\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E02\u0E32\u0E22\u0E17\u0E35\u0E48\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E43\u0E19\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49</p>\n            </div>\n        ";
    return;
  } // เรียงตาม order_at (ล่าสุดก่อน)


  var sortedOrders = _toConsumableArray(ongoingOrders).sort(function (a, b) {
    var dateA = new Date(a.order_at || 0);
    var dateB = new Date(b.order_at || 0);
    return dateB - dateA;
  });

  var ordersHTML = sortedOrders.map(function (order) {
    return renderOrderCard(order);
  }).join('');
  resultDiv.innerHTML = "\n        <div class=\"orders-list\">\n            <h3>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23 (".concat(ongoingOrders.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)</h3>\n            ").concat(ordersHTML, "\n        </div>\n    ");
} // ==================== View Order Details ====================


window.viewOrderDetails = function (orderId) {
  console.log('📦 Viewing order details:', orderId);
  window.location.href = "status_details.html?order_id=".concat(orderId);
}; // ==================== Initialize ====================


function initStatusPage() {
  var loaded, resultDiv;
  return regeneratorRuntime.async(function initStatusPage$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          console.log('🚀 Initializing status page...'); // โหลดข้อมูลจาก Firebase

          _context2.next = 3;
          return regeneratorRuntime.awrap(loadFirebaseData());

        case 3:
          loaded = _context2.sent;

          if (loaded) {
            _context2.next = 9;
            break;
          }

          console.error('❌ Failed to load data');
          resultDiv = document.getElementById('trackResult');

          if (resultDiv) {
            resultDiv.innerHTML = "\n                <div class=\"error-message\">\n                    <p>\u26A0\uFE0F \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E14\u0E49</p>\n                    <button onclick=\"location.reload()\">\u0E25\u0E2D\u0E07\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07</button>\n                </div>\n            ";
          }

          return _context2.abrupt("return");

        case 9:
          // แสดงรายการที่กำลังดำเนินการ
          displayOrders();
          console.log('✅ Status page initialized');

        case 11:
        case "end":
          return _context2.stop();
      }
    }
  });
} // ==================== Event Listeners ====================


document.addEventListener('DOMContentLoaded', function () {
  console.log('📄 DOM loaded, initializing status page...');
  initStatusPage();
});