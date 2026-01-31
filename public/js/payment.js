const price = localStorage.getItem('price')
document.getElementById('amount').innerText = `ยอดเงิน ${price} บาท`

function pay() {
  const user = JSON.parse(localStorage.getItem('user'))

  user.sales.push({
    amount: price,
    status: 'กำลังขนส่ง'
  })
  user.total += Number(price)

  localStorage.setItem('user', JSON.stringify(user))
  window.location.href = 'status.html'
}
