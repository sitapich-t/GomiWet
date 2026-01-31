function calculate() {
  const weight = document.getElementById('weight').value
  localStorage.setItem('weight', weight)
  window.location.href = 'price.html'
}
