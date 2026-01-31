const LIFF_ID = "2008999812-I2Dz19pN";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await liff.init({ liffId: LIFF_ID });

    const loginBtn = document.getElementById("loginBtn");

    if (!liff.isLoggedIn()) {
      loginBtn.onclick = () => {
        // 👉 ล็อกอินแล้วกลับมาหน้าเดิม
        liff.login({ redirectUri: window.location.href });
      };
    } else {
      const profile = await liff.getProfile();
      console.log("LINE Profile:", profile);

       // 🔥 เช็กว่าอยู่ใน LINE หรือ browser
      if (liff.isInClient()) {
        liff.openWindow({
          url: "https://gomi-wet.web.app/home.html",
          external: false
        });
      } else {
        window.location.replace("home.html");
      }
    }

  } catch (error) {
    console.error("LIFF init error:", error);
    alert("LIFF init ไม่สำเร็จ");
  }
});
