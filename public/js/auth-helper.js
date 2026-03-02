//auth-helper.js
/*เพิ่ม function นี้ให้กับ html ทุกหน้าก่อนโหลดjsของหน้านั้นๆ 
เพื่อป้องกันคนเข้าผ่านการกรอกpathเอง*/

async function checkLogin() {
    try {
        console.log("Initializing LIFF...");
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
            window.location.replace("index.html");
            return null;
        }

        // เพิ่มการเช็คว่าสมัครสมาชิกแล้วหรือยัง
        const profile = await liff.getProfile();
        const snapshot = await db.ref(`users/${profile.userId}`).once("value");

        if (!snapshot.exists()) {
            window.location.replace("member_regist.html");
            return null;
        }

        return profile; // ✅ return profile เพื่อให้หน้าอื่นใช้งานได้

    } catch (error) {
        console.error("LIFF Init Error:", error);
        window.location.replace("index.html");
        return null;
    }
}