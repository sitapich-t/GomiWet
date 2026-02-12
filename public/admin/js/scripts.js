// ==================== App State ====================
let appData = {
    orders: {},
    sellers: {},
    deliveryEmployees: {},
    deliveryCars: {},
    deliverySlots: {},
    foodWasteTypes: {},
    shops: {},
    bankAccounts: {},
    logistics: {},      // logistic table
    payments: {},       // payment table (indexed by payment key)
    pickupAddresses: {} // pickup_addresses table
};

let currentTab = 'incoming';
let selectedOrder = null;
let selectedLogisticKey = null; // key in logistic table for current action

// ==================== Init ====================

async function init() {
    showLoading();
    await loadData();
    setupRealtimeListeners();
    setupTabs();
    renderTab(currentTab);
    updateStats();
}

function showLoading() {
    document.getElementById('tabContent').innerHTML =
        '<div class="loading"><div class="spinner"></div><p>กำลังโหลดข้อมูล...</p></div>';
}

// ==================== Load Data ====================

async function loadData() {
    try {
        const [
            ordersSnap, sellersSnap, employeesSnap, carsSnap, slotsSnap,
            wasteTypesSnap, shopsSnap, bankAccountsSnap,
            logisticSnap, paymentSnap, pickupAddrSnap
        ] = await Promise.all([
            database.ref('order').once('value'),
            database.ref('sellers').once('value'),
            database.ref('delivery_emps').once('value'),
            database.ref('delivery_cars').once('value'),
            database.ref('delivery_slots').once('value'),
            database.ref('food_waste_types').once('value'),
            database.ref('shops').once('value'),
            database.ref('bank_accounts').once('value'),
            database.ref('logistic').once('value'),
            database.ref('payment').once('value'),
            database.ref('pickup_addresses').once('value')
        ]);

        appData.orders          = ordersSnap.val()       || {};
        appData.sellers         = sellersSnap.val()      || {};
        appData.deliveryEmployees = employeesSnap.val()  || {};
        appData.deliveryCars    = carsSnap.val()         || {};
        appData.deliverySlots   = slotsSnap.val()        || {};
        appData.foodWasteTypes  = wasteTypesSnap.val()   || {};
        appData.shops           = shopsSnap.val()        || {};
        appData.bankAccounts    = bankAccountsSnap.val() || {};
        appData.logistics       = logisticSnap.val()     || {};
        appData.payments        = paymentSnap.val()      || {};
        appData.pickupAddresses = pickupAddrSnap.val()   || {};

        console.log('✅ Data loaded');
        console.log('📦 Orders:', Object.keys(appData.orders).length);
        console.log('🚚 Logistics:', Object.keys(appData.logistics).length);
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showNotification('ไม่สามารถโหลดข้อมูลได้', 'error');
    }
}

// ==================== Realtime Listeners ====================

function setupRealtimeListeners() {
    database.ref('order').on('value', (snap) => {
        appData.orders = snap.val() || {};
        renderTab(currentTab);
        updateStats();
    });

    database.ref('logistic').on('value', (snap) => {
        appData.logistics = snap.val() || {};
        renderTab(currentTab);
    });
}

// ==================== Tabs ====================

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            renderTab(currentTab);
        });
    });
}

function renderTab(tab) {
    const content = document.getElementById('tabContent');
    switch (tab) {
        case 'incoming':  content.innerHTML = renderIncomingOrders(); break;
        case 'logistics': content.innerHTML = renderLogistics();      break;
        case 'warehouse': content.innerHTML = renderWarehouse();      break;
        case 'sorting':   content.innerHTML = renderSorting();        break;
        case 'pricing':   content.innerHTML = renderPricing();        break;
        case 'outbound':  content.innerHTML = renderOutbound();       break;
        case 'payment':   content.innerHTML = renderPayment();        break;
    }
}

// ==================== Helper: Find logistic by payment_id ====================

function getLogisticByPaymentId(paymentId) {
    return Object.entries(appData.logistics).find(([k, l]) =>
        l && String(l.payment_id) === String(paymentId)
    );
}

// Find payment record by order_no
function getPaymentByOrderNo(orderNo) {
    return Object.entries(appData.payments).find(([k, p]) =>
        p && String(p.order_no) === String(orderNo)
    );
}

// Find pickup address by order_no
function getPickupAddress(orderNo) {
    return Object.values(appData.pickupAddresses).find(a =>
        a && String(a.order_no) === String(orderNo)
    ) || null;
}

