function selectShipping(isShipping) {
  // เก็บสถานะไว้ใช้หน้าถัดไป
  localStorage.setItem('needShipping', isShipping)

  // ไปหน้ากรอกข้อมูลขาย
  location.href = 'sale-form.html'
}
