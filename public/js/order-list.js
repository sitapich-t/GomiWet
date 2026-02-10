const userId = localStorage.getItem("userId");

async function loadOrders(){

    const snap = await db.ref("order")
        .orderByChild("user_id")
        .equalTo(userId)
        .once("value");

    let processingHTML = "";
    let successHTML = "";

    snap.forEach(child => {

        const order = child.val();
        const orderId = child.key;

        const card = `
        <div class="order-card">
            <div><b>รหัสออเดอร์:</b> ${orderId}</div>
            <div><b>สถานะ:</b> ${order.status}</div>
            <button onclick="goDetail('${orderId}')">ดูรายละเอียด</button>
        </div>
        `;

        if(order.status === "processing"){
            processingHTML += card;
        }
        else if(order.status === "completed"){
            successHTML += card;
        }

    });

    document.getElementById("processing-orders").innerHTML = processingHTML;
    document.getElementById("success-orders").innerHTML = successHTML;
}

function goDetail(orderId){
    location.href = `order-status.html?orderId=${orderId}`;
}

window.addEventListener("DOMContentLoaded", loadOrders);
