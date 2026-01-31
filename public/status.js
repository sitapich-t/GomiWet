const user = JSON.parse(localStorage.getItem('user'))
const list = document.getElementById('list')

user.sales.forEach((s, i) => {
  const li = document.createElement('li')
  li.innerText = `ครั้งที่ ${i + 1} : ${s.status} (${s.amount} บาท)`
  list.appendChild(li)
})
