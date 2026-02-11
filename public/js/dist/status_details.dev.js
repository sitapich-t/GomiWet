"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

// ==================== Status Labels ====================
var STATUS_LABEL = {
  'order_received': 'ได้รับคำสั่งซื้อ',
  'picked_up': 'กำลังส่งไปโกดัง',
  'inbound': 'ถึงโกดังและคัดแยก',
  'sorted': 'คัดแยกเสร็จสิ้น',
  'evaluated': 'ประเมินราคา',
  'outbound': 'กำลังขาย',
  'sold': 'ขายให้ผู้ซื้อ',
  'completed': 'จ่ายเงินเสร็จสิ้น'
}; // Status order for determining which statuses are "reached"
// Each entry = the timeline step, and which DB statuses count as having completed it

var TIMELINE_STEPS = ['order_received', 'picked_up', 'inbound', 'evaluated', 'sold', 'paid']; // Map: timeline step -> which order statuses count as "reached or passed" this step

var STATUS_REACHED_MAP = {
  order_received: ['order_received', 'picked_up', 'inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
  picked_up: ['picked_up', 'inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
  inbound: ['inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
  evaluated: ['evaluated', 'outbound', 'sold', 'paid', 'completed'],
  sold: ['sold', 'paid', 'completed'],
  paid: ['paid', 'completed']
}; // ==================== Global Variables ====================

var paymentsMap = {}; // keyed by order_no (string)

var logisticsMap = {}; // all logistic entries for this payment

var selfDropOffMap = {}; // all self_drop_off for this payment

var schedulesMap = {}; // driving schedule for this logistic

var driversMap = {}; // delivery emp

var inboundFoodWasteMap = {}; // inbound_food_waste entries for this order chain

var waitingSortMap = {}; // waiting_sort entries for this order chain

var priceEstimationMap = {}; // price_estimation entries

var outboundFoodWasteMap = {}; // outbound_food_waste entries

var sellerPayoutsMap = {}; // seller_payouts entries

var foodWasteTypesMap = {}; // food_waste_types (static ref data)

var bankAccountsMap = {}; // bank_accounts

var currentOrder = null; // ==================== Helper Functions ====================

function formatDateToDDMMYYYY(dateInput) {
  if (!dateInput) return '-';
  var dateObj; // ✅ ถ้าเป็น timestamp (number)

  if (typeof dateInput === 'number') {
    dateObj = new Date(dateInput);
  } // ✅ ถ้าเป็น string เช่น "2026-02-11 20:00"
  else if (typeof dateInput === 'string') {
      dateObj = new Date(dateInput.replace(' ', 'T'));
    } else {
      return '-';
    }

  var dd = String(dateObj.getDate()).padStart(2, '0');
  var mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  var yyyy = dateObj.getFullYear();
  return "".concat(dd, "/").concat(mm, "/").concat(yyyy);
}

function formatTimeToHHMM(timeInput) {
  if (!timeInput) return 'xx:xx น.';
  var dateObj; // ✅ ถ้าเป็น timestamp (number)

  if (typeof timeInput === 'number') {
    dateObj = new Date(timeInput);
  } // ✅ ถ้าเป็น string
  else if (typeof timeInput === 'string') {
      // ถ้าเป็น "2026-02-11 20:00"
      if (timeInput.includes(' ')) {
        var parts = timeInput.split(' ');
        dateObj = new Date(parts[0] + 'T' + parts[1]);
      } else {
        // ถ้าเป็น "20:00:00"
        dateObj = new Date("1970-01-01T".concat(timeInput));
      }
    } else {
      return 'xx:xx น.';
    }

  if (isNaN(dateObj)) return 'xx:xx น.';
  var hours = String(dateObj.getHours()).padStart(2, '0');
  var minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return "".concat(hours, ":").concat(minutes, " \u0E19.");
} // Get pickup address record for order_no (returns first match or null)


function getPickupAddress(orderId) {
  var snap, data;
  return regeneratorRuntime.async(function getPickupAddress$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(db.ref('pickup_addresses').orderByChild('order_id').equalTo(orderId).once('value'));

        case 3:
          snap = _context.sent;
          data = snap.val() || {};
          return _context.abrupt("return", Object.values(data)[0] || null);

        case 8:
          _context.prev = 8;
          _context.t0 = _context["catch"](0);
          console.error('❌ Error getting pickup address:', _context.t0);
          return _context.abrupt("return", null);

        case 12:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 8]]);
} // Robustly find logistic entries for a given payment id (tries string, int, and full scan)


function getLogisticsByPayment(paymentId) {
  var snap, data, pidNum, fullSnap, full, filtered;
  return regeneratorRuntime.async(function getLogisticsByPayment$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (paymentId) {
            _context2.next = 2;
            break;
          }

          return _context2.abrupt("return", {});

        case 2:
          _context2.prev = 2;
          _context2.next = 5;
          return regeneratorRuntime.awrap(db.ref('logistic').orderByChild('payment_id').equalTo(paymentId).once('value'));

        case 5:
          snap = _context2.sent;
          data = snap.val() || {};

          if (!(Object.keys(data).length > 0)) {
            _context2.next = 10;
            break;
          }

          console.log('🔎 getLogisticsByPayment: found (as-is)', Object.keys(data));
          return _context2.abrupt("return", data);

        case 10:
          // Try numeric
          pidNum = parseInt(paymentId);

          if (isNaN(pidNum)) {
            _context2.next = 19;
            break;
          }

          _context2.next = 14;
          return regeneratorRuntime.awrap(db.ref('logistic').orderByChild('payment_id').equalTo(pidNum).once('value'));

        case 14:
          snap = _context2.sent;
          data = snap.val() || {};

          if (!(Object.keys(data).length > 0)) {
            _context2.next = 19;
            break;
          }

          console.log('🔎 getLogisticsByPayment: found (numeric)', Object.keys(data));
          return _context2.abrupt("return", data);

        case 19:
          _context2.next = 21;
          return regeneratorRuntime.awrap(db.ref('logistic').once('value'));

        case 21:
          fullSnap = _context2.sent;
          full = fullSnap.val() || {};
          filtered = {};
          Object.entries(full).forEach(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
                k = _ref2[0],
                v = _ref2[1];

            if (!v) return;
            if (v.payment_id == paymentId || v.payment_id == pidNum) filtered[k] = v;
          });
          console.log('🔎 getLogisticsByPayment: full-scan found', Object.keys(filtered));
          return _context2.abrupt("return", filtered);

        case 29:
          _context2.prev = 29;
          _context2.t0 = _context2["catch"](2);
          console.error('❌ Error finding logistics by payment:', _context2.t0);
          return _context2.abrupt("return", {});

        case 33:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[2, 29]]);
} // Check if a timeline step has been reached given the current order status


