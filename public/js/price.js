let selectedType = null;
let selectedPrice = 0;

// 🔹 โหลดประเภทเศษอาหาร
function loadFoodTypes() {
  const container = document.querySelector(".card_frame");
  container.innerHTML = "";

  db.ref("food_waste_types").once("value", snap => {
    snap.forEach(child => {
      const data = child.val();

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <strong>${data.category}</strong>
        <img class="bigIcon" src="assets/types/${mapIcon(data.category)}" />
        <p>${data.price} บาท/กก.</p>
      `;

      card.addEventListener("click", () => {
        document
          .querySelectorAll(".card")
          .forEach(c => c.classList.remove("active"));

        card.classList.add("active");
        selectedType = data.category;
        selectedPrice = data.price;
      });

      container.appendChild(card);
    });
  });
}

// 🔹 map icon ตาม category
function mapIcon(category) {
  if (category.includes("ข้าว")) return "assets/types/rice.png";
  if (category.includes("ผัก")) return "assets/types/vegetable.png";
  if (category.includes("กระดูก")) return "assets/types/bone.png";
  if (category.includes("เศษอาหารปรุงสุก")) return "assets/types/cooking.png";
  if (category.includes("เนื้อสัตว์")) return "assets/types/meat.png";
  if (category.includes("เศษอาหารที่ปนกัน")) return "assets/types/mix.png";
}

// 🔹 คำนวณราคา
function calculateEarnings() {
  const weight = parseFloat(
    document.getElementById("foodWeight").value
  );

  if (!selectedType) {
    alert("กรุณาเลือกประเภทเศษอาหาร");
    return;
  }

  if (!weight || weight <= 0) {
    alert("กรุณากรอกน้ำหนัก");
    return;
  }

  const total = weight * selectedPrice;
  document.getElementById("estimatedPrice").value = total;

  // เก็บไว้ใช้หน้าถัดไป
  localStorage.setItem("foodType", selectedType);
  localStorage.setItem("weight", weight);
  localStorage.setItem("price", total);
}

document.addEventListener("DOMContentLoaded", loadFoodTypes);
