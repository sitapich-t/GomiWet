const LIFF_ID = "2008999812-I2Dz19pN";

let currentUserId = null;

async function loadProfile() {
  try {
    // init LIFF
    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    // get LINE profile
    const profile = await liff.getProfile();
    currentUserId = profile.userId;

    // แสดงข้อมูล LINE
    document.getElementById("userName").innerText =
      profile.displayName || "-";

    document.getElementById("userImg").src =
      profile.pictureUrl || "https://via.placeholder.com/80";

    const userRef = db.ref(`sellers/${currentUserId}`);

    // โหลดข้อมูลจาก DB
    userRef.on("value").then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        document.getElementById("nameInput").value =
          data.fullname || "";
        document.getElementById("phoneInput").value =
          data.phone || "";
        document.getElementById("addressInput").value =
          data.address || "";
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

  } catch (err) {
    console.error(err);
    alert("โหลดโปรไฟล์ไม่สำเร็จ");
  }
}

function saveProfile() {
  if (!currentUserId) {
    alert("ไม่พบผู้ใช้งาน");
    return;
  }

  const fullname = document.getElementById("nameInput").value.trim();
  const phone = document.getElementById("phoneInput").value.trim();
  const address = document.getElementById("addressInput").value.trim();

  db.ref(`sellers/${currentUserId}`).update({
    fullname,
    phone,
    address,
    updated_at: Date.now()
  })
  .then(() => {
    alert("บันทึกข้อมูลสำเร็จ");
    history.back();
  })
  .catch(err => {
    console.error(err);
    alert("บันทึกข้อมูลไม่สำเร็จ");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfile();

  document.getElementById("saveBtn")
  .addEventListener("click", saveProfile);

});
