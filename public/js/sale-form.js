let wasteTypes = [];

document.addEventListener("DOMContentLoaded", () => {
  loadWasteTypes();
});

function getStoreId(){
  const params = new URLSearchParams(window.location.search);
  return params.get("storeId");
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

  const shopId = getStoreId();
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

  const orderRef = db.ref("orders").push();

  await orderRef.set({
    user_id:userId,
    shop_id:shopId,
    order_at:`${date} ${time}`,
    status:"pending",
    note:note
  });

  items.forEach(i=>{
    db.ref("order_items").push({
      order_id:orderRef.key,
      waste_id:i.waste_id,
      weight:i.weight
    });
  });

  alert("บันทึกสำเร็จ");
  location.href="home.html";
}
