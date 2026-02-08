let wasteTypes = [];
const LIFF_ID = "2008999812-I2Dz19pN";

const params = new URLSearchParams(window.location.search);
const storeId = params.get("storeId");

console.log("storeId:", storeId);

document.addEventListener("DOMContentLoaded", async () => {

  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

  // set default date/time
  const now = new Date();
  document.getElementById("date").value =
    now.toISOString().split("T")[0];

  document.getElementById("time").value =
    now.toTimeString().slice(0,5);

  loadWasteTypes();
});

async function getUserId(){
  const profile = await liff.getProfile();
  return profile.userId;
}

async function loadWasteTypes() {
  const list = document.getElementById("wasteList");
  list.innerHTML = "กำลังโหลด...";

  // 1️⃣ ดึง waste_id ที่ร้านนี้รับซื้อ
  const acceptedSnap = await db.ref("shop_accepted")
    .orderByChild("shop_id")
    .equalTo(Number(storeId))   // ถ้า storeId เป็น string
    .once("value");

  const acceptedWasteIds = [];

  acceptedSnap.forEach(s => {
    acceptedWasteIds.push(String(s.val().waste_id));
  });

  // ถ้าร้านไม่รับซื้ออะไรเลย
  if (acceptedWasteIds.length === 0) {
    list.innerHTML = "ร้านนี้ไม่รับซื้อเศษอาหาร";
    return;
  }

  // 2️⃣ โหลดประเภทเศษอาหารทั้งหมด
  const wasteSnap = await db.ref("food_waste_types").once("value");

  list.innerHTML = "";
  wasteTypes = [];

  // 3️⃣ แสดงเฉพาะที่ร้านรับซื้อ
  wasteSnap.forEach(w => {

    if (acceptedWasteIds.includes(w.key)) {

      wasteTypes.push({ id: w.key, name: w.val().name });

      list.innerHTML += `
        <div class="waste-row">
          <span>${w.val().category}</span>
          <input type="number"
                 class="waste-input"
                 id="w_${w.key}"
                 placeholder="กก."
                 oninput="limitOneInput(this)">
        </div>
      `;
    }
  });
}

function limitOneInput(current){
  document.querySelectorAll(".waste-input").forEach(i=>{
    if(i !== current){
      i.value = "";
    }
  });
}

async function submitSale(){
  console.log("submit clicked")

  const shopId = storeId;
  const userId = await getUserId();

  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const note = document.getElementById("note").value;

  let items = [];

  wasteTypes.forEach(w=>{
    const weight = document.getElementById(`w_${w.id}`).value;
    if(weight && weight > 0){
      items.push({
        waste_id:w.id,
        weight:weight
      });
    }
  });

  const orderRef = db.ref("order").push();

  await orderRef.set({
    user_id:userId,
    shop_id:shopId,
    order_at:`${date} ${time}`,
    status:"กำลังขนส่ง",
    note:note
  });

  for(const i of items){
    await db.ref("order_items").push({
      order_id:orderRef.key,
      waste_id:i.waste_id,
      weight:i.weight
    });
  }
  
  alert("บันทึกสำเร็จ");
  location.href="home.html";
}