function isStepReached(timelineStep, currentStatus) {
  var reached = STATUS_REACHED_MAP[timelineStep] || [];
  return reached.includes(currentStatus);
} // setText helper


function setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
} // show/hide section


function showSection(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hideSection(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('hidden');
} // ==================== Load Firebase Data ====================


function loadFirebaseData(orderId) {
  var _ref3, _ref4, paymentSnap, foodWasteSnap, bankSnap, paymentData, paymentId, logisticData, selfDropSnap, logisticEntry, schedSnap, sched, driverSnap, deliveryType, pickupLogistic, logisticPk, inboundSnap, inboundData, selfEntry, selfDropPk, _inboundSnap, _inboundData, inboundPks, _i2, _inboundPks, inboundPk, wsSnap, wsData, sortPks, _i3, _sortPks, sortPk, peSnap, peData, estimatePks, _i4, _estimatePks, estimatePk, obSnap, obData, outboundPks, _i5, _outboundPks, outboundPk, spSnap, spData;

  return regeneratorRuntime.async(function loadFirebaseData$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          console.log('🔄 Loading Firebase data for order:', orderId);
          _context3.prev = 1;
          _context3.next = 4;
          return regeneratorRuntime.awrap(Promise.all([db.ref('payment').orderByChild('order_id').equalTo(orderId).once('value'), db.ref('food_waste_types').once('value'), db.ref('bank_accounts').once('value')]));

        case 4:
          _ref3 = _context3.sent;
          _ref4 = _slicedToArray(_ref3, 3);
          paymentSnap = _ref4[0];
          foodWasteSnap = _ref4[1];
          bankSnap = _ref4[2];
          // Build food_waste_types map
          foodWasteTypesMap = foodWasteSnap.val() || {}; // Build bank_accounts map

          bankAccountsMap = bankSnap.val() || {}; // Build payment map

          paymentData = paymentSnap.val() || {};
          paymentsMap = {};
          paymentId = null;
          Object.entries(paymentData).forEach(function (_ref5) {
            var _ref6 = _slicedToArray(_ref5, 2),
                key = _ref6[0],
                payment = _ref6[1];

            if (payment && payment.order_id) {
              paymentsMap[String(payment.order_id)] = _objectSpread({}, payment, {
                payment_id: key
              });
              paymentId = key;
            }
          });

          if (paymentId) {
            _context3.next = 18;
            break;
          }

          console.warn('⚠️ No payment found for order:', orderId);
          return _context3.abrupt("return", true);

        case 18:
          _context3.next = 20;
          return regeneratorRuntime.awrap(getLogisticsByPayment(paymentId));

        case 20:
          logisticData = _context3.sent;
          logisticsMap = logisticData || {};
          _context3.next = 24;
          return regeneratorRuntime.awrap(db.ref('self_drop_off').orderByChild('payment_id').equalTo(paymentId).once('value'));

        case 24:
          selfDropSnap = _context3.sent;
          selfDropOffMap = selfDropSnap.val() || {}; // Step 3: Load schedule + driver from logistic

          schedulesMap = {};
          driversMap = {};
          logisticEntry = Object.values(logisticsMap).find(function (l) {
            return l && l.schedule_id;
          });

          if (!(logisticEntry && logisticEntry.schedule_id)) {
            _context3.next = 41;
            break;
          }

          _context3.next = 32;
          return regeneratorRuntime.awrap(db.ref("driving_schedules/".concat(logisticEntry.schedule_id)).once('value'));

        case 32:
          schedSnap = _context3.sent;
          sched = schedSnap.val();

          if (!sched) {
            _context3.next = 41;
            break;
          }

          schedulesMap[logisticEntry.schedule_id] = sched;

          if (!sched.delivery_id) {
            _context3.next = 41;
            break;
          }

          _context3.next = 39;
          return regeneratorRuntime.awrap(db.ref("delivery_emps/".concat(sched.delivery_id)).once('value'));

        case 39:
          driverSnap = _context3.sent;

          if (driverSnap.exists()) {
            driversMap[sched.delivery_id] = driverSnap.val();
          }

        case 41:
          // Step 4: Load inbound_food_waste
          // For pickup: inbound links from logistic_id
          // For dropoff: inbound links from drop_off_id
          inboundFoodWasteMap = {};
          deliveryType = currentOrder ? currentOrder.delivery_type : null;

          if (!(deliveryType === 'pickup')) {
            _context3.next = 54;
            break;
          }

          // Find logistic pk (inbound logistic entry for pickup has payment_id)
          pickupLogistic = Object.entries(logisticsMap).find(function (_ref7) {
            var _ref8 = _slicedToArray(_ref7, 2),
                k = _ref8[0],
                l = _ref8[1];

            return l && l.payment_id == paymentId && l.schedule_id != null;
          });

          if (!pickupLogistic) {
            _context3.next = 52;
            break;
          }

          logisticPk = pickupLogistic[0];
          _context3.next = 49;
          return regeneratorRuntime.awrap(db.ref('inbound_food_waste').orderByChild('logistic_id').equalTo(parseInt(logisticPk)).once('value'));

        case 49:
          inboundSnap = _context3.sent;
          inboundData = inboundSnap.val() || {};
          Object.assign(inboundFoodWasteMap, inboundData);

        case 52:
          _context3.next = 63;
          break;

        case 54:
          if (!(deliveryType === 'dropoff')) {
            _context3.next = 63;
            break;
          }

          // Find self_drop_off pk
          selfEntry = Object.entries(selfDropOffMap).find(function (_ref9) {
            var _ref10 = _slicedToArray(_ref9, 2),
                k = _ref10[0],
                s = _ref10[1];

            return s && s.payment_id == paymentId;
          });

          if (!selfEntry) {
            _context3.next = 63;
            break;
          }

          selfDropPk = selfEntry[0];
          _context3.next = 60;
          return regeneratorRuntime.awrap(db.ref('inbound_food_waste').orderByChild('drop_off_id').equalTo(parseInt(selfDropPk)).once('value'));

        case 60:
          _inboundSnap = _context3.sent;
          _inboundData = _inboundSnap.val() || {};
          Object.assign(inboundFoodWasteMap, _inboundData);

        case 63:
          // Step 5: Load waiting_sort from inbound pk(s)
          waitingSortMap = {};
          inboundPks = Object.keys(inboundFoodWasteMap);
          _i2 = 0, _inboundPks = inboundPks;

        case 66:
          if (!(_i2 < _inboundPks.length)) {
            _context3.next = 76;
            break;
          }

          inboundPk = _inboundPks[_i2];
          _context3.next = 70;
          return regeneratorRuntime.awrap(db.ref('waiting_sort').orderByChild('inbound_id').equalTo(parseInt(inboundPk)).once('value'));

        case 70:
          wsSnap = _context3.sent;
          wsData = wsSnap.val() || {};
          Object.assign(waitingSortMap, wsData);

        case 73:
          _i2++;
          _context3.next = 66;
          break;

        case 76:
          // Step 6: Load price_estimation from waiting_sort pk(s)
          priceEstimationMap = {};
          sortPks = Object.keys(waitingSortMap);
          _i3 = 0, _sortPks = sortPks;

        case 79:
          if (!(_i3 < _sortPks.length)) {
            _context3.next = 89;
            break;
          }

          sortPk = _sortPks[_i3];
          _context3.next = 83;
          return regeneratorRuntime.awrap(db.ref('price_estimation').orderByChild('sort_id').equalTo(parseInt(sortPk)).once('value'));

        case 83:
          peSnap = _context3.sent;
          peData = peSnap.val() || {};
          Object.assign(priceEstimationMap, peData);

        case 86:
          _i3++;
          _context3.next = 79;
          break;

        case 89:
          // Step 7: Load outbound_food_waste from price_estimation pk(s)
          outboundFoodWasteMap = {};
          estimatePks = Object.keys(priceEstimationMap);
          _i4 = 0, _estimatePks = estimatePks;

        case 92:
          if (!(_i4 < _estimatePks.length)) {
            _context3.next = 102;
            break;
          }

          estimatePk = _estimatePks[_i4];
          _context3.next = 96;
          return regeneratorRuntime.awrap(db.ref('outbound_food_waste').orderByChild('estimate_id').equalTo(parseInt(estimatePk)).once('value'));

        case 96:
          obSnap = _context3.sent;
          obData = obSnap.val() || {};
          Object.assign(outboundFoodWasteMap, obData);

        case 99:
          _i4++;
          _context3.next = 92;
          break;

        case 102:
          // Step 8: Load seller_payouts from outbound pk(s)
          sellerPayoutsMap = {};
          outboundPks = Object.keys(outboundFoodWasteMap);
          _i5 = 0, _outboundPks = outboundPks;

        case 105:
          if (!(_i5 < _outboundPks.length)) {
            _context3.next = 115;
            break;
          }

          outboundPk = _outboundPks[_i5];
          _context3.next = 109;
          return regeneratorRuntime.awrap(db.ref('seller_payouts').orderByChild('outbound_id').equalTo(parseInt(outboundPk)).once('value'));

        case 109:
          spSnap = _context3.sent;
          spData = spSnap.val() || {};
          Object.assign(sellerPayoutsMap, spData);

        case 112:
          _i5++;
          _context3.next = 105;
          break;

        case 115:
          console.log('✅ Firebase chain loaded:', {
            payments: Object.keys(paymentsMap).length,
            logistics: Object.keys(logisticsMap).length,
            selfDropOffs: Object.keys(selfDropOffMap).length,
            inbound: Object.keys(inboundFoodWasteMap).length,
            waitingSort: Object.keys(waitingSortMap).length,
            priceEstimation: Object.keys(priceEstimationMap).length,
            outbound: Object.keys(outboundFoodWasteMap).length,
            sellerPayouts: Object.keys(sellerPayoutsMap).length
          });
          return _context3.abrupt("return", true);

        case 119:
          _context3.prev = 119;
          _context3.t0 = _context3["catch"](1);
          console.error('❌ Error loading Firebase data:', _context3.t0);
          return _context3.abrupt("return", false);

        case 123:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[1, 119]]);
} // ==================== Get Order ====================


