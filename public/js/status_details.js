// ==================== Status Labels ====================
const STATUS_LABEL = {
	'order_received': 'ได้รับคำสั่งซื้อ',
    'assigned': 'มอบหมายขนส่ง',
	'picked_up': 'กำลังส่งไปโกดัง',
	'inbound': 'ถึงโกดังและคัดแยก',
	'sorted': 'คัดแยกเสร็จสิ้น',
	'evaluated': 'ประเมินราคา',
	'outbound': 'กำลังขาย',
	'sold': 'ขายให้ผู้ซื้อ',
	'paid': 'จ่ายเงินเสร็จสิ้น',
    'completed': 'ทำรายการเสร็จสิ้น'
};

// Status order for determining which statuses are "reached"
// Each entry = the timeline step, and which DB statuses count as having completed it
const TIMELINE_STEPS = ['order_received', 'picked_up', 'inbound', 'evaluated', 'sold', 'paid'];

// Map: timeline step -> which order statuses count as "reached or passed" this step
const STATUS_REACHED_MAP = {
    order_received: ['order_received', 'picked_up', 'inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
    assigned: ['picked_up', 'inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
    picked_up: ['picked_up', 'inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
    inbound: ['inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
    evaluated: ['evaluated', 'outbound', 'sold', 'paid', 'completed'],
    sold: ['sold', 'paid', 'completed'],
    paid: ['paid', 'completed']
};

// ==================== Global Variables ====================
let paymentsMap = {};           // keyed by order_no (string)
let logisticsMap = {};          // all logistic entries for this payment
let selfDropOffMap = {};        // all self_drop_off for this payment
let schedulesMap = {};          // driving schedule for this logistic
let driversMap = {};            // delivery emp
let inboundFoodWasteMap = {};   // inbound_food_waste entries for this order chain
let waitingSortMap = {};        // waiting_sort entries for this order chain
let priceEstimationMap = {};    // price_estimation entries
let outboundFoodWasteMap = {};  // outbound_food_waste entries
let sellerPayoutsMap = {};      // seller_payouts entries
let foodWasteTypesMap = {};     // food_waste_types (static ref data)
let bankAccountsMap = {};       // bank_accounts
let currentOrder = null;

// ==================== Helper Functions ====================

function formatDateToDDMMYYYY(dateInput) {
    if (!dateInput) return '-';

    let dateObj;

    // ✅ ถ้าเป็น timestamp (number)
    if (typeof dateInput === 'number') {
        dateObj = new Date(dateInput);
    }
    // ✅ ถ้าเป็น string เช่น "2026-02-11 20:00"
    else if (typeof dateInput === 'string') {
        dateObj = new Date(dateInput.replace(' ', 'T'));
    }
    else {
        return '-';
    }

    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
}

function formatTimeToHHMM(timeInput) {
    if (!timeInput) return 'xx:xx น.';

    let dateObj;

    // ✅ ถ้าเป็น timestamp (number)
    if (typeof timeInput === 'number') {
        dateObj = new Date(timeInput);
    }
    // ✅ ถ้าเป็น string
    else if (typeof timeInput === 'string') {
        // ถ้าเป็น "2026-02-11 20:00"
        if (timeInput.includes(' ')) {
            const parts = timeInput.split(' ');
            dateObj = new Date(parts[0] + 'T' + parts[1]);
        } else {
            // ถ้าเป็น "20:00:00"
            dateObj = new Date(`1970-01-01T${timeInput}`);
        }
    } else {
        return 'xx:xx น.';
    }

    if (isNaN(dateObj)) return 'xx:xx น.';

    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes} น.`;
}


// Get pickup address record for order_no (returns first match or null)
async function getPickupAddress(orderId) {
    try {
        const snap = await db.ref('pickup_addresses')
            .orderByChild('order_id')
            .equalTo(orderId)
            .once('value');
        const data = snap.val() || {};
        return Object.values(data)[0] || null;
    } catch (err) {
        console.error('❌ Error getting pickup address:', err);
        return null;
    }
}

// Robustly find logistic entries for a given payment id (tries string, int, and full scan)
async function getLogisticsByPayment(paymentId) {
    if (!paymentId) return {};
    try {
        // Try as-is
        let snap = await db.ref('logistic').orderByChild('payment_id').equalTo(paymentId).once('value');
        let data = snap.val() || {};
        if (Object.keys(data).length > 0) {
            console.log('🔎 getLogisticsByPayment: found (as-is)', Object.keys(data));
            return data;
        }

        // Try numeric
        const pidNum = parseInt(paymentId);
        if (!isNaN(pidNum)) {
            snap = await db.ref('logistic').orderByChild('payment_id').equalTo(pidNum).once('value');
            data = snap.val() || {};
            if (Object.keys(data).length > 0) {
                console.log('🔎 getLogisticsByPayment: found (numeric)', Object.keys(data));
                return data;
            }
        }

        // Fallback: full scan and filter
        const fullSnap = await db.ref('logistic').once('value');
        const full = fullSnap.val() || {};
        const filtered = {};
        Object.entries(full).forEach(([k, v]) => {
            if (!v) return;
            if (v.payment_id == paymentId || v.payment_id == pidNum) filtered[k] = v;
        });
        console.log('🔎 getLogisticsByPayment: full-scan found', Object.keys(filtered));
        return filtered;
    } catch (err) {
        console.error('❌ Error finding logistics by payment:', err);
        return {};
    }
}

// Check if a timeline step has been reached given the current order status
function isStepReached(timelineStep, currentStatus) {

    // Treat assigned as order_received for display
    if (currentStatus === 'assigned') {
        currentStatus = 'order_received';
    }

    const reached = STATUS_REACHED_MAP[timelineStep] || [];
    return reached.includes(currentStatus);
}

// setText helper
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// show/hide section
function showSection(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}
function hideSection(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

// ==================== Load Firebase Data ====================

async function loadFirebaseData(orderId) {
    console.log('🔄 Loading Firebase data for order:', orderId);

    try {

        // Step 1: Load payment for this order (and static reference data in parallel)
        const [paymentSnap, foodWasteSnap, bankSnap] = await Promise.all([
            db.ref('payment').orderByChild('order_id').equalTo(orderId).once('value'),
            db.ref('food_waste_types').once('value'),
            db.ref('bank_accounts').once('value')
        ]);

        // Build food_waste_types map
        foodWasteTypesMap = foodWasteSnap.val() || {};

        // Build bank_accounts map
        bankAccountsMap = bankSnap.val() || {};

        // Build payment map
        const paymentData = paymentSnap.val() || {};
        paymentsMap = {};
        let paymentId = null;
        Object.entries(paymentData).forEach(([key, payment]) => {
            if (payment && payment.order_id) {
                paymentsMap[String(payment.order_id)] = { ...payment, payment_id: key };
                paymentId = key;
            }
        });

        if (!paymentId) {
            console.warn('⚠️ No payment found for order:', orderId);
            return true; // Still continue - early status orders may not have payment yet
        }

        // Step 2: Load logistic and self_drop_off for this payment
        const logisticData = await getLogisticsByPayment(paymentId);
        logisticsMap = logisticData || {};
        const selfDropSnap = await db.ref('self_drop_off').orderByChild('payment_id').equalTo(paymentId).once('value');
        selfDropOffMap = selfDropSnap.val() || {};

        // Step 3: Load schedule + driver from logistic
        schedulesMap = {};
        driversMap = {};
        const logisticEntry = Object.values(logisticsMap).find(l => l && l.schedule_id);
        if (logisticEntry && logisticEntry.schedule_id) {
            const schedSnap = await db.ref(`driving_schedules/${logisticEntry.schedule_id}`).once('value');
            const sched = schedSnap.val();
            if (sched) {
                schedulesMap[logisticEntry.schedule_id] = sched;
                if (sched.delivery_id) {
                    const driverSnap = await db.ref(`delivery_emps/${sched.delivery_id}`).once('value');
                    if (driverSnap.exists()) {
                        driversMap[sched.delivery_id] = driverSnap.val();
                    }
                }
            }
        }

        // Step 4: Load inbound_food_waste
        // For pickup: inbound links from logistic_id
        // For dropoff: inbound links from drop_off_id
        inboundFoodWasteMap = {};
        const deliveryType = currentOrder ? currentOrder.delivery_type : null;

        if (deliveryType === 'pickup') {
            // Find logistic pk (inbound logistic entry for pickup has payment_id)
            const pickupLogistic = Object.entries(logisticsMap).find(([k, l]) =>
                l && l.payment_id == paymentId && l.schedule_id != null
            );
            if (pickupLogistic) {
                const logisticPk = pickupLogistic[0];
                const inboundSnap = await db.ref('inbound_food_waste')
                    .orderByChild('logistic_id')
                    .equalTo(parseInt(logisticPk))
                    .once('value');
                const inboundData = inboundSnap.val() || {};
                Object.assign(inboundFoodWasteMap, inboundData);
            }
        } else if (deliveryType === 'dropoff') {
            // Find self_drop_off pk
            const selfEntry = Object.entries(selfDropOffMap).find(([k, s]) =>
                s && s.payment_id == paymentId
            );
            if (selfEntry) {
                const selfDropPk = selfEntry[0];
                const inboundSnap = await db.ref('inbound_food_waste')
                    .orderByChild('drop_off_id')
                    .equalTo(parseInt(selfDropPk))
                    .once('value');
                const inboundData = inboundSnap.val() || {};
                Object.assign(inboundFoodWasteMap, inboundData);
            }
        }

        // Step 5: Load waiting_sort from inbound pk(s)
        waitingSortMap = {};
        const inboundPks = Object.keys(inboundFoodWasteMap);
        for (const inboundPk of inboundPks) {
            const wsSnap = await db.ref('waiting_sort')
                .orderByChild('inbound_id')
                .equalTo(parseInt(inboundPk))
                .once('value');
            const wsData = wsSnap.val() || {};
            Object.assign(waitingSortMap, wsData);
        }

        // Step 6: Load price_estimation from waiting_sort pk(s)
        priceEstimationMap = {};
        const sortPks = Object.keys(waitingSortMap);
        for (const sortPk of sortPks) {
            const peSnap = await db.ref('price_estimation')
                .orderByChild('sort_id')
                .equalTo(parseInt(sortPk))
                .once('value');
            const peData = peSnap.val() || {};
            Object.assign(priceEstimationMap, peData);
        }

        // Step 7: Load outbound_food_waste from price_estimation pk(s)
        outboundFoodWasteMap = {};
        const estimatePks = Object.keys(priceEstimationMap);
        for (const estimatePk of estimatePks) {
            const obSnap = await db.ref('outbound_food_waste')
                .orderByChild('estimate_id')
                .equalTo(parseInt(estimatePk))
                .once('value');
            const obData = obSnap.val() || {};
            Object.assign(outboundFoodWasteMap, obData);
        }

        // Step 8: Load seller_payouts
        sellerPayoutsMap = {};
        const spSnap = await db.ref('seller_payouts')
            .orderByChild('order_id')
            .equalTo(orderId)
            .once('value');

        sellerPayoutsMap = spSnap.val() || {};

        console.log('✅ Firebase chain loaded:', {
            payments: Object.keys(paymentsMap).length,
            logistics: Object.keys(logisticsMap).length,
            selfDropOffs: Object.keys(selfDropOffMap).length,
            inbound: Object.keys(inboundFoodWasteMap).length,
            waitingSort: Object.keys(waitingSortMap).length,
            priceEstimation: Object.keys(priceEstimationMap).length,
            outbound: Object.keys(outboundFoodWasteMap).length,
            sellerPayouts: Object.keys(sellerPayoutsMap).length,
        });

        return true;
    } catch (error) {
        console.error('❌ Error loading Firebase data:', error);
        return false;
    }
}

// ==================== Get Order ====================

async function getOrderFromFirebase(orderId) {
    try {
        const orderSnap = await db.ref(`order/${orderId}`).once('value');
        const order = orderSnap.val();
        if (order) {
            return {...order, order_id: orderId};
        }
        return null;
    } catch (error) {
        console.error('❌ Error fetching order:', error);
        return null;
    }
}

// ==================== Timeline Date/Time Logic ====================

async function getTimelineDateTime(orderId, timelineStep, deliveryType) {
    try {

        // ✅ 1. ใช้ status_history ก่อน (ดีที่สุด)
        if (currentOrder && currentOrder.status_history) {
            const ts = currentOrder.status_history[timelineStep];
            if (ts) {
                console.log(`✅ timeline[${timelineStep}] from status_history:`, ts);
                return {
                    date: formatDateToDDMMYYYY(ts),
                    time: formatTimeToHHMM(ts)
                };
            }
        }

        // ================================
        // ถ้าไม่มีใน status_history ค่อย fallback
        // ================================

        const payment = paymentsMap[String(orderId)];
        const paymentId = payment ? payment.payment_id : null;

        // --- order_received ---
        if (timelineStep === 'order_received') {
            if (currentOrder && currentOrder.order_at) {
                return {
                    date: formatDateToDDMMYYYY(currentOrder.order_at),
                    time: formatTimeToHHMM(currentOrder.order_at)
                };
            }
        }

                // --- picked_up ---
        if (timelineStep === 'picked_up') {

            // กรณี dropoff → ใช้ inbound_at
            if (deliveryType === 'dropoff') {

                const inbound = Object.values(inboundFoodWasteMap)
                    .find(i => i && i.inbound_at);

                if (inbound && inbound.inbound_at) {
                    return {
                        date: formatDateToDDMMYYYY(inbound.inbound_at),
                        time: formatTimeToHHMM(inbound.inbound_at)
                    };
                }
            }

            // กรณี pickup → ใช้ pickup_at จาก order
            if (currentOrder && currentOrder.pickup_at) {
                return {
                    date: formatDateToDDMMYYYY(currentOrder.pickup_at),
                    time: formatTimeToHHMM(currentOrder.pickup_at)
                };
            }
        }

        // --- inbound ---
        if (timelineStep === 'inbound') {

            const inbound = Object.values(inboundFoodWasteMap)
                .find(i => i && i.inbound_at);

            if (inbound && inbound.inbound_at) {
                return {
                    date: formatDateToDDMMYYYY(inbound.inbound_at),
                    time: formatTimeToHHMM(inbound.inbound_at)
                };
            }
        }

        // --- evaluated ---
        if (timelineStep === 'evaluated') {
            let pe = Object.values(priceEstimationMap).find(p => p && p.estimate_at);
            if (pe && pe.estimate_at) {
                return {
                    date: formatDateToDDMMYYYY(pe.estimate_at),
                    time: formatTimeToHHMM(pe.estimate_at)
                };
            }
        }

        // --- sold ---
        if (timelineStep === 'sold') {
            let ob = Object.values(outboundFoodWasteMap).find(o => o && o.delivered_at);
            if (ob && ob.delivered_at) {
                return {
                    date: formatDateToDDMMYYYY(ob.delivered_at),
                    time: formatTimeToHHMM(ob.delivered_at)
                };
            }
        }

        // --- paid ---
        if (timelineStep === 'paid') {

            // ถ้ามี complete ให้ใช้ complete แทน
            if (currentOrder?.status_history?.completed) {
                const ts = currentOrder.status_history.completed;
                return {
                    date: formatDateToDDMMYYYY(ts),
                    time: formatTimeToHHMM(ts)
                };
            }
        
            // fallback เผื่ออนาคตมี paid จริง ๆ
            if (currentOrder?.status_history?.paid) {
                const ts = currentOrder.status_history.paid;
                return {
                    date: formatDateToDDMMYYYY(ts),
                    time: formatTimeToHHMM(ts)
                };
            }
        }
        

    } catch (error) {
        console.error(`❌ Error getting datetime for ${timelineStep}:`, error);
    }

    return null;
}

// ==================== Populate Timeline ====================

async function populateOrderTimeline(order) {
    if (!order) return;

    const currentStatus = order.status || 'order_received';
    const deliveryType = order.delivery_type || 'pickup';
    const orderId = order.order_id;

    console.log('📊 Populating timeline. Status:', currentStatus, 'Type:', deliveryType);

    // Update label for picked_up step based on delivery_type
    const namePickedUp = document.getElementById('name_picked_up');
    if (namePickedUp) {
        namePickedUp.textContent = deliveryType === 'dropoff' ? 'นำส่งด้วยตนเอง' : 'รถมารับเศษอาหาร';
    }

    for (const step of TIMELINE_STEPS) {
        const circle = document.getElementById(`circle_${step}`);
        const dateElem = document.getElementById(`date_${step}`);
        const timeElem = document.getElementById(`time_${step}`);

        if (!circle || !dateElem || !timeElem) continue;

        const reached = isStepReached(step, currentStatus);

        if (reached) {
            const dt = await getTimelineDateTime(orderId, step, deliveryType);
            if (dt) {
                dateElem.textContent = dt.date;
                timeElem.textContent = dt.time;
            } else {
                dateElem.textContent = 'xx/xx/xxxx';
                timeElem.textContent = 'xx:xx น.';
            }
            circle.classList.add('completed');
        } else {
            dateElem.textContent = 'กำลังดำเนินการ';
            timeElem.textContent = '';
            circle.classList.remove('completed');
        }
    }

    console.log('✅ Timeline populated');
}

// ==================== Populate Order Details ====================

async function populateOrderDetails(order) {
    if (!order) return;

    const orderId = order.order_id;
    const currentStatus = order.status || 'order_received';
    const deliveryType = order.delivery_type || 'pickup';

    console.log('📝 Populating order details:', orderId);

    // --- Order ID ---
    const order_Id = order.display_id;
    setText('order_id_display', order_Id);

    // === SECTION: ข้อมูลการขาย (always shown once order_received) ===
    if (isStepReached('order_received', currentStatus)) {
        showSection('order_details_section');

        // ===== SELLER =====
        let sellerName = '-';
        let sellerPhone = '-';

        const sellerSnap = await db.ref(`sellers/${order.user_id}`).once('value');
        const seller = sellerSnap.val();

        if (seller) {
            sellerName = seller.fullname || '-';
            sellerPhone = seller.phone || '-';
        }

        const pickupSnap = await db.ref(`pickup_addresses/${orderId}`).once('value');
        const pickupData = pickupSnap.val();

        let address = '-';

        if (pickupData && pickupData.address) {
            const a = pickupData.address;

            address = [
                a.detail,
                a.road,
                a.subDistrict,
                a.district,
                a.province,
                a.postalCode
            ].filter(Boolean).join(' ');
        }

        // Food types from order_items
        let foodTypes = '-';
        const orderItemSnap = await db.ref('order_items')
            .orderByChild('order_id')
            .equalTo(orderId)
            .once('value');
        const orderItemData = orderItemSnap.val() || {};
        const items = Object.values(orderItemData).filter(Boolean);
        if (items.length > 0) {
            const categories = items.map(item => {
                const fw = foodWasteTypesMap[item.waste_id];
                return fw ? fw.category : '';
            }).filter(Boolean);
            foodTypes = categories.join(', ') || '-';
        }

        // Order datetime
        let orderDateTime = '-';
        if (order.order_at) {
            orderDateTime = `${formatDateToDDMMYYYY(order.order_at)} เวลา ${formatTimeToHHMM(order.order_at)}`;
        }

        setText('seller_name', sellerName);
        setText('seller_phone', sellerPhone);
        setText('seller_address', address);
        setText('food_types', foodTypes);
        setText('order_datetime', orderDateTime);
    } else {
        hideSection('order_details_section');
    }

    // === SECTION: ข้อมูลการขนส่ง ===
    if (isStepReached('order_received', currentStatus)) {
        showSection('shipping_section');

        // Driver info (always shown from order_received onward)
        await populateDriverInfo();

        // Shipping details - only filled in once picked_up is reached
        if (isStepReached('picked_up', currentStatus)) {
            await populateShippingDetails(orderId, deliveryType);
        } else {
            setText('pickup_datetime', '-');
            setText('distance', '-');
            setText('shipping_cost', '-');
        }
    } else {
        hideSection('shipping_section');
    }

    // === SECTION: ข้อมูลการประเมินราคา ===
    if (isStepReached('evaluated', currentStatus)) {
        showSection('estimation_section');
        await populateEstimationDetails();
    } else {
        hideSection('estimation_section');
    }

    // === SECTION: ข้อมูลการจ่ายเงิน ===
    if (isStepReached('paid', currentStatus)) {
        showSection('payout_section');
        await populatePayoutDetails(orderId);
    } else {
        hideSection('payout_section');
    }

    console.log('✅ Order details populated');
}

// ==================== Populate Driver Info ====================

async function populateDriverInfo() {

    if (!currentOrder) return;

    // ถ้าเป็น dropoff ไม่ต้องมีคนขับ
    if (currentOrder.delivery_type === 'dropoff') {
        setText('driver_name', '-');
        setText('driver_phone', '-');
        setText('driver_license', '-');
        return;
    }

    const driverId = currentOrder.driver_id;
    const carPlate = currentOrder.vehicle_id;

    // ถ้ายังไม่ได้ assign
    if (!driverId || !carPlate) {
        setText('driver_name', 'ยังไม่มีข้อมูล');
        setText('driver_phone', '-');
        setText('driver_license', '-');
        return;
    }

    // ===== ดึงข้อมูลคนขับ =====
    const driverSnap = await db.ref(`delivery_emps/${driverId}`).once("value");
    const driver = driverSnap.val();

    if (driver) {
        const fullName = `${driver.title || ''} ${driver.name || ''} ${driver.surname || ''}`.trim();

        setText('driver_name', fullName || '-');
        setText('driver_phone', driver.telephone || '-');
    } else {
        setText('driver_name', '-');
        setText('driver_phone', '-');
    }

    // ===== ดึงข้อมูลรถ =====
    const carSnap = await db.ref(`delivery_cars/${carPlate}`).once("value");
    const car = carSnap.val();

    if (car) {
        setText('driver_license', car.license_plate || carPlate);
    } else {
        setText('driver_license', carPlate);
    }
}

// ==================== Populate Shipping Details ====================

async function populateShippingDetails(orderId, deliveryType) {

    try {

        const orderSnap = await db.ref(`order/${orderId}`).once("value");

        if (!orderSnap.exists()) {
            setText('pickup_datetime', '-');
            setText('distance', '-');
            setText('shipping_cost', '-');
            return;
        }

        const order = orderSnap.val();

        // ===== PICKUP =====
        if (deliveryType === 'pickup') {

            // วันเวลารับของ
            if (order.pickup_at) {
                const dateStr =
                    `${formatDateToDDMMYYYY(order.pickup_at)} เวลา ${formatTimeToHHMM(order.pickup_at)}`;
                setText('pickup_datetime', dateStr);
            } else {
                setText('pickup_datetime', '-');
            }

            // ระยะทาง
            if (order.distance_km != null) {
                setText('distance', `${(order.distance_km).toFixed(2)} กม.`);
            } else {
                setText('distance', '-');
            }

            // ค่าขนส่ง
            if (order.shipping_fee != null) {
                setText(
                    'shipping_cost',
                    order.shipping_fee === 0
                        ? 'ฟรี'
                        : `${order.shipping_fee} บาท`
                );
            } else {
                setText('shipping_cost', '-');
            }

        }

        // ===== DROPOFF =====
        else if (deliveryType === 'dropoff') {

            if (order.pickup_at) {
                const dateStr =
                    `${formatDateToDDMMYYYY(order.pickup_at)} เวลา ${formatTimeToHHMM(order.pickup_at)} (drop-off)`;
                setText('pickup_datetime', dateStr);
            } else {
                setText('pickup_datetime', '-');
            }

            setText('distance', '-');
            setText('shipping_cost', 'ฟรี');
        }

    } catch (error) {
        console.error('❌ Error populating shipping details:', error);
    }
}

// ==================== Populate Estimation Details ====================

async function populateEstimationDetails() {
    try {

        if (!currentOrder || !currentOrder.order_id) {
            console.warn("❌ ไม่มี order_id");
            return;
        }

        const orderId = currentOrder.order_id;

        // ✅ ดึงตรง ๆ จาก order/{orderId}
        const snap = await db.ref("order/" + orderId).once("value");

        if (!snap.exists()) {
            setText('estimation_category', '-');
            setText('estimation_weight', '-');
            setText('estimation_price', '-');
            return;
        }

        const order = snap.val();
        const sorting = order.sorting;

        if (!sorting) {
            setText('estimation_category', '-');
            setText('estimation_weight', '-');
            setText('estimation_price', '-');
            return;
        }

        const category = sorting.label || "-";
        const weight = sorting.weight
            ? `${sorting.weight} กก.`
            : "-";
        const price = order.total_estimate
            ? `${Number(order.total_estimate).toFixed(2)} บาท`
            : "-";

        setText('estimation_category', category);
        setText('estimation_weight', weight);
        setText('estimation_price', price);

    } catch (err) {
        console.error("❌ estimation error:", err);
    }
}

// ==================== Populate Payout Details ====================

async function populatePayoutDetails(orderId) {
    try {

        if (!orderId) {
            console.warn("❌ ไม่มี orderId");
            return;
        }

        // 1️⃣ หา payout จาก order_id
        const payoutSnap = await db.ref("seller_payouts")
            .orderByChild("order_id")
            .equalTo(orderId)
            .once("value");

        if (!payoutSnap.exists()) {
            setText('payout_bank_account_number', '-');
            setText('payout_bank_name', '-');
            setText('payout_amount', '-');
            setText('payout_at', '-');
            return;
        }

        const payoutData = Object.values(payoutSnap.val())[0];

        // 2️⃣ ดึง seller_id
        const sellerId = payoutData.seller_id;

        if (!sellerId) {
            console.warn("❌ ไม่มี seller_id ใน payout");
            return;
        }

        // 3️⃣ หา bank account ของ seller
        const bankSnap = await db.ref("bank_accounts/" + sellerId).once("value");

        let bankData = null;

        if (bankSnap.exists()) {
            bankData = bankSnap.val();
        }

        // 4️⃣ แสดงข้อมูล
        setText(
            'payout_bank_account_number',
            bankData ? (bankData.account_number || '-') : '-'
        );

        setText(
            'payout_bank_name',
            bankData ? (bankData.account_name || '-') : '-'
        );

        setText(
            'payout_amount',
            payoutData.amount != null ? `${payoutData.amount} บาท` : '-'
        );

        if (payoutData.paid_at) {
            setText(
                'payout_at',
                `${formatDateToDDMMYYYY(payoutData.paid_at)} เวลา ${formatTimeToHHMM(payoutData.paid_at)}`
            );
        } else {
            setText('payout_at', '-');
        }

    } catch (error) {
        console.error('❌ Error populating payout details:', error);
    }
}

// ==================== Initialize Page ====================

async function initPage() {
    console.log('🚀 Initializing status details page...');

    try {
        const urlParams = new URLSearchParams(window.location.search);
        console.log('url', window.location.search)
        const orderId = urlParams.get('order_id') || urlParams.get('orderId');

        if (!orderId) {
            console.error('❌ No order_id in URL');
            alert('ไม่พบรหัสการขาย');
            window.location.href = 'status.html';
            return;
        }

        console.log('📦 Order number:', orderId);

        // Fetch the order first (we need delivery_type before loading chain)
        const order = await getOrderFromFirebase(orderId);
        if (!order) {
            console.error('❌ Order not found');
            alert('ไม่พบรายการขาย');
            window.location.href = 'status.html';
            return;
        }

        currentOrder = order;

        // Load all related data (delivery_type now known)
        const dataLoaded = await loadFirebaseData(orderId);
        if (!dataLoaded) {
            console.error('❌ Failed to load Firebase data');
            alert('ไม่สามารถโหลดข้อมูลได้');
            return;
        }

        // Populate timeline
        await populateOrderTimeline(order);

        // Populate details sections
        await populateOrderDetails(order);

        console.log('✅ Page initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing page:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
}

// ==================== Event Listeners ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing...');
    initPage();
});