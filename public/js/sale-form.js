let wasteTypes = [];
const LIFF_ID = "2008999812-I2Dz19pN";

const params = new URLSearchParams(window.location.search);
const storeId = params.get("storeId");

async function generateDisplayOrderId() {

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const dateKey = `${yyyy}${mm}${dd}`;

  const counterRef = db.ref(`order_counters/${dateKey}`);

  const result = await counterRef.transaction(current => {
    return (current || 0) + 1;
  });

  const runningNumber = String(result.snapshot.val()).padStart(4, '0');

  return `ORD${dateKey}-${runningNumber}`;
}

document.addEventListener("DOMContentLoaded", async () => {

  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

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

  const acceptedSnap = await db.ref("shop_accepted")
    .orderByChild("shop_id")
    .equalTo(Number(storeId))
    .once("value");

  const acceptedWasteIds = [];

  acceptedSnap.forEach(s => {
    acceptedWasteIds.push(String(s.val().waste_id));
  });

  if (acceptedWasteIds.length === 0) {
    list.innerHTML = "ร้านนี้ไม่รับซื้อเศษอาหาร";
    return;
  }

  const wasteSnap = await db.ref("food_waste_types").once("value");

  list.innerHTML = "";
  wasteTypes = [];

  wasteSnap.forEach(w => {

    if (acceptedWasteIds.includes(w.key)) {

      wasteTypes.push({ id: w.key, name: w.val().category });

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

  const shopId = storeId;
  const userId = await getUserId();
  const deliveryType = localStorage.getItem("delivery_type")

  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const note = document.getElementById("note").value;

  let selectedWaste = null;

  wasteTypes.forEach(w => {
    const input = document.getElementById(`w_${w.id}`);
    if(input && input.value){
      selectedWaste = {
        waste_id: w.id,
        weight: Number(input.value)
      };
    }
  });

  if(!selectedWaste){
    alert("กรุณาเลือกประเภทเศษอาหาร");
    return;
  }

  const priceSnap = await db
    .ref(`food_waste_types/${selectedWaste.waste_id}/price`)
    .once("value");

  const pricePerKg = Number(priceSnap.val()) || 0;
  const totalPrice = selectedWaste.weight * pricePerKg;

  const displayId = await generateDisplayOrderId();
  const orderRef = db.ref("order").push();

  await orderRef.set({
    display_id: displayId,
    user_id: userId,
    shop_id: shopId,
    order_at: firebase.database.ServerValue.TIMESTAMP,
    pickup_at: `${date} ${time}`,
    delivery_type: deliveryType,
    status: "order_received",
    note,
    total_price: totalPrice,
  });

  await db.ref("order_items").push({
    order_id: orderRef.key,
    waste_id: selectedWaste.waste_id,
    weight: selectedWaste.weight,
    price_per_kg: pricePerKg,
    total_price: totalPrice
  });

   alert("บันทึกสำเร็จ");
   location.href = "home.html";
}
