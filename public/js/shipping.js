function getStoreId(){
  const params = new URLSearchParams(window.location.search);
  return params.get("storeId");
}

function goShipping(){
  const storeId = getStoreId();

  localStorage.setItem("storeId", storeId);
  localStorage.setItem("needShipping","true");

  location.href = "sale-shipping-form.html";
}

function goNoShipping(){
  const storeId = getStoreId();

  localStorage.setItem("storeId", storeId);
  localStorage.setItem("needShipping","false");

  location.href = "sale-form.html";
}