function getOrderFromFirebase(orderId) {
  var orderSnap, order;
  return regeneratorRuntime.async(function getOrderFromFirebase$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return regeneratorRuntime.awrap(db.ref("order/".concat(orderId)).once('value'));

        case 3:
          orderSnap = _context4.sent;
          order = orderSnap.val();

          if (!order) {
            _context4.next = 7;
            break;
          }

          return _context4.abrupt("return", _objectSpread({}, order, {
            order_id: orderId
          }));

        case 7:
          return _context4.abrupt("return", null);

        case 10:
          _context4.prev = 10;
          _context4.t0 = _context4["catch"](0);
          console.error('❌ Error fetching order:', _context4.t0);
          return _context4.abrupt("return", null);

        case 14:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 10]]);
} // ==================== Timeline Date/Time Logic ====================


function getTimelineDateTime(orderId, timelineStep, deliveryType) {
  var payment, paymentId, logistic, lgData, inbound, _logistic, _lgData, _inbound, pe, _lgData2, logisticPk, inboundSnap, inboundData, inboundPk, wsSnap, wsData, sortPk, peSnap, peData, ob, _lgData3, _logisticPk, _inboundSnap2, _inboundData2, _inboundPk, _wsSnap, _wsData, _sortPk, _peSnap, _peData, pePk, obSnap, obData, sp, _lgData4, _logisticPk2, _inboundSnap3, _inboundData3, _inboundPk2, _wsSnap2, _wsData2, _sortPk2, _peSnap2, _peData2, _pePk, _obSnap, _obData, obPk, spSnap, spData;

  return regeneratorRuntime.async(function getTimelineDateTime$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          payment = paymentsMap[String(orderId)];
          paymentId = payment ? payment.payment_id : null;
          _context5.prev = 2;

          if (!(timelineStep === 'order_received')) {
            _context5.next = 8;
            break;
          }

          if (!(currentOrder && currentOrder.order_at)) {
            _context5.next = 6;
            break;
          }

          return _context5.abrupt("return", {
            date: formatDateToDDMMYYYY(currentOrder.order_at),
            time: formatTimeToHHMM(currentOrder.order_at)
          });

        case 6:
          _context5.next = 155;
          break;

        case 8:
          if (!(timelineStep === 'picked_up')) {
            _context5.next = 27;
            break;
          }

          if (!(deliveryType === 'pickup')) {
            _context5.next = 21;
            break;
          }

          // From logistic.pickup_at
          logistic = Object.values(logisticsMap).find(function (l) {
            return l && l.payment_id == paymentId && l.schedule_id != null;
          }); // fallback: query logistic by payment_id

          if (!((!logistic || !logistic.pickup_at) && paymentId)) {
            _context5.next = 16;
            break;
          }

          _context5.next = 14;
          return regeneratorRuntime.awrap(getLogisticsByPayment(paymentId));

        case 14:
          lgData = _context5.sent;
          logistic = Object.values(lgData).find(function (l) {
            return l && l.pickup_at;
          }) || logistic;

        case 16:
          if (!(logistic && logistic.pickup_at)) {
            _context5.next = 19;
            break;
          }

          console.log('✅ timeline[picked_up] from logistic:', logistic.pickup_at);
          return _context5.abrupt("return", {
            date: formatDateToDDMMYYYY(logistic.pickup_at),
            time: formatTimeToHHMM(logistic.pickup_at)
          });

        case 19:
          _context5.next = 25;
          break;

        case 21:
          if (!(deliveryType === 'dropoff')) {
            _context5.next = 25;
            break;
          }

          // From inbound_food_waste.inbound_at (drop-off route)
          inbound = Object.values(inboundFoodWasteMap)[0];

          if (!(inbound && inbound.inbound_at)) {
            _context5.next = 25;
            break;
          }

          return _context5.abrupt("return", {
            date: formatDateToDDMMYYYY(inbound.inbound_at),
            time: formatTimeToHHMM(inbound.inbound_at)
          });

        case 25:
          _context5.next = 155;
          break;

        case 27:
          if (!(timelineStep === 'inbound')) {
            _context5.next = 46;
            break;
          }

          if (!(deliveryType === 'pickup')) {
            _context5.next = 40;
            break;
          }

          // From logistic.delivered_at
          _logistic = Object.values(logisticsMap).find(function (l) {
            return l && l.payment_id == paymentId && l.schedule_id != null;
          });

          if (!((!_logistic || !_logistic.delivered_at) && paymentId)) {
            _context5.next = 35;
            break;
          }

          _context5.next = 33;
          return regeneratorRuntime.awrap(getLogisticsByPayment(paymentId));

        case 33:
          _lgData = _context5.sent;
          _logistic = Object.values(_lgData).find(function (l) {
            return l && l.delivered_at;
          }) || _logistic;

        case 35:
          if (!(_logistic && _logistic.delivered_at)) {
            _context5.next = 38;
            break;
          }

          console.log('✅ timeline[inbound] from logistic:', _logistic.delivered_at);
          return _context5.abrupt("return", {
            date: formatDateToDDMMYYYY(_logistic.delivered_at),
            time: formatTimeToHHMM(_logistic.delivered_at)
          });

        case 38:
          _context5.next = 44;
          break;

        case 40:
          if (!(deliveryType === 'dropoff')) {
            _context5.next = 44;
            break;
          }

          // From inbound_food_waste.inbound_at
          _inbound = Object.values(inboundFoodWasteMap)[0];

          if (!(_inbound && _inbound.inbound_at)) {
            _context5.next = 44;
            break;
          }

          return _context5.abrupt("return", {
            date: formatDateToDDMMYYYY(_inbound.inbound_at),
            time: formatTimeToHHMM(_inbound.inbound_at)
          });

        case 44:
          _context5.next = 155;
          break;

        case 46:
          if (!(timelineStep === 'evaluated')) {
            _context5.next = 77;
            break;
          }

          pe = Object.values(priceEstimationMap).find(function (p) {
            return p && p.estimate_at;
          }); // fallback: try to query price_estimation chain from payment -> inbound -> waiting_sort -> price_estimation

          if (!(!pe && paymentId)) {
            _context5.next = 72;
            break;
          }

          _context5.next = 51;
          return regeneratorRuntime.awrap(getLogisticsByPayment(paymentId));

        case 51:
          _lgData2 = _context5.sent;
          logisticPk = Object.keys(_lgData2)[0];

          if (!logisticPk) {
            _context5.next = 72;
            break;
          }

          console.log('🔎 evaluated fallback logisticPk:', logisticPk);
          _context5.next = 57;
          return regeneratorRuntime.awrap(db.ref('inbound_food_waste').orderByChild('logistic_id').equalTo(parseInt(logisticPk)).once('value'));

        case 57:
          inboundSnap = _context5.sent;
          inboundData = inboundSnap.val() || {};
          inboundPk = Object.keys(inboundData)[0];

          if (!inboundPk) {
            _context5.next = 72;
            break;
          }

          _context5.next = 63;
          return regeneratorRuntime.awrap(db.ref('waiting_sort').orderByChild('inbound_id').equalTo(parseInt(inboundPk)).once('value'));

        case 63:
          wsSnap = _context5.sent;
          wsData = wsSnap.val() || {};
          sortPk = Object.keys(wsData)[0];

          if (!sortPk) {
            _context5.next = 72;
            break;
          }

          _context5.next = 69;
          return regeneratorRuntime.awrap(db.ref('price_estimation').orderByChild('sort_id').equalTo(parseInt(sortPk)).once('value'));

        case 69:
          peSnap = _context5.sent;
          peData = peSnap.val() || {};
          pe = Object.values(peData)[0] || pe;

        case 72:
          if (!(pe && pe.estimate_at)) {
            _context5.next = 75;
            break;
          }

          console.log('✅ timeline[evaluated] from price_estimation:', pe.estimate_at);
          return _context5.abrupt("return", {
            date: formatDateToDDMMYYYY(pe.estimate_at),
            time: formatTimeToHHMM(pe.estimate_at)
          });

        case 75:
          _context5.next = 155;
          break;

        case 77:
          if (!(timelineStep === 'sold')) {
            _context5.next = 114;
            break;
          }

          ob = Object.values(outboundFoodWasteMap).find(function (o) {
            return o && o.delivered_at;
          });

          if (!(!ob && paymentId)) {
            _context5.next = 109;
            break;
          }

          _context5.next = 82;
          return regeneratorRuntime.awrap(getLogisticsByPayment(paymentId));

        case 82:
          _lgData3 = _context5.sent;
          _logisticPk = Object.keys(_lgData3)[0];

          if (!_logisticPk) {
            _context5.next = 109;
            break;
          }

          console.log('🔎 sold fallback logisticPk:', _logisticPk);
          _context5.next = 88;
          return regeneratorRuntime.awrap(db.ref('inbound_food_waste').orderByChild('logistic_id').equalTo(parseInt(_logisticPk)).once('value'));

        case 88:
          _inboundSnap2 = _context5.sent;
          _inboundData2 = _inboundSnap2.val() || {};
          _inboundPk = Object.keys(_inboundData2)[0];

          if (!_inboundPk) {
            _context5.next = 109;
            break;
          }

          _context5.next = 94;
          return regeneratorRuntime.awrap(db.ref('waiting_sort').orderByChild('inbound_id').equalTo(parseInt(_inboundPk)).once('value'));

        case 94:
          _wsSnap = _context5.sent;
          _wsData = _wsSnap.val() || {};
          _sortPk = Object.keys(_wsData)[0];

          if (!_sortPk) {
            _context5.next = 109;
            break;
          }

          _context5.next = 100;
          return regeneratorRuntime.awrap(db.ref('price_estimation').orderByChild('sort_id').equalTo(parseInt(_sortPk)).once('value'));

        case 100:
          _peSnap = _context5.sent;
          _peData = _peSnap.val() || {};
          pePk = Object.keys(_peData)[0];

          if (!pePk) {
            _context5.next = 109;
            break;
          }

          _context5.next = 106;
          return regeneratorRuntime.awrap(db.ref('outbound_food_waste').orderByChild('estimate_id').equalTo(parseInt(pePk)).once('value'));

        case 106:
          obSnap = _context5.sent;
          obData = obSnap.val() || {};
          ob = Object.values(obData)[0] || ob;

        case 109:
          if (!ob) {
            _context5.next = 112;
            break;
          }

          console.log('✅ timeline[sold] from outbound:', ob.delivered_at);
          return _context5.abrupt("return", {
            date: formatDateToDDMMYYYY(ob.delivered_at),
            time: formatTimeToHHMM(ob.delivered_at)
          });

        case 112:
          _context5.next = 155;
          break;

        case 114:
          if (!(timelineStep === 'paid')) {
            _context5.next = 155;
            break;
          }

          sp = Object.values(sellerPayoutsMap).find(function (s) {
            return s && s.payout_at;
          });

          if (!(!sp && paymentId)) {
            _context5.next = 152;
            break;
          }

          _context5.next = 119;
          return regeneratorRuntime.awrap(getLogisticsByPayment(paymentId));

        case 119:
          _lgData4 = _context5.sent;
          _logisticPk2 = Object.keys(_lgData4)[0];

          if (!_logisticPk2) {
            _context5.next = 152;
            break;
          }

          console.log('🔎 paid fallback logisticPk:', _logisticPk2);
          _context5.next = 125;
          return regeneratorRuntime.awrap(db.ref('inbound_food_waste').orderByChild('logistic_id').equalTo(parseInt(_logisticPk2)).once('value'));

        case 125:
          _inboundSnap3 = _context5.sent;
          _inboundData3 = _inboundSnap3.val() || {};
          _inboundPk2 = Object.keys(_inboundData3)[0];

          if (!_inboundPk2) {
            _context5.next = 152;
            break;
          }

          _context5.next = 131;
          return regeneratorRuntime.awrap(db.ref('waiting_sort').orderByChild('inbound_id').equalTo(parseInt(_inboundPk2)).once('value'));

        case 131:
          _wsSnap2 = _context5.sent;
          _wsData2 = _wsSnap2.val() || {};
          _sortPk2 = Object.keys(_wsData2)[0];

          if (!_sortPk2) {
            _context5.next = 152;
            break;
          }

          _context5.next = 137;
          return regeneratorRuntime.awrap(db.ref('price_estimation').orderByChild('sort_id').equalTo(parseInt(_sortPk2)).once('value'));

        case 137:
          _peSnap2 = _context5.sent;
          _peData2 = _peSnap2.val() || {};
          _pePk = Object.keys(_peData2)[0];

          if (!_pePk) {
            _context5.next = 152;
            break;
          }

          _context5.next = 143;
          return regeneratorRuntime.awrap(db.ref('outbound_food_waste').orderByChild('estimate_id').equalTo(parseInt(_pePk)).once('value'));

        case 143:
          _obSnap = _context5.sent;
          _obData = _obSnap.val() || {};
          obPk = Object.keys(_obData)[0];

          if (!obPk) {
            _context5.next = 152;
            break;
          }

          _context5.next = 149;
          return regeneratorRuntime.awrap(db.ref('seller_payouts').orderByChild('outbound_id').equalTo(parseInt(obPk)).once('value'));

        case 149:
          spSnap = _context5.sent;
          spData = spSnap.val() || {};
          sp = Object.values(spData)[0] || sp;

        case 152:
          if (!sp) {
            _context5.next = 155;
            break;
          }

          console.log('✅ timeline[paid] from seller_payouts:', sp.payout_at);
          return _context5.abrupt("return", {
            date: formatDateToDDMMYYYY(sp.payout_at),
            time: formatTimeToHHMM(sp.payout_at)
          });

        case 155:
          _context5.next = 160;
          break;

        case 157:
          _context5.prev = 157;
          _context5.t0 = _context5["catch"](2);
          console.error("\u274C Error getting datetime for ".concat(timelineStep, ":"), _context5.t0);

        case 160:
          return _context5.abrupt("return", null);

        case 161:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[2, 157]]);
} // ==================== Populate Timeline ====================


