"use strict";

// ============================================================
//  member_regist.js
// ============================================================
var USE_LIFF = true;
var lineProfile = null;
var LIFF_ID = "2008999812-I2Dz19pN"; // ── Init ────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function _callee() {
  var pageLoading, formContainer, snap;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          pageLoading = document.getElementById("page-loading");
          formContainer = document.getElementById("form-container");
          if (pageLoading) pageLoading.style.display = "flex";
          if (formContainer) formContainer.style.display = "none";

          if (!(typeof db === 'undefined')) {
            _context.next = 7;
            break;
          }

          throw new Error("Firebase ยังไม่ได้เริ่มต้น กรุณาตรวจสอบ firebase.js");

        case 7:
          if (!USE_LIFF) {
            _context.next = 24;
            break;
          }

          _context.next = 10;
          return regeneratorRuntime.awrap(liff.init({
            liffId: LIFF_ID
          }));

        case 10:
          if (liff.isLoggedIn()) {
            _context.next = 13;
            break;
          }

          liff.login();
          return _context.abrupt("return");

        case 13:
          _context.next = 15;
          return regeneratorRuntime.awrap(liff.getProfile());

        case 15:
          lineProfile = _context.sent;
          _context.next = 18;
          return regeneratorRuntime.awrap(db.ref("users/".concat(lineProfile.userId)).once("value"));

        case 18:
          snap = _context.sent;

          if (!snap.exists()) {
            _context.next = 22;
            break;
          }

          window.location.replace("home.html");
          return _context.abrupt("return");

        case 22:
          _context.next = 25;
          break;

        case 24:
          lineProfile = {
            userId: "TEST_USER_" + Date.now(),
            displayName: "ผู้ใช้ทดสอบ",
            pictureUrl: "images/logo.jpg"
          };

        case 25:
          document.getElementById("profile-pic").src = lineProfile.pictureUrl || "images/logo.jpg";
          document.getElementById("profile-name").textContent = lineProfile.displayName || "—";
          document.getElementById("profile-uid").textContent = lineProfile.userId;
          if (pageLoading) pageLoading.style.display = "none";
          if (formContainer) formContainer.style.display = "block";
          _context.next = 36;
          break;

        case 32:
          _context.prev = 32;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          alert("เกิดข้อผิดพลาด: " + _context.t0.message);

        case 36:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 32]]);
}); // ── Submit ──────────────────────────────────────────────────

document.getElementById("registration-form").addEventListener("submit", function _callee2(e) {
  var fields, key, geo, fullAddressText, sellerData, userData;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          e.preventDefault();
          fields = {
            firstname: document.getElementById("firstname"),
            lastname: document.getElementById("lastname"),
            phone: document.getElementById("phone"),
            addressLine: document.getElementById("address-line"),
            subDistrict: document.getElementById("sub-district"),
            district: document.getElementById("district"),
            province: document.getElementById("province"),
            postcode: document.getElementById("postcode")
          };
          _context2.t0 = regeneratorRuntime.keys(fields);

        case 3:
          if ((_context2.t1 = _context2.t0()).done) {
            _context2.next = 10;
            break;
          }

          key = _context2.t1.value;

          if (fields[key].value.trim()) {
            _context2.next = 8;
            break;
          }

          showFormError("กรุณากรอกข้อมูลให้ครบ");
          return _context2.abrupt("return");

        case 8:
          _context2.next = 3;
          break;

        case 10:
          setSubmitLoading(true); // 🔎 geocode แบบลดความละเอียดก่อน

          _context2.next = 13;
          return regeneratorRuntime.awrap(geocodeAddressFromForm({
            subDistrict: fields.subDistrict.value.trim(),
            district: fields.district.value.trim(),
            province: fields.province.value.trim(),
            postcode: fields.postcode.value.trim()
          }));

        case 13:
          geo = _context2.sent;
          // 🔁 fallback
          fullAddressText = [fields.addressLine.value.trim(), "\u0E15\u0E33\u0E1A\u0E25".concat(fields.subDistrict.value.trim()), "\u0E2D\u0E33\u0E40\u0E20\u0E2D".concat(fields.district.value.trim()), "\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14".concat(fields.province.value.trim()), "\u0E23\u0E2B\u0E31\u0E2A\u0E44\u0E1B\u0E23\u0E29\u0E13\u0E35\u0E22\u0E4C".concat(fields.postcode.value.trim())].join(" ");

          if (geo) {
            _context2.next = 19;
            break;
          }

          _context2.next = 18;
          return regeneratorRuntime.awrap(geocodeAddress(fullAddressText));

        case 18:
          geo = _context2.sent;

        case 19:
          if (geo) {
            _context2.next = 23;
            break;
          }

          setSubmitLoading(false);
          showFormError("ไม่สามารถแปลงที่อยู่เป็นพิกัดได้ ลองกรอกชื่อสถานที่ใกล้เคียง เช่น วัด/ตลาด");
          return _context2.abrupt("return");

        case 23:
          sellerData = {
            address: fullAddressText,
            lat: geo.lat,
            lng: geo.lng,
            province: fields.province.value.trim(),
            district: fields.district.value.trim(),
            subDistrict: fields.subDistrict.value.trim(),
            postalCode: fields.postcode.value.trim(),
            display_name: lineProfile.displayName,
            fullname: "".concat(fields.firstname.value.trim(), " ").concat(fields.lastname.value.trim()),
            phone: fields.phone.value.trim(),
            registered_at: new Date().toISOString(),
            user_id: lineProfile.userId
          };
          userData = {
            created_at: new Date().toISOString(),
            display_name: lineProfile.displayName,
            picture_url: lineProfile.pictureUrl || "",
            role: "seller"
          };
          _context2.prev = 25;
          _context2.next = 28;
          return regeneratorRuntime.awrap(db.ref("users/".concat(lineProfile.userId)).set(userData));

        case 28:
          _context2.next = 30;
          return regeneratorRuntime.awrap(db.ref("sellers/".concat(lineProfile.userId)).set(sellerData));

        case 30:
          showSuccess();
          setTimeout(function () {
            return location.replace("home.html");
          }, 2000);
          _context2.next = 39;
          break;

        case 34:
          _context2.prev = 34;
          _context2.t2 = _context2["catch"](25);
          console.error(_context2.t2);
          setSubmitLoading(false);
          showFormError("บันทึกไม่สำเร็จ: " + _context2.t2.message);

        case 39:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[25, 34]]);
}); // ── Geocode helpers ─────────────────────────────────────────