// ==================== Format datetime ====================

function formatDT(dtStr) {
    if (!dtStr) return '-';
    return dtStr.replace('T', ' ').substring(0, 16);
}

// ==================== TAB: รายการเข้า (incoming) ====================
// แสดงออเดอร์ที่ status = order_received
//   - pickup  → ปุ่ม "มอบหมายขนส่ง"  (เปิด modal เลือก driver+schedule)
//   - dropoff → แสดงข้อมูล (ไม่ต้องมอบหมายขนส่ง)

function renderIncomingOrders() {
    const orders = Object.entries(appData.orders)
        .filter(([_, o]) => o.status === 'order_received');

    if (!orders.length) return '<div class="loading">ไม่มีรายการเข้าใหม่</div>';

    return orders.map(([id, order]) => {
        const seller = appData.sellers[order.user_id];
        const shop   = appData.shops[order.shop_id];
        const isPickup = order.delivery_type === 'pickup';

        // Has logistic already been assigned? (picked_up shows in logistics tab)
        const paymentEntry = getPaymentByOrderNo(id);
        const paymentId = paymentEntry ? paymentEntry[0] : null;
        const logisticEntry = paymentId ? getLogisticByPaymentId(paymentId) : null;
        const alreadyAssigned = !!(logisticEntry && logisticEntry[1]);

        let actionBtn = '';
        if (isPickup && !alreadyAssigned) {
            actionBtn = `<button class="btn btn-primary" onclick="openAssignLogistics('${id}')">🚚 มอบหมายขนส่ง</button>`;
        } else if (isPickup && alreadyAssigned) {
            actionBtn = `<span class="status-badge status-in_process">✅ มอบหมายขนส่งแล้ว — ดูที่แท็บ "จัดการขนส่ง"</span>`;
        } else {
            actionBtn = `<span class="status-badge status-inbound">📦 ลูกค้านำส่งเอง</span>`;
        }

        return `
        <div class="order-item">
            <div class="order-header">
                <span class="order-number">คำสั่งซื้อ #${id}</span>
                <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">ผู้ขาย</span>
                    <span class="detail-value">${seller?.name || 'N/A'} ${seller?.surname || ''}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ร้านรับซื้อ</span>
                    <span class="detail-value">${shop?.shop_name || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">วันที่นัดหมาย</span>
                    <span class="detail-value">${order.booked_delivery_date || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ประเภท</span>
                    <span class="detail-value">${isPickup ? '🚚 รับถึงที่' : '🏪 ลูกค้านำส่ง'}</span>
                </div>
            </div>
            ${actionBtn}
        </div>`;
    }).join('');
}

// ==================== TAB: จัดการขนส่ง (logistics) ====================
// แสดงออเดอร์ที่มี logistic record แล้ว (status in logistic = 'in process')
// โดย order อาจ status = order_received หรือ picked_up
//
// ปุ่มที่แสดง:
//   - ยังไม่มี pickup_at → "ยืนยันการเข้ารับ" (บันทึก pickup_at, order → picked_up)
//   - มี pickup_at แล้ว แต่ยังไม่มี delivered_at → "ถึงโกดัง" (บันทึก delivered_at, order → inbound)