function populateOrderTimeline(order) {
  var currentStatus, deliveryType, orderId, namePickedUp, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, step, circle, dateElem, timeElem, reached, dt;

  return regeneratorRuntime.async(function populateOrderTimeline$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          if (order) {
            _context6.next = 2;
            break;
          }

          return _context6.abrupt("return");

        case 2:
          currentStatus = order.status || 'order_received';
          deliveryType = order.delivery_type || 'pickup';
          orderId = order.order_id;
          console.log('📊 Populating timeline. Status:', currentStatus, 'Type:', deliveryType); // Update label for picked_up step based on delivery_type

          namePickedUp = document.getElementById('name_picked_up');

          if (namePickedUp) {
            namePickedUp.textContent = deliveryType === 'dropoff' ? 'นำส่งด้วยตนเอง' : 'รถมารับเศษอาหาร';
          }

          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context6.prev = 11;
          _iterator = TIMELINE_STEPS[Symbol.iterator]();

        case 13:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context6.next = 35;
            break;
          }

          step = _step.value;
          circle = document.getElementById("circle_".concat(step));
          dateElem = document.getElementById("date_".concat(step));
          timeElem = document.getElementById("time_".concat(step));

          if (!(!circle || !dateElem || !timeElem)) {
            _context6.next = 20;
            break;
          }

          return _context6.abrupt("continue", 32);

        case 20:
          reached = isStepReached(step, currentStatus);

          if (!reached) {
            _context6.next = 29;
            break;
          }

          _context6.next = 24;
          return regeneratorRuntime.awrap(getTimelineDateTime(orderId, step, deliveryType));

        case 24:
          dt = _context6.sent;

          if (dt) {
            dateElem.textContent = dt.date;
            timeElem.textContent = dt.time;
          } else {
            dateElem.textContent = 'xx/xx/xxxx';
            timeElem.textContent = 'xx:xx น.';
          }

          circle.classList.add('completed');
          _context6.next = 32;
          break;

        case 29:
          dateElem.textContent = 'กำลังดำเนินการ';
          timeElem.textContent = '';
          circle.classList.remove('completed');

        case 32:
          _iteratorNormalCompletion = true;
          _context6.next = 13;
          break;

        case 35:
          _context6.next = 41;
          break;

        case 37:
          _context6.prev = 37;
          _context6.t0 = _context6["catch"](11);
          _didIteratorError = true;
          _iteratorError = _context6.t0;

        case 41:
          _context6.prev = 41;
          _context6.prev = 42;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 44:
          _context6.prev = 44;

          if (!_didIteratorError) {
            _context6.next = 47;
            break;
          }

          throw _iteratorError;

        case 47:
          return _context6.finish(44);

        case 48:
          return _context6.finish(41);

        case 49:
          console.log('✅ Timeline populated');

        case 50:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[11, 37, 41, 49], [42,, 44, 48]]);
} // ==================== Populate Order Details ====================


