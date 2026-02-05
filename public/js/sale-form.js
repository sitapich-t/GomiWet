let selectedTime = ''

function selectTime(btn) {
  document.querySelectorAll('.time-grid button')
    .forEach(b => b.classList.remove('active'))

  btn.classList.add('active')
  selectedTime = btn.innerText
}

document.getElementById('shippingForm').addEventListener('submit', e => {
  e.preventDefault()

  const data = {
    needShipping: true,
    pickupDate: pickupDate.value,
    address: pickupAddress.value,
    price: shippingPrice.value,
    time: selectedTime,
    note: note.value
  }

  localStorage.setItem('saleShippingData', JSON.stringify(data))

  alert('บันทึกข้อมูลขนส่งเรียบร้อย')
})
