const LIFF_ID = "2008999812-I2Dz19pN";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // 1. เริ่มต้นระบบ LIFF
    await liff.init({ liffId: LIFF_ID });

    const loginBtn = document.getElementById("loginBtn");

    // 2. เช็คว่าล็อกอินหรือยัง?
    if (!liff.isLoggedIn()) {
      // ถ้ายังไม่ล็อกอิน: ให้แสดงปุ่ม Login และรอให้ผู้ใช้กด
      loginBtn.style.display = "block"; 
      loginBtn.onclick = () => {
        liff.login();
      };
    } else {
      // 3. ถ้าล็อกอินแล้ว (หรือเพิ่งกลับมาจากหน้า Login ของ LINE):
      // ทำการ Redirect ไปหน้า home.html ทันทีโดยไม่ต้องรอคลิก
      window.location.href = "home.html";
    }

  } catch (error) {
    console.error("LIFF init error:", error);
    alert("LIFF init ไม่สำเร็จ หรือเกิดข้อผิดพลาด");
  }
});