function populateOrderDetails(order) {
  var orderId, currentStatus, deliveryType, order_Id, sellerName, sellerPhone, address, userSnap, user, sellerSnap, sellerData, seller, a, pickupAddr, foodTypes, orderItemSnap, orderItemData, items, categories, orderDateTime;
  return regeneratorRuntime.async(function populateOrderDetails$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          if (order) {
            _context7.next = 2;
            break;
          }

          return _context7.abrupt("return");

        case 2:
          orderId = order.order_id;
          currentStatus = order.status || 'order_received';
          deliveryType = order.delivery_type || 'pickup';
          console.log('📝 Populating order details:', orderId); // --- Order ID ---

          order_Id = order.display_id;
          setText('order_id_display', order_Id); // === SECTION: ข้อมูลการขาย (always shown once order_received) ===

          if (!isStepReached('order_received', currentStatus)) {
            _context7.next = 46;
            break;
          }

          showSection('order_details_section'); // Seller info

          sellerName = '-';
          sellerPhone = '-';
          address = '-';

          if (!order.user_id) {
            _context7.next = 19;
            break;
          }

          _context7.next = 16;
          return regeneratorRuntime.awrap(db.ref("users/".concat(order.user_id)).once('value'));

        case 16:
          userSnap = _context7.sent;
          user = userSnap.val();

          if (user) {
            sellerName = "".concat(user.name || '', " ").concat(user.surname || '').trim() || '-';
            sellerPhone = user.telephone || '-';
          }

        case 19:
          if (!((sellerName === '-' || sellerPhone === '-') && order.user_id)) {
            _context7.next = 26;
            break;
          }

          _context7.next = 22;
          return regeneratorRuntime.awrap(db.ref('sellers').orderByChild('user_id').equalTo(order.user_id).once('value'));

        case 22:
          sellerSnap = _context7.sent;
          sellerData = sellerSnap.val() || {};
          seller = Object.values(sellerData)[0];

          if (seller) {
            if (sellerName === '-' && seller.fullname) {
              sellerName = "".concat(seller.fullname || '', " ").concat(seller.surname || '').trim() || sellerName;
            }

            if (sellerPhone === '-' && seller.telephone) {
              sellerPhone = seller.telephone;
            } // Also use seller.address as fallback for address


            if ((!address || address === '-') && seller.address) {
              a = seller.address;
              address = [a.address_detail, a.sub_district, a.district, a.province, a.postal_code].filter(Boolean).join(' ');
            }
          }

        case 26:
          _context7.next = 28;
          return regeneratorRuntime.awrap(getPickupAddress(orderId));

        case 28:
          pickupAddr = _context7.sent;

          if (pickupAddr) {
            address = [pickupAddr.address, pickupAddr.sub_district, pickupAddr.district, pickupAddr.province, pickupAddr.postal_code].filter(Boolean).join(' ');
          } // Food types from order_items


          foodTypes = '-';
          _context7.next = 33;
          return regeneratorRuntime.awrap(db.ref('order_items').orderByChild('order_id').equalTo(orderId).once('value'));

        case 33:
          orderItemSnap = _context7.sent;
          orderItemData = orderItemSnap.val() || {};
          items = Object.values(orderItemData).filter(Boolean);

          if (items.length > 0) {
            categories = items.map(function (item) {
              var fw = foodWasteTypesMap[item.waste_id];
              return fw ? fw.category : '';
            }).filter(Boolean);
            foodTypes = categories.join(', ') || '-';
          } // Order datetime


          orderDateTime = '-';

          if (order.order_at) {
            orderDateTime = "".concat(formatDateToDDMMYYYY(order.order_at), " \u0E40\u0E27\u0E25\u0E32 ").concat(formatTimeToHHMM(order.order_at));
          }

          setText('seller_name', sellerName);
          setText('seller_phone', sellerPhone);
          setText('seller_address', address);
          setText('food_types', foodTypes);
          setText('order_datetime', orderDateTime);
          _context7.next = 47;
          break;

        case 46:
          hideSection('order_details_section');

        case 47:
          if (!isStepReached('order_received', currentStatus)) {
            _context7.next = 61;
            break;
          }

          showSection('shipping_section'); // Driver info (always shown from order_received onward)

          _context7.next = 51;
          return regeneratorRuntime.awrap(populateDriverInfo());

        case 51:
          if (!isStepReached('picked_up', currentStatus)) {
            _context7.next = 56;
            break;
          }

          _context7.next = 54;
          return regeneratorRuntime.awrap(populateShippingDetails(orderId, deliveryType));

        case 54:
          _context7.next = 59;
          break;

        case 56:
          setText('pickup_datetime', '-');
          setText('distance', '-');
          setText('shipping_cost', '-');

        case 59:
          _context7.next = 62;
          break;

        case 61:
          hideSection('shipping_section');

        case 62:
          if (!isStepReached('evaluated', currentStatus)) {
            _context7.next = 68;
            break;
          }

          showSection('estimation_section');
          _context7.next = 66;
          return regeneratorRuntime.awrap(populateEstimationDetails());

        case 66:
          _context7.next = 69;
          break;

        case 68:
          hideSection('estimation_section');

        case 69:
          if (!isStepReached('paid', currentStatus)) {
            _context7.next = 75;
            break;
          }

          showSection('payout_section');
          _context7.next = 73;
          return regeneratorRuntime.awrap(populatePayoutDetails());

        case 73:
          _context7.next = 76;
          break;

        case 75:
          hideSection('payout_section');

        case 76:
          console.log('✅ Order details populated');

        case 77:
        case "end":
          return _context7.stop();
      }
    }
  });
} // ==================== Populate Driver Info ====================


