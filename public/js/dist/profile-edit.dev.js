"use strict";

var LIFF_ID = "2008999812-I2Dz19pN";
var currentUserId = null;

function loadProfile() {
  var profile, userRef;
  return regeneratorRuntime.async(function loadProfile$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(liff.init({
            liffId: LIFF_ID
          }));

        case 3:
          if (liff.isLoggedIn()) {
            _context.next = 6;
            break;
          }

          liff.login();
          return _context.abrupt("return");

        case 6:
          _context.next = 8;
          return regeneratorRuntime.awrap(liff.getProfile());

        case 8:
          profile = _context.sent;
          currentUserId = profile.userId; // แสดงข้อมูล LINE

          document.getElementById("userName").innerText = profile.displayName || "-";
          document.getElementById("userImg").src = profile.pictureUrl || "https://via.placeholder.com/80";
          userRef = db.ref("sellers/".concat(currentUserId)); // โหลดข้อมูลจาก DB

          userRef.on("value").then(function (snapshot) {
            if (snapshot.exists()) {
              var data = snapshot.val();
              document.getElementById("nameInput").value = data.fullname || "";
              document.getElementById("phoneInput").value = data.phone || "";
              document.getElementById("addressInput").value = data.address || "";
            } else {
              // ถ้ายังไม่มี user → สร้างอัตโนมัติ
              userRef.set({
                display_name: profile.displayName,
                picture_url: profile.pictureUrl || "",
                fullname: "",
                phone: "",
                address: "",
                created_at: Date.now()
              });
            }
          });
          _context.next = 20;
          break;

        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          alert("โหลดโปรไฟล์ไม่สำเร็จ");

        case 20:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 16]]);
}

function saveProfile() {
  if (!currentUserId) {
    alert("ไม่พบผู้ใช้งาน");
    return;
  }

  var fullname = document.getElementById("nameInput").value.trim();
  var phone = document.getElementById("phoneInput").value.trim();
  var address = document.getElementById("addressInput").value.trim();
  db.ref("sellers/".concat(currentUserId)).update({
    fullname: fullname,
    phone: phone,
    address: address,
    updated_at: Date.now()
  }).then(function () {
    alert("บันทึกข้อมูลสำเร็จ");
    history.back();
  })["catch"](function (err) {
    console.error(err);
    alert("บันทึกข้อมูลไม่สำเร็จ");
  });
}

document.addEventListener("DOMContentLoaded", function () {
  loadProfile();
  document.getElementById("saveBtn").addEventListener("click", saveProfile);
});