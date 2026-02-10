// ================== CONFIG ==================
const STATUS_LABEL = {
    order_received: 'ได้รับคำสั่งซื้อ',
    picked_up: 'กำลังรับเศษอาหาร',
    inbound: 'ถึงโกดัง',
    evaluated: 'ประเมินราคา',
    sold: 'ขายแล้ว',
    completed: 'จ่ายเงินแล้ว'
};

const STATUS_ORDER = [
    'order_received',
    'picked_up',
    'inbound',
    'evaluated',
    'sold',
    'paid',
    'completed'
];

// ================== GLOBAL ==================
let shopsMap = {};
let paymentsMap = {};
let logisticsMap = {};
let schedulesMap = {};
let driversMap = {};
let allOrders = [];
let currentOrder = null;

// ================== HELPERS ==================
function formatDateTime(dt) {
    if (!dt) return '-';
    const [d, t] = dt.split(' ');
    return `${d} ${t || ''}`;
}

// ================== PAYMENT ==================
window.goToPayment = function(orderNo) {
    window.location.href = `payment.html?order_no=${orderNo}`;
};

// ================== VIEW DETAILS ==================
window.viewOrderDetails = function(orderNo) {
    const order = allOrders.find(o => String(o.order_no) === String(orderNo));
    if (!order) return;

    currentOrder = order;

    document.querySelector('.order_header p').textContent =
        `รหัสการขาย: ORD-${orderNo}`;

    // toggle pay button
    const paySection = document.getElementById('pay_section');
    if (paySection) {
        paySection.style.display =
            order.payment_status !== 'paid' ? 'block' : 'none';
    }

    document.getElementById('seller_address').textContent = order.address || '-';
    document.getElementById('order_datetime').textContent = formatDateTime(order.order_at);
    document.getElementById('distance').textContent = order.distance_km
        ? `${order.distance_km.toFixed(2)} กม.` : '-';
    document.getElementById('shipping_cost').textContent =
        order.shipping_fee ? `${order.shipping_fee} บาท` : '-';

    goto('order_details');
};

// ================== RENDER CARD ==================
function renderOrderCard(o) {
    const shopName = shopsMap[String(o.shop_id)] || 'ร้านค้า';
    const unpaid = o.payment_status !== 'paid';

    return `
    <div class="order_card">
        <div class="content_header">
            <h4>${shopName}</h4>
            <a>รหัสการขาย: ORD-${o.order_no}</a>
        </div>

        <p>
            วันที่: ${o.order_at || '-'} <br>
            สถานะ: ${o.status} <br>
            สถานะการชำระเงิน:
            <b style="color:${unpaid ? 'red' : 'green'}">
                ${unpaid ? 'ยังไม่ชำระเงิน' : 'ชำระแล้ว'}
            </b>
        </p>

        <button class="primary"
            onclick="viewOrderDetails('${o.order_no}')">
            ดูรายละเอียด
        </button>

        ${
            unpaid
            ? `<button class="danger"
                onclick="goToPayment('${o.order_no}')">
                💳 ชำระเงิน
              </button>`
            : ''
        }
    </div>`;
}

// ================== UPDATE UI ==================
function updateOrdersUI(inProcess, finished) {
    document.getElementById('in_processItems').innerText =
        `${inProcess.length} รายการ`;
    document.getElementById('finishedItems').innerText =
        `${finished.length} รายการ`;

    document.getElementById('in_process').innerHTML =
        inProcess.length
            ? inProcess.map(renderOrderCard).join('')
            : '<p>ไม่มีรายการ</p>';

    document.getElementById('finished').innerHTML =
        finished.length
            ? finished.map(renderOrderCard).join('')
            : '<p>ยังไม่มีรายการ</p>';
}

// ================== LOAD ORDERS ==================
async function loadUserOrders(userId) {

    // โหลดร้านค้า
    const shopsSnap = await get(ref(db, 'shops'));
    const shops = shopsSnap.val() || {};
    Object.keys(shops).forEach(k => {
        shopsMap[k] = shops[k].shop_name || shops[k].name;
    });

    // โหลด orders
    onValue(ref(db, 'orders'), snap => {
        const val = snap.val() || {};
        allOrders = Object.keys(val).map(k => ({
            order_no: k,
            ...val[k]
        }));

        const myOrders = allOrders.filter(o =>
            String(o.user_id) === String(userId)
        );

        const inProcess = myOrders.filter(o =>
            o.payment_status !== 'paid'
        );

        const finished = myOrders.filter(o =>
            o.payment_status === 'paid'
        );

        updateOrdersUI(inProcess, finished);
    });
}

window.goto = function(pageId){

    // ซ่อนทุก page
    document.querySelectorAll('.page').forEach(p=>{
        p.style.display = 'none';
    });

    // แสดง page ที่ต้องการ
    const target = document.getElementById(pageId);
    if(target){
        target.style.display = 'block';
    }
};

document.addEventListener("DOMContentLoaded", () => {
    goto("track");   // เปิดหน้า list เป็นหน้าแรก
});
