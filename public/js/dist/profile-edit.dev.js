"use strict";

var LIFF_ID = "2008999812-I2Dz19pN";
var currentUserId = null;
document.addEventListener("DOMContentLoaded", function () {
  loadProfile();
  document.getElementById("saveBtn").addEventListener("click", saveProfile); // จำกัดเลขบัญชีเฉพาะตัวเลข + 10 หลัก

  var bankInput = document.getElementById("bankAccNumber");
  bankInput.addEventListener("input", function () {
    bankInput.value = bankInput.value.replace(/\D/g, "");

    if (bankInput.value.length > 10) {
      bankInput.value = bankInput.value.slice(0, 10);
    }
  }); // จำกัดเบอร์โทรศัพท์เฉพาะตัวเลข 10 หลัก (แถมให้)

  var phoneInput = document.getElementById("phoneInput");
  phoneInput.addEventListener("input", function () {
    phoneInput.value = phoneInput.value.replace(/\D/g, "");

    if (phoneInput.value.length > 10) {
      phoneInput.value = phoneInput.value.slice(0, 10);
    }
  });
});

function loadProfile() {
  var profile, sellerSnap, data, bankSnap, bank;
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
          document.getElementById("userImg").src = profile.pictureUrl || "https://via.placeholder.com/80"; // โหลด seller

          _context.next = 14;
          return regeneratorRuntime.awrap(db.ref("sellers/".concat(currentUserId)).once("value"));

        case 14:
          sellerSnap = _context.sent;

          if (!sellerSnap.exists()) {
            _context.next = 22;
            break;
          }

          data = sellerSnap.val();
          document.getElementById("nameInput").value = data.fullname || "";
          document.getElementById("phoneInput").value = data.phone || "";
          document.getElementById("addressInput").value = data.address || "";
          _context.next = 24;
          break;

        case 22:
          _context.next = 24;
          return regeneratorRuntime.awrap(db.ref("sellers/".concat(currentUserId)).set({
            display_name: profile.displayName,
            picture_url: profile.pictureUrl || "",
            fullname: "",
            phone: "",
            address: "",
            created_at: Date.now()
          }));

        case 24:
          _context.next = 26;
          return regeneratorRuntime.awrap(db.ref("bank_accounts/".concat(currentUserId)).once("value"));

        case 26:
          bankSnap = _context.sent;

          if (bankSnap.exists()) {
            bank = bankSnap.val();
            document.getElementById("bankAccName").value = bank.account_name || "";
            document.getElementById("bankAccNumber").value = bank.account_number || "";
          }

          _context.next = 34;
          break;

        case 30:
          _context.prev = 30;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          alert("โหลดโปรไฟล์ไม่สำเร็จ");

        case 34:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 30]]);
}

function saveProfile() {
  var fullname, phone, address, accName, accNumber, params, redirect;
  return regeneratorRuntime.async(function saveProfile$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (currentUserId) {
            _context2.next = 3;
            break;
          }

          alert("ไม่พบผู้ใช้งาน");
          return _context2.abrupt("return");

        case 3:
          fullname = document.getElementById("nameInput").value.trim();
          phone = document.getElementById("phoneInput").value.trim();
          address = document.getElementById("addressInput").value.trim();
          accName = document.getElementById("bankAccName").value.trim();
          accNumber = document.getElementById("bankAccNumber").value.trim();

          if (!(!fullname || !phone || !address || !accName || !accNumber)) {
            _context2.next = 11;
            break;
          }

          alert("กรุณากรอกข้อมูลให้ครบ");
          return _context2.abrupt("return");

        case 11:
          if (!(phone.length !== 10)) {
            _context2.next = 14;
            break;
          }

          alert("เบอร์โทรต้องมี 10 หลัก");
          return _context2.abrupt("return");

        case 14:
          if (!(accNumber.length !== 10)) {
            _context2.next = 17;
            break;
          }

          alert("เลขบัญชีต้องมี 10 หลัก");
          return _context2.abrupt("return");

        case 17:
          _context2.prev = 17;
          _context2.next = 20;
          return regeneratorRuntime.awrap(db.ref("sellers/".concat(currentUserId)).update({
            fullname: fullname,
            phone: phone,
            address: address,
            updated_at: Date.now()
          }));

        case 20:
          _context2.next = 22;
          return regeneratorRuntime.awrap(db.ref("bank_accounts/".concat(currentUserId)).set({
            account_name: accName,
            account_number: accNumber,
            updated_at: Date.now()
          }));

        case 22:
          alert("บันทึกข้อมูลสำเร็จ");
          params = new URLSearchParams(window.location.search);
          redirect = params.get("redirect");

          if (redirect) {
            window.location.href = redirect;
          } else {
            window.location.href = "home.html";
          }

          _context2.next = 32;
          break;

        case 28:
          _context2.prev = 28;
          _context2.t0 = _context2["catch"](17);
          console.error(_context2.t0);
          alert("บันทึกข้อมูลไม่สำเร็จ");

        case 32:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[17, 28]]);
}