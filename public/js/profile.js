const user = JSON.parse(localStorage.getItem("user"))

document.getElementById("name").innerText = user.name
document.getElementById("avatar").src = user.picture
