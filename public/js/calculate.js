let foodWasteTypes = [];
let selectedFoodTypeIndex = null;
// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
  loadCards();          // สร้าง card ก่อน
  await loadWasteTypes(); // แล้วค่อยโหลดราคา
});

const foodTypes = [
  { name: "ข้าว", icon: "./assets/types/rice.png" },
  { name: "ผัก", icon: "./assets/types/vegetable.png" },
  { name: "กระดูก", icon: "./assets/types/bone.png" },
  { name: "เศษอาหารปรุงสุก", icon: "./assets/types/cooking.png" },
  { name: "เนื้อสัตว์", icon: "./assets/types/meat.png" },
  { name: "เศษอาหารที่ปนกัน", icon: "./assets/types/mix.png" }
];

function loadCards() {
  const frame = document.getElementById("cardFrame");
  frame.innerHTML = "";

  foodTypes.forEach((f, i) => {
    frame.innerHTML += `
      <div class="card" onclick="selectFoodType(${i})">
        <strong>${f.name}</strong>
        <img class="bigIcon" src="${f.icon}" />
        <p data-price-index="${i}">-</p>
      </div>
    `;
  });
}

// ===============================
// LOAD WASTE TYPES + PRICE
// ===============================
async function loadWasteTypes() {
  try {

    const snapshot = await db.ref("food_waste_types").once("value");
    const data = snapshot.val();

    if (!data) {
      console.log("No waste types");
      return;
    }

    foodWasteTypes = [];

data.forEach((item) => {
    if (item) {
        foodWasteTypes.push({
            category: item.category,
            price: Number(item.price)
        });
    }
});


    updatePricesDisplay();

  } catch (err) {
    console.error("loadWasteTypes error:", err);
  }
}

// ===============================
// UPDATE PRICE ON CARDS
// ===============================
function updatePricesDisplay() {

  const priceElements = document.querySelectorAll("[data-price-index]");

  priceElements.forEach((element, i) => {
  if (foodWasteTypes[i]) {
    element.textContent =
      `${foodWasteTypes[i].price.toFixed(1)} บาท/กก.`;
  }
});


}

// ===============================
// SELECT FOOD TYPE
// ===============================
window.selectFoodType = (index) => {

  selectedFoodTypeIndex = index;

  const cards = document.querySelectorAll(".card_frame .card");

  cards.forEach((card, i) => {
    card.style.border =
      i === index ? "3px solid #28a745" : "1px solid #ccc";
  });

};

// ===============================
// CALCULATE PRICE
// ===============================
window.calculateEarnings = () => {

  if (selectedFoodTypeIndex === null) {
    alert("กรุณาเลือกประเภทเศษอาหาร");
    return;
  }

  const weight =
    Number(document.getElementById("foodWeight").value);

  if (!weight || weight <= 0) {
    alert("กรุณากรอกน้ำหนัก");
    return;
  }

  const selectedType = foodWasteTypes[selectedFoodTypeIndex];

if (!selectedType) {
  alert("ไม่พบข้อมูลราคา");
  return;
}

  const total = weight * selectedType.price;

  document.getElementById("estimatedPrice").value =
    total.toFixed(2);

};
