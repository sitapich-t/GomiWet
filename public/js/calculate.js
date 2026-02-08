let foodWasteTypes = [];
// Fallback/default prices
const defaultFoodWasteTypes = [
    { category: "ข้าว", price: 7.0 },
    { category: "ผัก", price: 4.0 },
    { category: "กระดูก", price: 8.0 },
    { category: "เศษอาหารปรุงสุก", price: 5.5 },
    { category: "เนื้อสัตว์", price: 5.0 },
    { category: "เศษอาหารที่ปนกัน", price: 2.5 }
];

let selectedFoodTypeIndex = null;

// Load food waste types from Firebase
async function loadFoodWasteTypes() {
    try {
        const snapshot = await get(ref(db, "food_waste_types"));
        const data = snapshot.val();

        if (data && Object.keys(data).length > 0) {
            // Filter out null values and convert to array
            const fbTypes = Object.values(data).filter(item => item !== null);

            // Only use Firebase data if we got valid items
            if (fbTypes.length > 0) {
                foodWasteTypes = fbTypes;
                console.log("✅ Food waste types loaded from Firebase:", foodWasteTypes);
            } else {
                foodWasteTypes = defaultFoodWasteTypes;
                console.log("⚠️ Firebase empty, using default prices");
            }
        } else {
            foodWasteTypes = defaultFoodWasteTypes;
            console.log("⚠️ No Firebase data, using default prices");
        }
    } catch (error) {
        console.error("❌ Error loading from Firebase:", error);
        foodWasteTypes = defaultFoodWasteTypes;
        console.log("Using default prices as fallback");
    }

    // Update display after loading
    updatePricesDisplay();
}

// Update prices in HTML from foodWasteTypes array
function updatePricesDisplay() {
    console.log("🔄 Updating prices display...");
    console.log("Current foodWasteTypes:", foodWasteTypes);

    const priceElements = document.querySelectorAll("[data-price-index]");
    console.log(`Found ${priceElements.length} price elements to update`);

    priceElements.forEach((element, i) => {
        if (foodWasteTypes[i]) {
            const price = foodWasteTypes[i].price;
            element.textContent = `${price.toFixed(1)} บาท/กก.`;
            console.log(`✅ Updated price ${i}: ${foodWasteTypes[i].category} = ${price.toFixed(1)} บาท/กก.`);
        }
    });

    console.log("✅ Price update complete!");
}

window.selectFoodType = (index) => {
    selectedFoodTypeIndex = index;
    const cards = document.querySelectorAll(".card_frame .card");
    cards.forEach((card, i) => {
        card.style.border = i === index ? "3px solid green" : "1px solid #ccc";
    });
    console.log(`Selected: ${foodWasteTypes[index].category}`);
};

window.calculateEarnings = () => {
    if (selectedFoodTypeIndex === null) {
        alert("กรุณาเลือกประเภทเศษอาหาร");
        return;
    }

    const weight = Number(document.getElementById("foodWeight").value);
    if (!weight || weight <= 0) {
        alert("กรุณากรอกน้ำหนักที่ถูกต้อง");
        return;
    }

    const selectedType = foodWasteTypes[selectedFoodTypeIndex];
    const estimatedPrice = weight * selectedType.price;

    document.getElementById("estimatedPrice").value = estimatedPrice.toFixed(2);
    console.log(`${weight} กก. × ${selectedType.price} บาท/กก. = ${estimatedPrice.toFixed(2)} บาท`);
};

window.calculate = () => {
    const a = Number(num1.value);
    const b = Number(num2.value);
    document.getElementById("calcResult").innerText = `ผลลัพธ์ = ${a + b}`;
};