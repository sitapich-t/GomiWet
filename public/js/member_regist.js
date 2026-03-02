// ============================================================
//  member_regist.js
//  ⚠️  ต้องโหลดหลัง firebase.js เสมอ (ใช้ตัวแปร db จาก firebase.js)
//
//  1. Init LIFF → ดึง profile → แสดงใน card (อัตโนมัติ)
//  2. เช็คซ้ำว่าสมัครแล้วหรือยัง (กันเปิดหน้านี้ตรงๆ)
//  3. Submit → validate → บันทึก RTDB users/{lineUserId} → home.html
//

// ⚠️ สำหรับทดสอบโดยไม่ใช้ LIFF ให้เปลี่ยน USE_LIFF เป็น false
const USE_LIFF = true; // เปลี่ยนเป็น true เมื่อต้องการใช้ LINE Login
const LIFF_ID = "2008999812-I2Dz19pN";

let lineProfile = null;

// ── Init ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // แสดง loading
    const pageLoading = document.getElementById("page-loading");
    const formContainer = document.getElementById("form-container");

    if (pageLoading) pageLoading.style.display = "flex";
    if (formContainer) formContainer.style.display = "none";

    // เช็คว่ามี db จาก firebase.js หรือไม่
    if (typeof db === 'undefined') {
      throw new Error("Firebase ยังไม่ได้เริ่มต้น กรุณาตรวจสอบ firebase.js");
    }

    if (USE_LIFF) {
      // ใช้ LIFF จริง
      console.log("กำลังเชื่อมต่อ LINE LIFF...");
      await liff.init({ liffId: LIFF_ID });

      if (!liff.isLoggedIn()) {
        console.log("ยังไม่ได้ Login, กำลัง redirect ไป LINE Login...");
        liff.login();
        return;
      }

      lineProfile = await liff.getProfile();
      console.log("LINE Profile:", lineProfile);

      // เช็คว่าสมัครแล้วหรือยัง
      const snap = await db.ref(`users/${lineProfile.userId}`).once("value");
      if (snap.exists()) {
        console.log("User already registered, redirecting to home...");
        window.location.replace("home.html");
        return;
      }
    } else {
      // ใช้ข้อมูล Mock สำหรับทดสอบ (ไม่ต้องใช้ LIFF)
      lineProfile = {
        userId: "TEST_USER_" + Date.now(),
        displayName: "ผู้ใช้ทดสอบ",
        pictureUrl: "images/logo.jpg"
      };
      console.log("🧪 ใช้โหมดทดสอบ (Mock Profile):", lineProfile);
    }

    // แสดง LINE profile ใน card
    const profilePic = document.getElementById("profile-pic");
    const profileName = document.getElementById("profile-name");
    const profileUid = document.getElementById("profile-uid");

    if (profilePic) profilePic.src = lineProfile.pictureUrl || "images/logo.jpg";
    if (profileName) profileName.textContent = lineProfile.displayName || "—";
    if (profileUid) profileUid.textContent = lineProfile.userId;

    // ซ่อน loading แสดง form
    if (pageLoading) pageLoading.style.display = "none";
    if (formContainer) formContainer.style.display = "block";

  } catch (err) {
    console.error("Init error:", err);
    const pageLoading = document.getElementById("page-loading");
    if (pageLoading) {
      pageLoading.innerHTML = `
        <p style="color:#e53e3e;text-align:center;padding:20px;">
          เกิดข้อผิดพลาด: ${err.message}<br>
          <button onclick="location.reload()" style="margin-top:12px;padding:10px 24px;background:#00BEC4;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">ลองใหม่</button>
        </p>`;
    } else {
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  }
});

