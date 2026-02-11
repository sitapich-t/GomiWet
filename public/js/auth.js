const LIFF_ID = "2008999812-I2Dz19pN";

document.addEventListener("DOMContentLoaded", async () => {
  try {

    await liff.init({ liffId: LIFF_ID });

    const loginBtn = document.getElementById("loginBtn");

    if (!liff.isLoggedIn()) {
      loginBtn.style.display = "block";
      loginBtn.onclick = () => liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const userId = profile.userId;

    const userRef = db.ref("users/" + userId);
    const sellerRef = db.ref("sellers/" + userId);

    const [userSnap, sellerSnap] = await Promise.all([
      userRef.once("value"),
      sellerRef.once("value")
    ]);

    if (!userSnap.exists()) {
      await userRef.set({
        display_name: profile.displayName,
        picture_url: profile.pictureUrl || "",
        role: "seller",
        created_at: new Date().toISOString()
      });
    }

    if (!sellerSnap.exists()) {
      await sellerRef.set({
        user_id: userId,
        display_name: profile.displayName,
        fullname: "",
        address: "",
        phone: "",
        registered_at: new Date().toISOString()
      });
    }

    if (!window.__LOGGED_IN__) {
      window.__LOGGED_IN__ = true;
      location.replace("home.html");
    }

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    alert("เกิดข้อผิดพลาดในการ Login");
  }
});
