const useLocationBtn = document.getElementById('useLocation');
const addressInput = document.getElementById('address');
const shippingCostInput = document.getElementById('shippingCost');

useLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(5);
      const lng = pos.coords.longitude.toFixed(5);

      addressInput.value = `ตำแหน่งปัจจุบัน (${lat}, ${lng})`;

      // ตัวอย่างคำนวณค่าขนส่ง
      calculateShipping(lat, lng);
    },
    () => {
      alert('ไม่สามารถดึงตำแหน่งได้');
    }
  );
});

function calculateShipping(lat, lng) {
  // ตัวอย่าง logic ง่าย ๆ
  const basePrice = 30;
  const distanceFactor = Math.random() * 20; // สมมติระยะทาง
  const total = basePrice + distanceFactor;

  shippingCostInput.value = total.toFixed(0) + ' บาท';
}

// submit
document.getElementById('sellForm').addEventListener('submit', (e) => {
  e.preventDefault();

  alert('ยืนยันการขายเรียบร้อย');
  // ตรงนี้ค่อยต่อ Firebase / redirect ไปหน้าชำระเงิน
  // location.href = 'payment.html';
});