function populateDriverInfo() {
  var deliveryType, payment, logistic, schedule, driver, driverName;
  return regeneratorRuntime.async(function populateDriverInfo$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          // For dropoff orders there is no driver, show placeholders
          deliveryType = currentOrder ? currentOrder.delivery_type : 'pickup';

          if (!(deliveryType === 'dropoff')) {
            _context8.next = 6;
            break;
          }

          setText('driver_name', '-');
          setText('driver_phone', '-');
          setText('driver_license', '-');
          return _context8.abrupt("return");

        case 6:
          payment = paymentsMap[String(currentOrder.order_id)];

          if (payment) {
            _context8.next = 12;
            break;
          }

          setText('driver_name', 'ยังไม่มีข้อมูล');
          setText('driver_phone', '-');
          setText('driver_license', '-');
          return _context8.abrupt("return");

        case 12:
          logistic = Object.values(logisticsMap).find(function (l) {
            return l && l.payment_id == payment.payment_id && l.schedule_id != null;
          });

          if (!(!logistic || !logistic.schedule_id)) {
            _context8.next = 18;
            break;
          }

          setText('driver_name', 'ยังไม่มีข้อมูล');
          setText('driver_phone', '-');
          setText('driver_license', '-');
          return _context8.abrupt("return");

        case 18:
          schedule = schedulesMap[logistic.schedule_id];

          if (!(!schedule || !schedule.delivery_id)) {
            _context8.next = 24;
            break;
          }

          setText('driver_name', 'ยังไม่มีข้อมูล');
          setText('driver_phone', '-');
          setText('driver_license', '-');
          return _context8.abrupt("return");

        case 24:
          driver = driversMap[schedule.delivery_id];

          if (driver) {
            driverName = "".concat(driver.title || '', " ").concat(driver.name || '', " ").concat(driver.surname || '').trim() || 'ยังไม่มีข้อมูล';
            setText('driver_name', driverName);
            setText('driver_phone', driver.telephone || '-');
            setText('driver_license', schedule.license_plate || '-');
          } else {
            setText('driver_name', 'ยังไม่มีข้อมูล');
            setText('driver_phone', '-');
            setText('driver_license', '-');
          }

        case 26:
        case "end":
          return _context8.stop();
      }
    }
  });
} // ==================== Populate Shipping Details ====================


