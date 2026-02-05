function goShipping() {
  localStorage.setItem('needShipping', 'true')
  location.href = 'sale-shipping-form.html'
}

function goNoShipping() {
  localStorage.setItem('needShipping', 'false')
  location.href = 'sale-form.html'
}
