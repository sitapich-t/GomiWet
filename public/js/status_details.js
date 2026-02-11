// ==================== Status Labels ====================
const STATUS_LABEL = {
	'order_received': 'ได้รับคำสั่งซื้อ',
	'picked_up': 'กำลังส่งไปโกดัง',
	'inbound': 'ถึงโกดังและคัดแยก',
	'sorted': 'คัดแยกเสร็จสิ้น',
	'evaluated': 'ประเมินราคา',
	'outbound': 'กำลังขาย',
	'sold': 'ขายให้ผู้ซื้อ',
	'completed': 'จ่ายเงินเสร็จสิ้น'
};

// Status order for determining which statuses are "reached"
// Each entry = the timeline step, and which DB statuses count as having completed it
const TIMELINE_STEPS = ['order_received', 'picked_up', 'inbound', 'evaluated', 'sold', 'paid'];

// Map: timeline step -> which order statuses count as "reached or passed" this step
const STATUS_REACHED_MAP = {
    order_received: ['order_received', 'picked_up', 'inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
    picked_up:      ['picked_up', 'inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
    inbound:        ['inbound', 'sorted', 'evaluated', 'outbound', 'sold', 'paid', 'completed'],
    evaluated:      ['evaluated', 'outbound', 'sold', 'paid', 'completed'],
    sold:           ['sold', 'paid', 'completed'],
    paid:           ['paid', 'completed']
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

        // Step 8: Load seller_payouts from outbound pk(s)
        sellerPayoutsMap = {};
        const outboundPks = Object.keys(outboundFoodWasteMap);
        for (const outboundPk of outboundPks) {
            const spSnap = await db.ref('seller_payouts')
                .orderByChild('outbound_id')
                .equalTo(parseInt(outboundPk))
                .once('value');
            const spData = spSnap.val() || {};
            Object.assign(sellerPayoutsMap, spData);
        }

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
    const payment = paymentsMap[String(orderId)];
    const paymentId = payment ? payment.payment_id : null;

    try {
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
        else if (timelineStep === 'picked_up') {
            if (deliveryType === 'pickup') {
                // From logistic.pickup_at
                let logistic = Object.values(logisticsMap).find(l =>
                    l && l.payment_id == paymentId && l.schedule_id != null
                );
                // fallback: query logistic by payment_id
                if ((!logistic || !logistic.pickup_at) && paymentId) {
                    const lgData = await getLogisticsByPayment(paymentId);
                    logistic = Object.values(lgData).find(l => l && l.pickup_at) || logistic;
                }
                if (logistic && logistic.pickup_at) {
                    console.log('✅ timeline[picked_up] from logistic:', logistic.pickup_at);
                    return {
                        date: formatDateToDDMMYYYY(logistic.pickup_at),
                        time: formatTimeToHHMM(logistic.pickup_at)
                    };
                }
            } else if (deliveryType === 'dropoff') {
                // From inbound_food_waste.inbound_at (drop-off route)
                const inbound = Object.values(inboundFoodWasteMap)[0];
                if (inbound && inbound.inbound_at) {
                    return {
                        date: formatDateToDDMMYYYY(inbound.inbound_at),
                        time: formatTimeToHHMM(inbound.inbound_at)
                    };
                }
            }
        }

        // --- inbound ---
        else if (timelineStep === 'inbound') {
            if (deliveryType === 'pickup') {
                // From logistic.delivered_at
                let logistic = Object.values(logisticsMap).find(l =>
                    l && l.payment_id == paymentId && l.schedule_id != null
                );
                if ((!logistic || !logistic.delivered_at) && paymentId) {
                    const lgData = await getLogisticsByPayment(paymentId);
                    logistic = Object.values(lgData).find(l => l && l.delivered_at) || logistic;
                }
                if (logistic && logistic.delivered_at) {
                    console.log('✅ timeline[inbound] from logistic:', logistic.delivered_at);
                    return {
                        date: formatDateToDDMMYYYY(logistic.delivered_at),
                        time: formatTimeToHHMM(logistic.delivered_at)
                    };
                }
            } else if (deliveryType === 'dropoff') {
                // From inbound_food_waste.inbound_at
                const inbound = Object.values(inboundFoodWasteMap)[0];
                if (inbound && inbound.inbound_at) {
                    return {
                        date: formatDateToDDMMYYYY(inbound.inbound_at),
                        time: formatTimeToHHMM(inbound.inbound_at)
                    };
                }
            }
        }

        // --- evaluated ---
        else if (timelineStep === 'evaluated') {
            let pe = Object.values(priceEstimationMap).find(p => p && p.estimate_at);
            // fallback: try to query price_estimation chain from payment -> inbound -> waiting_sort -> price_estimation
            if (!pe && paymentId) {
                // attempt: find logistic by paymentId
                const lgData = await getLogisticsByPayment(paymentId);
                const logisticPk = Object.keys(lgData)[0];
                if (logisticPk) {
                    console.log('🔎 evaluated fallback logisticPk:', logisticPk);
                    const inboundSnap = await db.ref('inbound_food_waste').orderByChild('logistic_id').equalTo(parseInt(logisticPk)).once('value');
                    const inboundData = inboundSnap.val() || {};
                    const inboundPk = Object.keys(inboundData)[0];
                    if (inboundPk) {
                        const wsSnap = await db.ref('waiting_sort').orderByChild('inbound_id').equalTo(parseInt(inboundPk)).once('value');
                        const wsData = wsSnap.val() || {};
                        const sortPk = Object.keys(wsData)[0];
                        if (sortPk) {
                            const peSnap = await db.ref('price_estimation').orderByChild('sort_id').equalTo(parseInt(sortPk)).once('value');
                            const peData = peSnap.val() || {};
                            pe = Object.values(peData)[0] || pe;
                        }
                    }
                }
            }
            if (pe && pe.estimate_at) {
                console.log('✅ timeline[evaluated] from price_estimation:', pe.estimate_at);
                return {
                    date: formatDateToDDMMYYYY(pe.estimate_at),
                    time: formatTimeToHHMM(pe.estimate_at)
                };
            }
        }

        // --- sold ---
        else if (timelineStep === 'sold') {
            let ob = Object.values(outboundFoodWasteMap).find(o => o && o.delivered_at);
            if (!ob && paymentId) {
                // try to walk chain: payment -> logistic -> inbound -> waiting_sort -> price_estimation -> outbound
                const lgData = await getLogisticsByPayment(paymentId);
                const logisticPk = Object.keys(lgData)[0];
                    if (logisticPk) {
                        console.log('🔎 sold fallback logisticPk:', logisticPk);
                    const inboundSnap = await db.ref('inbound_food_waste').orderByChild('logistic_id').equalTo(parseInt(logisticPk)).once('value');
                    const inboundData = inboundSnap.val() || {};
                    const inboundPk = Object.keys(inboundData)[0];
                    if (inboundPk) {
                        const wsSnap = await db.ref('waiting_sort').orderByChild('inbound_id').equalTo(parseInt(inboundPk)).once('value');
                        const wsData = wsSnap.val() || {};
                        const sortPk = Object.keys(wsData)[0];
                        if (sortPk) {
                            const peSnap = await db.ref('price_estimation').orderByChild('sort_id').equalTo(parseInt(sortPk)).once('value');
                            const peData = peSnap.val() || {};
                            const pePk = Object.keys(peData)[0];
                            if (pePk) {
                                const obSnap = await db.ref('outbound_food_waste').orderByChild('estimate_id').equalTo(parseInt(pePk)).once('value');
                                const obData = obSnap.val() || {};
                                ob = Object.values(obData)[0] || ob;
                            }
                        }
                    }
                }
            }
            if (ob) {
                console.log('✅ timeline[sold] from outbound:', ob.delivered_at);
                return {
                    date: formatDateToDDMMYYYY(ob.delivered_at),
                    time: formatTimeToHHMM(ob.delivered_at)
                };
            }
        }

        // --- paid ---
        else if (timelineStep === 'paid') {
            let sp = Object.values(sellerPayoutsMap).find(s => s && s.payout_at);
            if (!sp && paymentId) {
                // Walk chain to seller_payouts via outbound
                const lgData = await getLogisticsByPayment(paymentId);
                const logisticPk = Object.keys(lgData)[0];
                    if (logisticPk) {
                        console.log('🔎 paid fallback logisticPk:', logisticPk);
                    const inboundSnap = await db.ref('inbound_food_waste').orderByChild('logistic_id').equalTo(parseInt(logisticPk)).once('value');
                    const inboundData = inboundSnap.val() || {};
                    const inboundPk = Object.keys(inboundData)[0];
                    if (inboundPk) {
                        const wsSnap = await db.ref('waiting_sort').orderByChild('inbound_id').equalTo(parseInt(inboundPk)).once('value');
                        const wsData = wsSnap.val() || {};
                        const sortPk = Object.keys(wsData)[0];
                        if (sortPk) {
                            const peSnap = await db.ref('price_estimation').orderByChild('sort_id').equalTo(parseInt(sortPk)).once('value');
                            const peData = peSnap.val() || {};
                            const pePk = Object.keys(peData)[0];
                            if (pePk) {
                                const obSnap = await db.ref('outbound_food_waste').orderByChild('estimate_id').equalTo(parseInt(pePk)).once('value');
                                const obData = obSnap.val() || {};
                                const obPk = Object.keys(obData)[0];
                                if (obPk) {
                                    const spSnap = await db.ref('seller_payouts').orderByChild('outbound_id').equalTo(parseInt(obPk)).once('value');
                                    const spData = spSnap.val() || {};
                                    sp = Object.values(spData)[0] || sp;
                                }
                            }
                        }
                    }
                }
            }
            if (sp) {
                console.log('✅ timeline[paid] from seller_payouts:', sp.payout_at);
                return {
                    date: formatDateToDDMMYYYY(sp.payout_at),
                    time: formatTimeToHHMM(sp.payout_at)
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

        // Seller info
        let sellerName = '-';
        let sellerPhone = '-';
        let address = '-';

        if (order.user_id) {
            const userSnap = await db.ref(`users/${order.user_id}`).once('value');
            const user = userSnap.val();
            if (user) {
                sellerName = `${user.name || ''} ${user.surname || ''}`.trim() || '-';
                sellerPhone = user.telephone || '-';
            }
        }

        // If users table didn't provide name/phone, try sellers table as fallback
        if ((sellerName === '-' || sellerPhone === '-') && order.user_id) {
            const sellerSnap = await db.ref('sellers').orderByChild('user_id').equalTo(order.user_id).once('value');
            const sellerData = sellerSnap.val() || {};
            const seller = Object.values(sellerData)[0];
            if (seller) {
                if (sellerName === '-' && seller.fullname) {
                    sellerName = `${seller.fullname || ''} ${seller.surname || ''}`.trim() || sellerName;
                }
                if (sellerPhone === '-' && seller.telephone) {
                    sellerPhone = seller.telephone;
                }
                // Also use seller.address as fallback for address
                if ((!address || address === '-') && seller.address) {
                    const a = seller.address;
                    address = [a.address_detail, a.sub_district, a.district, a.province, a.postal_code].filter(Boolean).join(' ');
                }
            }
        }

        // Pickup address (deduped helper)
        const pickupAddr = await getPickupAddress(orderId);
        if (pickupAddr) {
            address = [
                pickupAddr.address,
                pickupAddr.sub_district,
                pickupAddr.district,
                pickupAddr.province,
                pickupAddr.postal_code
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
        await populatePayoutDetails();
    } else {
        hideSection('payout_section');
    }

    console.log('✅ Order details populated');
}

// ==================== Populate Driver Info ====================

async function populateDriverInfo() {
    // For dropoff orders there is no driver, show placeholders
    const deliveryType = currentOrder ? currentOrder.delivery_type : 'pickup';

    if (deliveryType === 'dropoff') {
        setText('driver_name', '-');
        setText('driver_phone', '-');
        setText('driver_license', '-');
        return;
    }

    const payment = paymentsMap[String(currentOrder.order_id)];
    if (!payment) {
        setText('driver_name', 'ยังไม่มีข้อมูล');
        setText('driver_phone', '-');
        setText('driver_license', '-');
        return;
    }

    const logistic = Object.values(logisticsMap).find(l =>
        l && l.payment_id == payment.payment_id && l.schedule_id != null
    );
    if (!logistic || !logistic.schedule_id) {
        setText('driver_name', 'ยังไม่มีข้อมูล');
        setText('driver_phone', '-');
        setText('driver_license', '-');
        return;
    }

    const schedule = schedulesMap[logistic.schedule_id];
    if (!schedule || !schedule.delivery_id) {
        setText('driver_name', 'ยังไม่มีข้อมูล');
        setText('driver_phone', '-');
        setText('driver_license', '-');
        return;
    }

    const driver = driversMap[schedule.delivery_id];
    if (driver) {
        const driverName = `${driver.title || ''} ${driver.name || ''} ${driver.surname || ''}`.trim() || 'ยังไม่มีข้อมูล';
        setText('driver_name', driverName);
        setText('driver_phone', driver.telephone || '-');
        setText('driver_license', schedule.license_plate || '-');
    } else {
        setText('driver_name', 'ยังไม่มีข้อมูล');
        setText('driver_phone', '-');
        setText('driver_license', '-');
    }
}

// ==================== Populate Shipping Details ====================

async function populateShippingDetails(orderId, deliveryType) {
    try {
        const payment = paymentsMap[String(orderId)];
        if (!payment) {
            setText('pickup_datetime', '-');
            setText('distance', '-');
            setText('shipping_cost', '-');
            return;
        }

        if (deliveryType === 'pickup') {
            // pickup_datetime from logistic.pickup_at
            const logistic = Object.values(logisticsMap).find(l =>
                l && l.payment_id == payment.payment_id && l.schedule_id != null
            );
            if (logistic && logistic.pickup_at) {
                const dateStr = `${formatDateToDDMMYYYY(logistic.pickup_at)} เวลา ${formatTimeToHHMM(logistic.pickup_at)}`;
                setText('pickup_datetime', dateStr);
            } else {
                setText('pickup_datetime', '-');
            }

            // Distance from pickup_addresses (use helper)
            const pickupAddr = await getPickupAddress(orderId);
            if (pickupAddr && pickupAddr.distance != null) {
                setText('distance', `${pickupAddr.distance} กม.`);

                // Shipping cost from pickup_rate via rate_id
                if (pickupAddr.rate_id) {
                    const rateSnap = await db.ref(`pickup_rate/${pickupAddr.rate_id}`).once('value');
                    const rate = rateSnap.val();
                    if (rate && rate.price != null) {
                        setText('shipping_cost', rate.price === 0 ? 'ฟรี' : `${rate.price} บาท`);
                    } else {
                        setText('shipping_cost', '-');
                    }
                } else {
                    setText('shipping_cost', '-');
                }
            } else {
                setText('distance', '-');
                setText('shipping_cost', '-');
            }

        } else if (deliveryType === 'dropoff') {
            // pickup_datetime from inbound_food_waste.inbound_at (drop-off label)
            const inbound = Object.values(inboundFoodWasteMap)[0];
            if (inbound && inbound.inbound_at) {
                const dateStr = `${formatDateToDDMMYYYY(inbound.inbound_at)} เวลา ${formatTimeToHHMM(inbound.inbound_at)} (drop-off)`;
                setText('pickup_datetime', dateStr);
            } else {
                setText('pickup_datetime', '-');
            }
            setText('distance', '-');
            setText('shipping_cost', '-');
        }

    } catch (error) {
        console.error('❌ Error populating shipping details:', error);
    }
}

// ==================== Populate Estimation Details ====================

async function populateEstimationDetails() {
    try {
        // Get first completed price_estimation
        const pe = Object.entries(priceEstimationMap).find(([k, v]) => v && v.sort_id);
        if (!pe) {
            setText('estimation_category', '-');
            setText('estimation_weight', '-');
            setText('estimation_price', '-');
            return;
        }

        const [estimatePk, peData] = pe;

        // Get corresponding waiting_sort entry
        const ws = Object.values(waitingSortMap).find(w => w && w.inbound_id != null);

        // The waiting_sort pk is sort_id in price_estimation
        const sortId = peData.sort_id;
        const wsEntry = waitingSortMap[String(sortId)];

        if (!wsEntry) {
            setText('estimation_category', '-');
            setText('estimation_weight', '-');
            setText('estimation_price', '-');
            return;
        }

        // Get food_waste category from waste_id
        const fw = foodWasteTypesMap[String(wsEntry.waste_id)];
        const category = fw ? fw.category : '-';
        const weight = wsEntry.weight != null ? `${wsEntry.weight} กก.` : '-';
        const price = (fw && fw.price != null && wsEntry.weight != null)
            ? `${(fw.price * wsEntry.weight).toFixed(2)} บาท`
            : '-';

        setText('estimation_category', category);
        setText('estimation_weight', weight);
        setText('estimation_price', price);

    } catch (error) {
        console.error('❌ Error populating estimation details:', error);
    }
}

// ==================== Populate Payout Details ====================

async function populatePayoutDetails() {
    try {
        const sp = Object.values(sellerPayoutsMap)[0];
        if (!sp) {
            setText('payout_bank_account_number', '-');
            setText('payout_bank_name', '-');
            setText('payout_amount', '-');
            setText('payout_at', '-');
            return;
        }

        // Bank account info
        const bank = sp.bank_id ? bankAccountsMap[String(sp.bank_id)] : null;
        setText('payout_bank_account_number', bank ? (bank.bank_account_number || '-') : '-');
        setText('payout_bank_name', bank ? (bank.bank_name || '-') : '-');
        setText('payout_amount', sp.amount != null ? `${sp.amount} บาท` : '-');

        if (sp.payout_at) {
            setText('payout_at', `${formatDateToDDMMYYYY(sp.payout_at)} เวลา ${formatTimeToHHMM(sp.payout_at)}`);
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
        const orderId = urlParams.get('order_id');

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