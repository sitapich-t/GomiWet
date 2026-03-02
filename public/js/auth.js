const LIFF_ID = "2008999812-I2Dz19pN";

document.addEventListener("DOMContentLoaded", async () => {
  const loginBtn = document.getElementById("loginBtn");

  try {

    await liff.init({ liffId: LIFF_ID });

    if (!liff.isLoggedIn()) {
      loginBtn.style.display = "flex";
      loginBtn.onclick = () => liff.login();
      return;
    }

    // login แล้ว → ซ่อนปุ่ม + แสดง loading
    loginBtn.style.display = "none";
    showAuthLoading();

    // ดึง profile จาก LIFF
    const profile = await liff.getProfile();

    // รอ Firebase Auth (มี timeout กันค้าง)
    const user = await waitForAuth(5000);
    const uid = user.uid;

    // เช็ค user
    const userSnap = await db.ref(`users/${uid}`).once("value");

    // เช็ค consent
    let consentSnap;
    try {
      consentSnap = await db.ref(`user_consents/${uid}`).once("value");
    } catch (e) {
      console.warn("consent read blocked by rules?", e);
      consentSnap = { exists: () => false };
    }

    if (userSnap.exists() && consentSnap.exists()) {
      window.location.replace("home.html");
    } else {
      window.location.replace("member_regist.html");
    }
    return;

  } catch (err) {
    console.error("Auth error:", err);
    hideAuthLoading();
    loginBtn.style.display = "flex";
    loginBtn.onclick = () => window.location.reload();
    showAuthError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  }
});

// ── UI helpers ───────────────────────────────────────────────
function showAuthLoading() {
  if (document.getElementById("auth-loading")) return;
  const card = document.querySelector(".card");
  if (!card) return;
  const el = document.createElement("div");
  el.id = "auth-loading";
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:16px;color:rgba(255,255,255,.9);font-size:14px;";
  el.innerHTML = `
    <div style="width:32px;height:32px;border:3px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;"></div>
    <span>กำลังตรวจสอบข้อมูล...</span>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
  card.appendChild(el);
}

function hideAuthLoading() {
  document.getElementById("auth-loading")?.remove();
}

function showAuthError(msg) {
  const card = document.querySelector(".card");
  if (!card) return;
  const el = document.createElement("p");
  el.style.cssText = "color:#ffe0e0;font-size:13px;margin-top:12px;text-align:center;";
  el.textContent = msg;
  card.appendChild(el);
}

function waitForAuth() {
  return new Promise((resolve, reject) => {
    try {
      // กรณี v8
      if (window.firebase?.auth) {
        const unsub = firebase.auth().onAuthStateChanged((user) => {
          if (user) {
            unsub();
            resolve(user);
          }
        });
        return;
      }

      // กรณี v9 (ต้องมี window.auth = getAuth(app))
      if (window.auth) {
        import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js").then(({ onAuthStateChanged }) => {
          const unsub = onAuthStateChanged(window.auth, (user) => {
            if (user) {
              unsub();
              resolve(user);
            }
          });
        });
        return;
      }

      reject(new Error("Firebase auth not initialized"));
    } catch (e) {
      reject(e);
    }
  });
}

//----------------------------Blink's Code-----------------------------
// document.addEventListener("DOMContentLoaded", async () => {
//   try {

//     await liff.init({ liffId: LIFF_ID });

//     const loginBtn = document.getElementById("loginBtn");

//     if (!liff.isLoggedIn()) {
//       loginBtn.style.display = "block";
//       loginBtn.onclick = () => liff.login();
//       return;
//     }

//     const profile = await liff.getProfile();
//     const userId = profile.userId;

//     const userRef = db.ref("users/" + userId);
//     const sellerRef = db.ref("sellers/" + userId);

//     const [userSnap, sellerSnap] = await Promise.all([
//       userRef.once("value"),
//       sellerRef.once("value")
//     ]);

//     if (!userSnap.exists()) {
//       await userRef.set({
//         display_name: profile.displayName,
//         picture_url: profile.pictureUrl || "",
//         role: "seller",
//         created_at: new Date().toISOString()
//       });
//     }

//     if (!sellerSnap.exists()) {
//       await sellerRef.set({
//         user_id: userId,
//         display_name: profile.displayName,
//         fullname: "",
//         address: "",
//         phone: "",
//         registered_at: new Date().toISOString()
//       });
//     }

//     if (!window.__LOGGED_IN__) {
//       window.__LOGGED_IN__ = true;
//       location.replace("home.html");
//     }

//   } catch (err) {
//     console.error("LOGIN ERROR:", err);
//     alert("เกิดข้อผิดพลาดในการ Login");
//   }
// });