function renderLogistics() {
    // Gather all logistic entries that are 'in process' and have payment_id (pickup orders)
    const logisticEntries = Object.entries(appData.logistics)
        .filter(([k, l]) => l && l.payment_id && (!l.status || l.status === 'in process'));

    if (!logisticEntries.length) return '<div class="loading">ไม่มีรายการที่จัดการขนส่ง</div>';

    const cards = logisticEntries.map(([logKey, logistic]) => {
        // Find order via payment
        const paymentEntry = Object.entries(appData.payments).find(([pk, p]) =>
            p && String(pk) === String(logistic.payment_id)
        );
        if (!paymentEntry) return '';

        const [, payment] = paymentEntry;
        const orderNo = String(payment.order_no);
        const order   = appData.orders[orderNo];
        if (!order) return '';

        const seller   = appData.sellers[order.user_id];
        const schedule = appData.deliverySlots
            ? null : null; // schedule_id points to driving_schedules, not slots

        // Get driver info from schedule → driving_schedules → delivery_emps
        let driverName  = 'ไม่ทราบ';
        let licensePlate = '-';
        if (logistic.schedule_id) {
            database.ref(`driving_schedules/${logistic.schedule_id}`).once('value').then(s => {
                // async; we use appData cache instead
            });
            // Try to resolve from in-memory if previously loaded
        }

        // Determine button state
        let actionBtn = '';
        if (!logistic.pickup_at) {
            // ยังไม่ได้รับ → แสดงปุ่มยืนยันการเข้ารับ
            actionBtn = `
                <button class="btn btn-warning" onclick="confirmPickup('${logKey}', '${orderNo}')">
                    📍 ยืนยันการเข้ารับ
                </button>`;
        } else if (!logistic.delivered_at) {
            // รับแล้วแต่ยังไม่ถึงโกดัง → ปุ่มถึงโกดัง
            actionBtn = `
                <button class="btn btn-success" onclick="confirmArrival('${logKey}', '${orderNo}')">
                    🏭 ถึงโกดัง
                </button>`;
        } else {
            actionBtn = `<span class="status-badge status-inbound">✅ ถึงโกดังแล้ว</span>`;
        }

        const pickupAddr = getPickupAddress(orderNo);

        return `
        <div class="order-item">
            <div class="order-header">
                <span class="order-number">คำสั่งซื้อ #${orderNo}</span>
                <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">ผู้ขาย</span>
                    <span class="detail-value">${seller?.name || 'N/A'} ${seller?.surname || ''}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ที่อยู่รับ</span>
                    <span class="detail-value">${pickupAddr
                        ? `${pickupAddr.address} ${pickupAddr.sub_district} ${pickupAddr.district} ${pickupAddr.province}`
                        : 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ระยะทาง</span>
                    <span class="detail-value">${pickupAddr?.distance != null ? pickupAddr.distance + ' กม.' : '-'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">วันที่นัดหมาย</span>
                    <span class="detail-value">${order.booked_delivery_date || 'N/A'}</span>
                </div>
                ${logistic.pickup_at ? `
                <div class="detail-item">
                    <span class="detail-label">เวลาเข้ารับ</span>
                    <span class="detail-value">${formatDT(logistic.pickup_at)}</span>
                </div>` : ''}
                ${logistic.delivered_at ? `
                <div class="detail-item">
                    <span class="detail-label">เวลาถึงโกดัง</span>
                    <span class="detail-value">${formatDT(logistic.delivered_at)}</span>
                </div>` : ''}
            </div>
            ${actionBtn}
        </div>`;
    }).filter(Boolean).join('');

    return cards || '<div class="loading">ไม่มีรายการที่จัดการขนส่ง</div>';
}

// ==================== TAB: โกดัง (warehouse) ====================

function renderWarehouse() {
    const orders = Object.entries(appData.orders)
        .filter(([_, o]) => o.status === 'inbound');

    if (!orders.length) return '<div class="loading">ไม่มีเศษอาหารที่โกดัง</div>';

    return orders.map(([id, order]) => {
        const seller = appData.sellers[order.user_id];
        return `
        <div class="order-item">
            <div class="order-header">
                <span class="order-number">คำสั่งซื้อ #${id}</span>
                <span class="status-badge status-${order.status}">อยู่ที่โกดัง</span>
            </div>
            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">ผู้ขาย</span>
                    <span class="detail-value">${seller?.name || 'N/A'} ${seller?.surname || ''}</span>
                </div>
            </div>
            <button class="btn btn-warning" onclick="startSorting('${id}')">📦 เริ่มคัดแยก</button>
        </div>`;
    }).join('');
}

// ==================== TAB: คัดแยก (sorting) ====================

function renderSorting() {
    const orders = Object.entries(appData.orders)
        .filter(([_, o]) => o.status === 'sorted');

    if (!orders.length) return '<div class="loading">ไม่มีรายการที่รอประเมินราคา</div>';

    return orders.map(([id, order]) => {
        const seller = appData.sellers[order.user_id];
        return `
        <div class="order-item">
            <div class="order-header">
                <span class="order-number">คำสั่งซื้อ #${id}</span>
                <span class="status-badge status-${order.status}">คัดแยกแล้ว</span>
            </div>
            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">ผู้ขาย</span>
                    <span class="detail-value">${seller?.name || 'N/A'} ${seller?.surname || ''}</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="evaluatePrice('${id}')">💰 ประเมินราคา</button>
        </div>`;
    }).join('');
}

// ==================== TAB: ประเมินราคา (pricing) ====================

