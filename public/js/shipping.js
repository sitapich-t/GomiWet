const params = new URLSearchParams(window.location.search);
const storeId = params.get("storeId");

console.log("storeId:", storeId);

function goShipping(){
  localStorage.setItem("storeId", storeId);
  localStorage.setItem("delivery_type","pickup");

  location.href = `sale-shipping-form.html?storeId=${storeId}`;
}

function goNoShipping(){
  localStorage.setItem("storeId", storeId);
  localStorage.setItem("delivery_type","dropoff");

  location.href = `sale-form.html?storeId=${storeId}`;
}
