let wasteTypes = [];
const LIFF_ID = "2008999812-I2Dz19pN";

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


function getStoreId(){
  return localStorage.getItem("storeId");
}

async function getUserId(){
  const profile = await liff.getProfile();
  return profile.userId;
}

async function loadWasteTypes() {
  const list = document.getElementById("wasteList");
  list.innerHTML = "กำลังโหลด...";

  const snap = await db.ref("food_waste_types").once("value");

  list.innerHTML = "";
  wasteTypes = [];

  snap.forEach(w => {
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

  const shopId = getStoreId();
  const userId = await getUserId();
  const address = document.getElementById("address").value;

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
    note:note,
    address:address
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

function getCurrentLocation(){

  if(!navigator.geolocation){
    alert("อุปกรณ์ไม่รองรับ GPS");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // ใส่ค่า lat,lng ลง input
    document.getElementById("address").value =
      `Lat:${lat}, Lng:${lng}`;

  }, err => {
    alert("ไม่สามารถดึงตำแหน่งได้");
  });

}
