const weight = localStorage.getItem('weight')
const basePrice = 5
const total = weight * basePrice

document.getElementById('price').innerText =
  `ราคาประเมิน: ${total} บาท`

localStorage.setItem('price', total)

function goPay() {
  window.location.href = 'payment.html'
}
