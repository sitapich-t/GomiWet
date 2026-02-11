"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var LIFF_ID = "2008999812-I2Dz19pN";
document.addEventListener("DOMContentLoaded", function _callee() {
  var loginBtn, profile, userId, userRef, sellerRef, _ref, _ref2, userSnap, sellerSnap;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(liff.init({
            liffId: LIFF_ID
          }));

        case 3:
          loginBtn = document.getElementById("loginBtn");

          if (liff.isLoggedIn()) {
            _context.next = 8;
            break;
          }

          loginBtn.style.display = "block";

          loginBtn.onclick = function () {
            return liff.login();
          };

          return _context.abrupt("return");

        case 8:
          _context.next = 10;
          return regeneratorRuntime.awrap(liff.getProfile());

        case 10:
          profile = _context.sent;
          userId = profile.userId;
          userRef = db.ref("users/" + userId);
          sellerRef = db.ref("sellers/" + userId);
          _context.next = 16;
          return regeneratorRuntime.awrap(Promise.all([userRef.once("value"), sellerRef.once("value")]));

        case 16:
          _ref = _context.sent;
          _ref2 = _slicedToArray(_ref, 2);
          userSnap = _ref2[0];
          sellerSnap = _ref2[1];

          if (userSnap.exists()) {
            _context.next = 23;
            break;
          }

          _context.next = 23;
          return regeneratorRuntime.awrap(userRef.set({
            display_name: profile.displayName,
            picture_url: profile.pictureUrl || "",
            role: "seller",
            created_at: new Date().toISOString()
          }));

        case 23:
          if (sellerSnap.exists()) {
            _context.next = 26;
            break;
          }

          _context.next = 26;
          return regeneratorRuntime.awrap(sellerRef.set({
            user_id: userId,
            display_name: profile.displayName,
            fullname: "",
            address: "",
            phone: "",
            registered_at: new Date().toISOString()
          }));

        case 26:
          if (!window.__LOGGED_IN__) {
            window.__LOGGED_IN__ = true;
            location.replace("home.html");
          }

          _context.next = 33;
          break;

        case 29:
          _context.prev = 29;
          _context.t0 = _context["catch"](0);
          console.error("LOGIN ERROR:", _context.t0);
          alert("เกิดข้อผิดพลาดในการ Login");

        case 33:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 29]]);
});