function renderPricing() {
    const orders = Object.entries(appData.orders)
        .filter(([_, o]) => o.status === 'evaluated');

    if (!orders.length) return '<div class="loading">ไม่มีรายการที่รอส่งออก</div>';

    return orders.map(([id, order]) => {
        const seller = appData.sellers[order.user_id];
        return `
        <div class="order-item">
            <div class="order-header">
                <span class="order-number">คำสั่งซื้อ #${id}</span>
                <span class="status-badge status-${order.status}">ประเมินราคาแล้ว</span>
            </div>
            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">ผู้ขาย</span>
                    <span class="detail-value">${seller?.name || 'N/A'} ${seller?.surname || ''}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">ราคาประเมิน</span>
                    <span class="detail-value">${order.estimatedPrice?.toFixed(2) || '-'} บาท</span>
                </div>
            </div>
            <button class="btn btn-success" onclick="sendToOutbound('${id}')">📤 ส่งออกไปยังผู้ซื้อ</button>
        </div>`;
    }).join('');
}

// ==================== TAB: ส่งออก (outbound) ====================

function renderOutbound() {
    const orders = Object.entries(appData.orders)
        .filter(([_, o]) => o.status === 'outbound');

    if (!orders.length) return '<div class="loading">ไม่มีรายการที่กำลังส่งออก</div>';

    return orders.map(([id, order]) => {
        const shop = appData.shops[order.shop_id];
        return `
        <div class="order-item">
            <div class="order-header">
                <span class="order-number">คำสั่งซื้อ #${id}</span>
                <span class="status-badge status-${order.status}">กำลังส่งออก</span>
            </div>
            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">ผู้ซื้อ</span>
                    <span class="detail-value">${shop?.shop_name || 'N/A'}</span>
                </div>
            </div>
            <button class="btn btn-success" onclick="markAsDelivered('${id}')">✅ ส่งถึงผู้ซื้อแล้ว</button>
        </div>`;
    }).join('');
}

// ==================== TAB: โอนเงิน (payment) ====================

function renderPayment() {
    const orders = Object.entries(appData.orders)
        .filter(([_, o]) => o.status === 'sold');

    if (!orders.length) return '<div class="loading">ไม่มีรายการที่รอโอนเงิน</div>';

    return orders.map(([id, order]) => {
        const seller = appData.sellers[order.user_id];
        const bankAccount = Object.values(appData.bankAccounts)
            .find(acc => acc.user_id === order.user_id);
        return `
        <div class="order-item">
            <div class="order-header">
                <span class="order-number">คำสั่งซื้อ #${id}</span>
                <span class="status-badge status-${order.status}">รอโอนเงิน</span>
            </div>
            <div class="order-details">
                <div class="detail-item">
                    <span class="detail-label">ผู้ขาย</span>
                    <span class="detail-value">${seller?.name || 'N/A'} ${seller?.surname || ''}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">บัญชีธนาคาร</span>
                    <span class="detail-value">${bankAccount?.bank_account_number || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">PromptPay</span>
                    <span class="detail-value">${bankAccount?.promptpay || 'N/A'}</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="processPayment('${id}')">💳 โอนเงิน</button>
        </div>`;
    }).join('');
}

// ==================== Modal helpers ====================

function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// ==================== ASSIGN LOGISTICS (Modal) ====================
// เปิด modal เลือก driver + ทะเบียนรถ → กดยืนยัน → สร้าง logistic record (in process)
// order status ยังคง order_received ตอนนี้ แต่ logistic record ใหม่จะทำให้ tab logistics หยิบไปแสดง

function openAssignLogistics(orderId) {
    selectedOrder = orderId;
    const order  = appData.orders[orderId];
    const seller = appData.sellers[order.user_id];

    const driverOptions = Object.entries(appData.deliveryEmployees)
        .map(([id, d]) =>
            `<option value="${id}">${d.title || ''} ${d.name} ${d.surname} — ${d.telephone}</option>`
        ).join('');

    const carOptions = Object.entries(appData.deliveryCars)
        .map(([plate, car]) =>
            `<option value="${plate}">${plate} (${car.model})</option>`
        ).join('');

    document.getElementById('assignLogisticsContent').innerHTML = `
        <div class="info-box">
            <strong>คำสั่งซื้อ #${orderId}</strong><br>
            ผู้ขาย: ${seller?.name || 'N/A'} ${seller?.surname || ''}<br>
            วันที่นัดหมาย: ${order.booked_delivery_date || 'N/A'}
        </div>
        <div class="form-group">
            <label>เลือกพนักงานขนส่ง</label>
            <select id="selectedDriver">
                <option value="">-- เลือกพนักงาน --</option>
                ${driverOptions}
            </select>
        </div>
        <div class="form-group">
            <label>ทะเบียนรถ</label>
            <select id="selectedCar">
                <option value="">-- เลือกรถ --</option>
                ${carOptions}
            </select>
        </div>
        <button class="btn btn-primary" onclick="confirmAssignLogistics()">✅ ยืนยันการมอบหมาย</button>
    `;

    openModal('assignLogisticsModal');
}