function populateShippingDetails(orderId, deliveryType) {
  var payment, logistic, dateStr, pickupAddr, rateSnap, rate, inbound, _dateStr;

  return regeneratorRuntime.async(function populateShippingDetails$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          _context9.prev = 0;
          payment = paymentsMap[String(orderId)];

          if (payment) {
            _context9.next = 7;
            break;
          }

          setText('pickup_datetime', '-');
          setText('distance', '-');
          setText('shipping_cost', '-');
          return _context9.abrupt("return");

        case 7:
          if (!(deliveryType === 'pickup')) {
            _context9.next = 30;
            break;
          }

          // pickup_datetime from logistic.pickup_at
          logistic = Object.values(logisticsMap).find(function (l) {
            return l && l.payment_id == payment.payment_id && l.schedule_id != null;
          });

          if (logistic && logistic.pickup_at) {
            dateStr = "".concat(formatDateToDDMMYYYY(logistic.pickup_at), " \u0E40\u0E27\u0E25\u0E32 ").concat(formatTimeToHHMM(logistic.pickup_at));
            setText('pickup_datetime', dateStr);
          } else {
            setText('pickup_datetime', '-');
          } // Distance from pickup_addresses (use helper)


          _context9.next = 12;
          return regeneratorRuntime.awrap(getPickupAddress(orderId));

        case 12:
          pickupAddr = _context9.sent;

          if (!(pickupAddr && pickupAddr.distance != null)) {
            _context9.next = 26;
            break;
          }

          setText('distance', "".concat(pickupAddr.distance, " \u0E01\u0E21.")); // Shipping cost from pickup_rate via rate_id

          if (!pickupAddr.rate_id) {
            _context9.next = 23;
            break;
          }

          _context9.next = 18;
          return regeneratorRuntime.awrap(db.ref("pickup_rate/".concat(pickupAddr.rate_id)).once('value'));

        case 18:
          rateSnap = _context9.sent;
          rate = rateSnap.val();

          if (rate && rate.price != null) {
            setText('shipping_cost', rate.price === 0 ? 'ฟรี' : "".concat(rate.price, " \u0E1A\u0E32\u0E17"));
          } else {
            setText('shipping_cost', '-');
          }

          _context9.next = 24;
          break;

        case 23:
          setText('shipping_cost', '-');

        case 24:
          _context9.next = 28;
          break;

        case 26:
          setText('distance', '-');
          setText('shipping_cost', '-');

        case 28:
          _context9.next = 31;
          break;

        case 30:
          if (deliveryType === 'dropoff') {
            // pickup_datetime from inbound_food_waste.inbound_at (drop-off label)
            inbound = Object.values(inboundFoodWasteMap)[0];

            if (inbound && inbound.inbound_at) {
              _dateStr = "".concat(formatDateToDDMMYYYY(inbound.inbound_at), " \u0E40\u0E27\u0E25\u0E32 ").concat(formatTimeToHHMM(inbound.inbound_at), " (drop-off)");
              setText('pickup_datetime', _dateStr);
            } else {
              setText('pickup_datetime', '-');
            }

            setText('distance', '-');
            setText('shipping_cost', '-');
          }

        case 31:
          _context9.next = 36;
          break;

        case 33:
          _context9.prev = 33;
          _context9.t0 = _context9["catch"](0);
          console.error('❌ Error populating shipping details:', _context9.t0);

        case 36:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[0, 33]]);
} // ==================== Populate Estimation Details ====================