function geocodeAddressFromForm(fields) {
  var q, res, data;
  return regeneratorRuntime.async(function geocodeAddressFromForm$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          q = [fields.subDistrict, fields.district, fields.province, fields.postcode, "ประเทศไทย"].join(" ");
          _context3.next = 3;
          return regeneratorRuntime.awrap(fetch("https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=".concat(encodeURIComponent(q)), {
            headers: {
              "User-Agent": "GomiWet/1.0 (doing.co.th@gmail.com)"
            }
          }));

        case 3:
          res = _context3.sent;
          _context3.next = 6;
          return regeneratorRuntime.awrap(res.json());

        case 6:
          data = _context3.sent;

          if (data.length) {
            _context3.next = 9;
            break;
          }

          return _context3.abrupt("return", null);

        case 9:
          return _context3.abrupt("return", {
            lat: +data[0].lat,
            lng: +data[0].lon
          });

        case 10:
        case "end":
          return _context3.stop();
      }
    }
  });
}

function geocodeAddress(addressText) {
  var res, data;
  return regeneratorRuntime.async(function geocodeAddress$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return regeneratorRuntime.awrap(fetch("https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=".concat(encodeURIComponent(addressText)), {
            headers: {
              "User-Agent": "GomiWet/1.0 (doing.co.th@gmail.com)"
            }
          }));

        case 2:
          res = _context4.sent;
          _context4.next = 5;
          return regeneratorRuntime.awrap(res.json());

        case 5:
          data = _context4.sent;

          if (data.length) {
            _context4.next = 8;
            break;
          }

          return _context4.abrupt("return", null);

        case 8:
          return _context4.abrupt("return", {
            lat: +data[0].lat,
            lng: +data[0].lon
          });

        case 9:
        case "end":
          return _context4.stop();
      }
    }
  });
} // ── UI helpers ───────────────────────────────────────────────


function setSubmitLoading(on) {
  document.getElementById("submit-btn").disabled = on;
  document.getElementById("submit-text").style.display = on ? "none" : "inline";
  document.getElementById("submit-loading").style.display = on ? "inline" : "none";
}

function showFormError(msg) {
  var el = document.getElementById("form-error");
  el.textContent = "⚠️ " + msg;
  el.style.display = "block";
}

function showSuccess() {
  var overlay = document.createElement("div");
  overlay.className = "success-overlay";
  overlay.innerHTML = "\n    <div class=\"success-icon\">\uD83C\uDF89</div>\n    <div class=\"success-title\">\u0E22\u0E34\u0E19\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A!</div>\n    <div class=\"success-subtitle\">\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E2A\u0E21\u0E32\u0E0A\u0E34\u0E01\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E1E\u0E32\u0E44\u0E1B\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01...</div>";
  document.body.appendChild(overlay);
}