// ── Submit ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const policyModal = document.getElementById("policyModal");
  const openPolicyBtn = document.getElementById("openPolicyBtn");
  const closePolicyBtn = document.getElementById("closePolicyBtn");
  const acceptPolicyBtn = document.getElementById("acceptPolicyBtn");
  const acceptPrivacyCheckbox = document.getElementById("accept-privacy");
  const policyContent = document.getElementById("policyContent");

  // ===== ผูก submit form =====
  const form = document.getElementById("registration-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const acceptPrivacy = document.getElementById("accept-privacy");
      const privacyError = document.getElementById("privacy-error");

      if (!acceptPrivacy.checked) {
        privacyError.style.display = "block";
        privacyError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      } else {
        privacyError.style.display = "none";
      }

      if (!lineProfile) {
        showFormError("ไม่พบข้อมูล Profile กรุณาลองใหม่อีกครั้ง");
        return;
      }

      if (typeof db === "undefined") {
        showFormError("ไม่สามารถเชื่อมต่อ Firebase ได้");
        return;
      }

      const fields = {
        firstname: { el: document.getElementById("firstname"), label: "ชื่อ" },
        lastname: { el: document.getElementById("lastname"), label: "นามสกุล" },
        phone: { el: document.getElementById("phone"), label: "เบอร์โทรศัพท์" },
        addressLine: { el: document.getElementById("address-line"), label: "บ้านเลขที่/ถนน/ซอย" },
        subDistrict: { el: document.getElementById("sub-district"), label: "แขวง/ตำบล" },
        district: { el: document.getElementById("district"), label: "เขต/อำเภอ" },
        province: { el: document.getElementById("province"), label: "จังหวัด" },
        postcode: { el: document.getElementById("postcode"), label: "รหัสไปรษณีย์" },
      };

      Object.values(fields).forEach(f => f.el.classList.remove("invalid"));

      const errors = [];
      Object.values(fields).forEach(f => {
        if (!f.el.value.trim()) {
          errors.push(`กรุณากรอก ${f.label}`);
          f.el.classList.add("invalid");
        }
      });

      if (fields.phone.el.value && !/^[0-9]{10}$/.test(fields.phone.el.value)) {
        errors.push("เบอร์โทรต้องเป็นตัวเลข 10 หลัก");
        fields.phone.el.classList.add("invalid");
      }

      if (fields.postcode.el.value && !/^[0-9]{5}$/.test(fields.postcode.el.value)) {
        errors.push("รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก");
        fields.postcode.el.classList.add("invalid");
      }

      if (errors.length) {
        showFormError(errors[0]);
        document.querySelector(".invalid")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      hideFormError();
      setSubmitLoading(true);

      const sellerData = {
        address: [
          fields.addressLine.el.value.trim(),
          `ตำบล ${fields.subDistrict.el.value.trim()}`,
          `อำเภอ ${fields.district.el.value.trim()}`,
          `จังหวัด ${fields.province.el.value.trim()}`,
          `รหัสไปรษณีย์ ${fields.postcode.el.value.trim()}`
        ].join(" "),
        display_name: lineProfile.displayName,
        fullname: `${fields.firstname.el.value.trim()} ${fields.lastname.el.value.trim()}`,
        phone: fields.phone.el.value.trim(),
        registered_at: new Date().toISOString(),
        user_id: lineProfile.userId
      };

      const userData = {
        created_at: new Date().toISOString(),
        display_name: lineProfile.displayName,
        picture_url: lineProfile.pictureUrl || "",
        role: "seller"
      };

      try {
        await db.ref(`users/${lineProfile.userId}`).set(userData);
        await db.ref(`sellers/${lineProfile.userId}`).set(sellerData);
        await db.ref(`user_consents/${lineProfile.userId}`).set({
          accepted_privacy: true,
          accepted_at: Date.now(),
          version: "1.0"
        });

        showSuccess();
        setTimeout(() => {
          window.location.replace("home.html");
        }, 2000);

      } catch (err) {
        console.error("Save error:", err);
        setSubmitLoading(false);
        showFormError("บันทึกไม่สำเร็จ: " + err.message);
      }
    });
  }

  // ===== Modal =====
  if (openPolicyBtn && policyModal) {
    openPolicyBtn.addEventListener("click", (e) => {
      e.preventDefault(); // กันลิงก์เด้ง
      policyModal.hidden = false;
      document.body.style.overflow = "hidden";
    });
  }

  if (closePolicyBtn) {
    closePolicyBtn.addEventListener("click", closeModal);
  }

  if (policyModal) {
    policyModal.addEventListener("click", (e) => {
      if (e.target === policyModal) closeModal();
    });
  }

  if (acceptPolicyBtn && acceptPrivacyCheckbox) {
    acceptPolicyBtn.addEventListener("click", () => {
      acceptPrivacyCheckbox.checked = true;
      closeModal();
    });
  }

  function closeModal() {
    policyModal.hidden = true;
    document.body.style.overflow = "";
  }
});

// ── UI helpers ───────────────────────────────────────────────
function setSubmitLoading(on) {
  const submitBtn = document.getElementById("submit-btn");
  const submitText = document.getElementById("submit-text");
  const submitLoading = document.getElementById("submit-loading");

  if (submitBtn) submitBtn.disabled = on;
  if (submitText) submitText.style.display = on ? "none" : "inline";
  if (submitLoading) submitLoading.style.display = on ? "inline" : "none";
}

function showFormError(msg) {
  const el = document.getElementById("form-error");
  if (el) {
    el.textContent = "⚠️ " + msg;
    el.style.display = "block";
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function hideFormError() {
  const el = document.getElementById("form-error");
  if (el) {
    el.style.display = "none";
  }
}

function showSuccess() {
  const overlay = document.createElement("div");
  overlay.className = "success-overlay";
  overlay.innerHTML = `
    <div class="success-icon">🎉</div>
    <div class="success-title">ยินดีต้อนรับ!</div>
    <div class="success-subtitle">สมัครสมาชิกสำเร็จ กำลังพาไปหน้าหลัก...</div>`;
  document.body.appendChild(overlay);
}

// อนุญาตเฉพาะตัวเลขในช่อง phone และ postcode
const phoneInput = document.getElementById("phone");
if (phoneInput) {
  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
  });
}

const postcodeInput = document.getElementById("postcode");
if (postcodeInput) {
  postcodeInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 5);
  });
}