function populateEstimationDetails() {
  var pe, _pe, estimatePk, peData, ws, sortId, wsEntry, fw, category, weight, price;

  return regeneratorRuntime.async(function populateEstimationDetails$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          _context10.prev = 0;
          // Get first completed price_estimation
          pe = Object.entries(priceEstimationMap).find(function (_ref11) {
            var _ref12 = _slicedToArray(_ref11, 2),
                k = _ref12[0],
                v = _ref12[1];

            return v && v.sort_id;
          });

          if (pe) {
            _context10.next = 7;
            break;
          }

          setText('estimation_category', '-');
          setText('estimation_weight', '-');
          setText('estimation_price', '-');
          return _context10.abrupt("return");

        case 7:
          _pe = _slicedToArray(pe, 2), estimatePk = _pe[0], peData = _pe[1]; // Get corresponding waiting_sort entry

          ws = Object.values(waitingSortMap).find(function (w) {
            return w && w.inbound_id != null;
          }); // The waiting_sort pk is sort_id in price_estimation

          sortId = peData.sort_id;
          wsEntry = waitingSortMap[String(sortId)];

          if (wsEntry) {
            _context10.next = 16;
            break;
          }

          setText('estimation_category', '-');
          setText('estimation_weight', '-');
          setText('estimation_price', '-');
          return _context10.abrupt("return");

        case 16:
          // Get food_waste category from waste_id
          fw = foodWasteTypesMap[String(wsEntry.waste_id)];
          category = fw ? fw.category : '-';
          weight = wsEntry.weight != null ? "".concat(wsEntry.weight, " \u0E01\u0E01.") : '-';
          price = fw && fw.price != null && wsEntry.weight != null ? "".concat((fw.price * wsEntry.weight).toFixed(2), " \u0E1A\u0E32\u0E17") : '-';
          setText('estimation_category', category);
          setText('estimation_weight', weight);
          setText('estimation_price', price);
          _context10.next = 28;
          break;

        case 25:
          _context10.prev = 25;
          _context10.t0 = _context10["catch"](0);
          console.error('❌ Error populating estimation details:', _context10.t0);

        case 28:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[0, 25]]);
} // ==================== Populate Payout Details ====================


function populatePayoutDetails() {
  var sp, bank;
  return regeneratorRuntime.async(function populatePayoutDetails$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _context11.prev = 0;
          sp = Object.values(sellerPayoutsMap)[0];

          if (sp) {
            _context11.next = 8;
            break;
          }

          setText('payout_bank_account_number', '-');
          setText('payout_bank_name', '-');
          setText('payout_amount', '-');
          setText('payout_at', '-');
          return _context11.abrupt("return");

        case 8:
          // Bank account info
          bank = sp.bank_id ? bankAccountsMap[String(sp.bank_id)] : null;
          setText('payout_bank_account_number', bank ? bank.bank_account_number || '-' : '-');
          setText('payout_bank_name', bank ? bank.bank_name || '-' : '-');
          setText('payout_amount', sp.amount != null ? "".concat(sp.amount, " \u0E1A\u0E32\u0E17") : '-');

          if (sp.payout_at) {
            setText('payout_at', "".concat(formatDateToDDMMYYYY(sp.payout_at), " \u0E40\u0E27\u0E25\u0E32 ").concat(formatTimeToHHMM(sp.payout_at)));
          } else {
            setText('payout_at', '-');
          }

          _context11.next = 18;
          break;

        case 15:
          _context11.prev = 15;
          _context11.t0 = _context11["catch"](0);
          console.error('❌ Error populating payout details:', _context11.t0);

        case 18:
        case "end":
          return _context11.stop();
      }
    }
  }, null, null, [[0, 15]]);
} // ==================== Initialize Page ====================


function initPage() {
  var urlParams, orderId, order, dataLoaded;
  return regeneratorRuntime.async(function initPage$(_context12) {
    while (1) {
      switch (_context12.prev = _context12.next) {
        case 0:
          console.log('🚀 Initializing status details page...');
          _context12.prev = 1;
          urlParams = new URLSearchParams(window.location.search);
          orderId = urlParams.get('order_id');

          if (orderId) {
            _context12.next = 9;
            break;
          }

          console.error('❌ No order_id in URL');
          alert('ไม่พบรหัสการขาย');
          window.location.href = 'status.html';
          return _context12.abrupt("return");

        case 9:
          console.log('📦 Order number:', orderId); // Fetch the order first (we need delivery_type before loading chain)

          _context12.next = 12;
          return regeneratorRuntime.awrap(getOrderFromFirebase(orderId));

        case 12:
          order = _context12.sent;

          if (order) {
            _context12.next = 18;
            break;
          }

          console.error('❌ Order not found');
          alert('ไม่พบรายการขาย');
          window.location.href = 'status.html';
          return _context12.abrupt("return");

        case 18:
          currentOrder = order; // Load all related data (delivery_type now known)

          _context12.next = 21;
          return regeneratorRuntime.awrap(loadFirebaseData(orderId));

        case 21:
          dataLoaded = _context12.sent;

          if (dataLoaded) {
            _context12.next = 26;
            break;
          }

          console.error('❌ Failed to load Firebase data');
          alert('ไม่สามารถโหลดข้อมูลได้');
          return _context12.abrupt("return");

        case 26:
          _context12.next = 28;
          return regeneratorRuntime.awrap(populateOrderTimeline(order));

        case 28:
          _context12.next = 30;
          return regeneratorRuntime.awrap(populateOrderDetails(order));

        case 30:
          console.log('✅ Page initialized successfully');
          _context12.next = 37;
          break;

        case 33:
          _context12.prev = 33;
          _context12.t0 = _context12["catch"](1);
          console.error('❌ Error initializing page:', _context12.t0);
          alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');

        case 37:
        case "end":
          return _context12.stop();
      }
    }
  }, null, null, [[1, 33]]);
} // ==================== Event Listeners ====================


document.addEventListener('DOMContentLoaded', function () {
  console.log('📄 DOM loaded, initializing...');
  initPage();
});