async function confirmAssignLogistics() {
    const driverId  = document.getElementById('selectedDriver').value;
    const carPlate  = document.getElementById('selectedCar').value;

    if (!driverId || !carPlate) {
        showNotification('กรุณาเลือกพนักงานและทะเบียนรถ', 'warning');
        return;
    }

    try {
        // 1. หา payment_id จาก order_no
        const paymentEntry = getPaymentByOrderNo(selectedOrder);
        if (!paymentEntry) {
            showNotification('ไม่พบข้อมูล payment สำหรับออเดอร์นี้', 'error');
            return;
        }
        const paymentId = paymentEntry[0];

        // 2. สร้าง record ใหม่ใน driving_schedules ก่อน (เพื่อเก็บ driver + ทะเบียน)
        const newScheduleRef = database.ref('driving_schedules').push();
        const scheduleId = newScheduleRef.key;
        await newScheduleRef.set({
            delivery_id:   parseInt(driverId),
            license_plate: carPlate,
            assigned_at:   getNowString()
        });

        // 3. สร้าง record ใหม่ใน logistic
        const newLogisticRef = database.ref('logistic').push();
        await newLogisticRef.set({
            payment_id:  parseInt(paymentId),
            schedule_id: scheduleId,
            status:      'in process'
        });

        console.log(`✅ Logistic created for order ${selectedOrder}, payment ${paymentId}`);
        showNotification('มอบหมายขนส่งเรียบร้อย — ออเดอร์อยู่ที่แท็บ "จัดการขนส่ง"', 'success');
        closeModal('assignLogisticsModal');
    } catch (err) {
        console.error('Error:', err);
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

// ==================== CONFIRM PICKUP (ยืนยันการเข้ารับ) ====================
// บันทึก pickup_at ใน logistic → order status → picked_up

async function confirmPickup(logKey, orderNo) {
    const now = getNowString();
    try {
        // บันทึก pickup_at ใน logistic (status ยังเป็น in process)
        await database.ref(`logistic/${logKey}`).update({
            pickup_at: now,
            status:    'in process'
        });

        // เปลี่ยน order status → picked_up
        await database.ref(`order/${orderNo}`).update({
            status: 'picked_up'
        });

        console.log(`✅ Pickup confirmed for order ${orderNo} at ${now}`);
        showNotification('ยืนยันการเข้ารับเรียบร้อย', 'success');
    } catch (err) {
        console.error('Error:', err);
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

// ==================== CONFIRM ARRIVAL (ถึงโกดัง) ====================
// บันทึก delivered_at ใน logistic → สร้าง inbound_food_waste → order status → inbound

async function confirmArrival(logKey, orderNo) {
    const now = getNowString();
    try {
        // 1. บันทึก delivered_at ใน logistic + status completed
        await database.ref(`logistic/${logKey}`).update({
            delivered_at: now,
            status:       'completed'
        });

        // 2. สร้าง inbound_food_waste record
        const newInboundRef = database.ref('inbound_food_waste').push();
        await newInboundRef.set({
            logistic_id: logKey,
            drop_off_id: null,
            inbound_at:  now,
            status:      'waiting'
        });

        // 3. เปลี่ยน order status → inbound
        await database.ref(`order/${orderNo}`).update({
            status: 'inbound'
        });

        console.log(`✅ Arrival confirmed for order ${orderNo} at ${now}`);
        showNotification('บันทึกการถึงโกดังเรียบร้อย', 'success');
    } catch (err) {
        console.error('Error:', err);
        showNotification('เกิดข้อผิดพลาด: ' + err.message, 'error');
    }
}

// ==================== SORTING ====================

function startSorting(orderId) {
    selectedOrder = orderId;

    const wasteTypesHtml = Object.entries(appData.foodWasteTypes)
        .map(([id, type]) => `
        <div class="waste-type-card" onclick="toggleWasteType(this, '${id}')">
            <div class="waste-type-name">${type.category}</div>
            <div class="waste-type-price">${type.price} บาท/กก.</div>
            <div style="margin-top: 0.5rem;">
                <input type="number"
                    class="waste-weight"
                    data-waste-id="${id}"
                    placeholder="น้ำหนัก (กก.)"
                    onclick="event.stopPropagation()"
                    style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:4px;">
            </div>
        </div>`).join('');

    document.getElementById('sortingContent').innerHTML = `
        <div class="info-box">
            <strong>คำสั่งซื้อ #${orderId}</strong><br>
            เลือกประเภทเศษอาหารที่คัดแยกได้และระบุน้ำหนัก
        </div>
        <div class="waste-types">${wasteTypesHtml}</div>
        <button class="btn btn-success" onclick="confirmSorting()">💾 บันทึกการคัดแยก</button>
    `;

    openModal('sortingModal');
}

function toggleWasteType(el) { el.classList.toggle('selected'); }

async function confirmSorting() {
    const weights = {};
    document.querySelectorAll('.waste-weight').forEach(input => {
        if (input.value) weights[input.dataset.wasteId] = parseFloat(input.value);
    });

    if (!Object.keys(weights).length) {
        showNotification('กรุณาระบุน้ำหนักอย่างน้อย 1 ประเภท', 'warning');
        return;
    }

    try {
        await database.ref(`order/${selectedOrder}`).update({
            status:      'sorted',
            sortedWaste: weights,
            sorted_at:   getNowString()
        });
        showNotification('บันทึกการคัดแยกเรียบร้อย', 'success');
        closeModal('sortingModal');
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด', 'error');
    }
}

// ==================== PRICING ====================

function evaluatePrice(orderId) {
    selectedOrder = orderId;
    const order = appData.orders[orderId];
    const sortedWaste = order.sortedWaste || {};

    let totalPrice = 0;
    const rows = Object.entries(sortedWaste).map(([wasteId, weight]) => {
        const wt = appData.foodWasteTypes[wasteId];
        const price = weight * (wt?.price || 0);
        totalPrice += price;
        return `
        <tr>
            <td style="padding:0.5rem">${wt?.category || wasteId}</td>
            <td style="padding:0.5rem">${weight} กก.</td>
            <td style="padding:0.5rem">${wt?.price || 0} บาท/กก.</td>
            <td style="padding:0.5rem">${price.toFixed(2)} บาท</td>
        </tr>`;
    }).join('');

    document.getElementById('pricingContent').innerHTML = `
        <div class="info-box"><strong>คำสั่งซื้อ #${orderId}</strong></div>
        <table style="width:100%;margin-bottom:1rem;border-collapse:collapse;">
            <thead>
                <tr style="background:var(--bg-light);text-align:left;">
                    <th style="padding:0.75rem">ประเภท</th>
                    <th style="padding:0.75rem">น้ำหนัก</th>
                    <th style="padding:0.75rem">ราคา/หน่วย</th>
                    <th style="padding:0.75rem">รวม</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr style="font-weight:600;background:var(--bg-light)">
                    <td colspan="3" style="padding:0.75rem;text-align:right">ราคารวมทั้งหมด:</td>
                    <td style="padding:0.75rem;color:var(--success)">${totalPrice.toFixed(2)} บาท</td>
                </tr>
            </tbody>
        </table>
        <button class="btn btn-primary" onclick="confirmPricing(${totalPrice})">✅ ยืนยันราคาและส่งให้ผู้ขาย</button>
    `;

    openModal('pricingModal');
}

async function confirmPricing(totalPrice) {
    try {
        await database.ref(`order/${selectedOrder}`).update({
            status:         'evaluated',
            estimatedPrice: totalPrice,
            evaluated_at:   getNowString()
        });
        showNotification('ประเมินราคาและส่งให้ผู้ขายแล้ว', 'success');
        closeModal('pricingModal');
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด', 'error');
    }
}

// ==================== OUTBOUND ====================

async function sendToOutbound(orderId) {
    try {
        await database.ref(`order/${orderId}`).update({
            status:      'outbound',
            outbound_at: getNowString()
        });
        showNotification('ส่งออกเศษอาหารแล้ว', 'success');
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด', 'error');
    }
}

async function markAsDelivered(orderId) {
    try {
        await database.ref(`order/${orderId}`).update({
            status:       'sold',
            delivered_at: getNowString()
        });
        showNotification('เศษอาหารถึงผู้ซื้อแล้ว', 'success');
    } catch (err) {
        showNotification('เกิดข้อผิดพลาด', 'error');
    }
}

// ==================== PAYMENT ====================

function processPayment(orderId) {
    selectedOrder = orderId;
    const order = appData.orders[orderId];
    const seller = appData.sellers[order.user_id];
    const bankAccount = Object.values(appData.bankAccounts)
        .find(acc => acc.user_id === order.user_id);

    document.getElementById('paymentContent').innerHTML = `
        <div class="info-box">
            <strong>คำสั่งซื้อ #${orderId}</strong><br>
            ผู้ขาย: ${seller?.name || 'N/A'} ${seller?.surname || ''}<br>
            ยอดเงิน: ${order.estimatedPrice?.toFixed(2) || '0.00'} บาท
        </div>
        <div class="form-group">
            <label>บัญชีธนาคาร</label>
            <input type="text" value="${bankAccount?.bank_account_number || ''}" readonly>
        </div>
        <div class="form-group">
            <label>PromptPay</label>
            <input type="text" value="${bankAccount?.promptpay || ''}" readonly>
        </div>
        <div class="form-group">
            <label>แนบสลิปการโอนเงิน</label>
            <div class="file-upload" onclick="document.getElementById('slipFile').click()">
                <span>📎 คลิกเพื่ออัพโหลดสลิป</span>
                <input type="file" id="slipFile" accept="image/*" style="display:none" onchange="previewSlip(this)">
            </div>
            <div id="slipPreview" style="margin-top:1rem"></div>
        </div>
        <button class="btn btn-success" onclick="confirmPayment()">✅ ยืนยันการโอนเงิน</button>
    `;

    openModal('paymentModal');
}

function previewSlip(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('slipPreview').innerHTML =
                `<img src="${e.target.result}" style="max-width:100%;border-radius:8px;border:2px solid var(--border)">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function confirmPayment() {
    const slipFile = document.getElementById('slipFile').files[0];
    if (!slipFile) {
        showNotification('กรุณาแนบสลิปการโอนเงิน', 'warning');
        return;
    }

    try {
        const storageRef = storage.ref(`payment-slips/${selectedOrder}-${Date.now()}.jpg`);
        const uploadTask = await storageRef.put(slipFile);
        const slipUrl    = await uploadTask.ref.getDownloadURL();

        await database.ref(`order/${selectedOrder}`).update({
            status:        'completed',
            payment_slip:  slipUrl,
            paid_at:       getNowString()
        });

        showNotification('โอนเงินเรียบร้อย คำสั่งซื้อสมบูรณ์', 'success');
        closeModal('paymentModal');
    } catch (err) {
        console.error('Error:', err);
        showNotification('เกิดข้อผิดพลาด', 'error');
    }
}

// ==================== Stats ====================

function updateStats() {
    document.getElementById('totalOrders').textContent   = Object.keys(appData.orders).length;
    document.getElementById('pendingOrders').textContent =
        Object.values(appData.orders).filter(o => o.status !== 'completed').length;
}

// ==================== Utilities ====================

function getNowString() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ` +
           `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function getStatusText(status) {
    return {
        order_received: 'รับคำสั่งซื้อ',
        picked_up:      'รับเศษอาหารแล้ว',
        inbound:        'ถึงโกดัง',
        sorted:         'คัดแยกแล้ว',
        evaluated:      'ประเมินราคาแล้ว',
        outbound:       'ส่งออก',
        sold:           'ขายแล้ว',
        completed:      'สำเร็จ',
        waiting:        'รอดำเนินการ',
        in_process:     'กำลังดำเนินการ'
    }[status] || status;
}

function showNotification(message, type = 'info') {
    const colors = {
        success: 'var(--success)',
        warning: 'var(--warning)',
        error:   'var(--danger)',
        info:    'var(--primary)'
    };
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;top:100px;right:20px;
        background:${colors[type]};color:white;
        padding:1rem 1.5rem;border-radius:8px;
        box-shadow:0 4px 20px rgba(0,0,0,.2);
        z-index:10000;font-family:'Prompt',sans-serif;
        animation:slideIn .3s ease;
    `;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity .3s';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// ==================== Start ====================
init();