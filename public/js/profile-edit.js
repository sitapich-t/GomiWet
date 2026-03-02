const LIFF_ID = "2008999812-I2Dz19pN";

let currentUserId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  document.getElementById("saveBtn").addEventListener("click", saveProfile);

  // จำกัดเลขบัญชีเฉพาะตัวเลข + 10 หลัก
  const bankInput = document.getElementById("bankAccNumber");
  bankInput.addEventListener("input", () => {
    bankInput.value = bankInput.value.replace(/\D/g, "");
    if (bankInput.value.length > 10) {
      bankInput.value = bankInput.value.slice(0, 10);
    }
  });

  // จำกัดเบอร์โทรศัพท์เฉพาะตัวเลข 10 หลัก (แถมให้)
  const phoneInput = document.getElementById("phoneInput");
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "");
    if (phoneInput.value.length > 10) {
      phoneInput.value = phoneInput.value.slice(0, 10);
    }
  });
});

async function loadProfile() {
  try {
    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    currentUserId = profile.userId;

    // แสดงข้อมูล LINE
    document.getElementById("userName").innerText =
      profile.displayName || "-";

    document.getElementById("userImg").src =
      profile.pictureUrl || "https://via.placeholder.com/80";

    // โหลด seller
    const sellerSnap = await db.ref(`sellers/${currentUserId}`).once("value");

    if (sellerSnap.exists()) {
      const data = sellerSnap.val();
      document.getElementById("nameInput").value = data.fullname || "";
      document.getElementById("phoneInput").value = data.phone || "";
      document.getElementById("addressInput").value = data.address || "";
    } else {
      await db.ref(`sellers/${currentUserId}`).set({
        display_name: profile.displayName,
        picture_url: profile.pictureUrl || "",
        fullname: "",
        phone: "",
        address: "",
        created_at: Date.now()
      });
    }

    // โหลดบัญชีธนาคาร
    const bankSnap = await db.ref(`bank_accounts/${currentUserId}`).once("value");

    if (bankSnap.exists()) {
      const bank = bankSnap.val();
      document.getElementById("bankAccName").value = bank.account_name || "";
      document.getElementById("bankAccNumber").value = bank.account_number || "";
    }

  } catch (err) {
    console.error(err);
    alert("โหลดโปรไฟล์ไม่สำเร็จ");
  }
}

async function saveProfile() {
  if (!currentUserId) {
    alert("ไม่พบผู้ใช้งาน");
    return;
  }

  const fullname = document.getElementById("nameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();
  const address = document.getElementById("addressInput").value.trim();

  const accName = document.getElementById("bankAccName").value.trim();
  const accNumber = document.getElementById("bankAccNumber").value.trim();

  if (!fullname || !phone || !address || !accName || !accNumber) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  if (phone.length !== 10) {
    alert("เบอร์โทรต้องมี 10 หลัก");
    return;
  }

  if (accNumber.length !== 10) {
    alert("เลขบัญชีต้องมี 10 หลัก");
    return;
  }

  try {
    await db.ref(`sellers/${currentUserId}`).update({
      fullname,
      phone,
      address,
      updated_at: Date.now()
    });

    await db.ref(`bank_accounts/${currentUserId}`).set({
      account_name: accName,
      account_number: accNumber,
      updated_at: Date.now()
    });

    alert("บันทึกข้อมูลสำเร็จ");

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");

    if (redirect) {
      window.location.href = redirect;
    } else {
      window.location.href = "home.html";
    }

  } catch (err) {
    console.error(err);
    alert("บันทึกข้อมูลไม่สำเร็จ");
  }
}
