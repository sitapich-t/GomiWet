// ==================== Global Variables ====================
let currentUserId = 'U4ea11ac1926aecf3fb62406f5f2759b6'; // TODO: แก้เป็น real user ID จาก auth
let ongoingOrders = []; // รายการที่กำลังดำเนินการ
let allShops = {};

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

// ==================== Format Date/Time ====================
function formatDate(dateValue) {
	if (!dateValue) return '-';

	// ถ้าเป็น number (timestamp)
	if (typeof dateValue === 'number') {
		const d = new Date(dateValue);
		const dd = String(d.getDate()).padStart(2, '0');
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const yy = String(d.getFullYear()).slice(-2);
		return `${dd}/${mm}/${yy}`;
	}

	// ถ้าเป็น string แบบเดิม
	if (typeof dateValue === 'string') {
		const parts = dateValue.split(' ')[0].split('-');
		if (parts.length === 3) {
			return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
		}
	}

	return '-';
}

function formatTime(dateValue) {
	if (!dateValue) return '-';

	if (typeof dateValue === 'number') {
		const d = new Date(dateValue);
		const h = String(d.getHours()).padStart(2, '0');
		const m = String(d.getMinutes()).padStart(2, '0');
		return `${h}:${m} น.`;
	}

	if (typeof dateValue === 'string') {
		const timePart = dateValue.split(' ')[1];
		if (timePart) {
			const [h, m] = timePart.split(':');
			return `${h}:${m} น.`;
		}
	}

	return '-';
}

// ==================== Create Order ID ====================
function createOrderId(orderNo, orderAt) {
	const dateStr = orderAt || '';
	let dateFormatted = '';
	if (dateStr) {
		const dateParts = dateStr.split(' ')[0].split('-');
		if (dateParts.length === 3) {
			dateFormatted = dateParts.join('');
		}
	}
	const orderKeyPadded = String(orderNo).padStart(4, '0');
	return dateFormatted ? `ORD${dateFormatted}-${orderKeyPadded}` : `ORD-${orderKeyPadded}`;
}

// ==================== Load Firebase Data ====================
async function loadFirebaseData() {
	console.log('🔄 Loading Firebase data for user:', currentUserId);

	try {
		// ✅ ใช้ orderByChild+equalTo ดึงเฉพาะ order ของ user คนนี้
		//    แทนการดึง order ทั้งหมดแล้วกรอง client-side
		const [orderSnap, shopsSnap] = await Promise.all([
			db.ref('order')
				.orderByChild('user_id')
				.equalTo(currentUserId)
				.once('value'),
			db.ref('shops').once('value')
		]);

		const orderData = orderSnap.val() || {};
		const shopsData = shopsSnap.val() || {};

		// กรองเฉพาะ status ไม่ใช่ completed (filter เล็กนี้ทำ client-side ได้เลย)
		ongoingOrders = Object.entries(orderData)
			.filter(([key, order]) => order && order.status !== 'completed')
			.map(([key, order]) => ({
				...order,
				order_id: key
			}));

		// Build shops map
		allShops = shopsData;

		console.log('✅ Data loaded:', {
			ongoingOrders: ongoingOrders.length,
			shops: Object.keys(allShops).length
		});

		return true;
	} catch (error) {
		console.error('❌ Error loading Firebase data:', error);
		return false;
	}
}

// ==================== Get Status Progress ====================
function getStatusProgress(status) {
	const statusOrder = [
		'order_received',
		'picked_up',
		'inbound',
		'sorted',
		'evaluated',
		'outbound',
		'sold'
	];

	const currentIndex = statusOrder.indexOf(status);
	const totalSteps = statusOrder.length;
	const progress = currentIndex >= 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;

	return {
		progress: Math.round(progress),
		currentStep: currentIndex + 1,
		totalSteps: totalSteps
	};
}

// ==================== Render Order Card ====================
function renderOrderCard(order) {
    const orderId = order.display_id;
	const shopName = allShops[order.shop_id] ? allShops[order.shop_id].shop_name : 'ร้านค้า';
	const date = formatDate(order.order_at);
	const time = formatTime(order.order_at);
	const statusText = STATUS_LABEL[order.status] || order.status;
	const deliveryType = order.delivery_type === 'pickup' ? 'รับที่หน้าบ้าน' : 'ส่งเอง';
	const bookedDate = formatDate(order.pickup_at);

	// คำนวณ progress
	const statusInfo = getStatusProgress(order.status);

	return `
        <div class="order-card" onclick="viewOrderDetails('${order.order_id}')">
            <div class="order-header">
                <h4>${shopName}</h4>
                <span class="order-id">${orderId}</span>
            </div>
            
            <div class="status-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${statusInfo.progress}%"></div>
                </div>
                <div class="status-text">
                    <span class="current-status">${statusText}</span>
                    <span class="progress-info">ขั้นที่ ${statusInfo.currentStep}/${statusInfo.totalSteps}</span>
                </div>
            </div>
            
            <div class="order-details">
                <p><strong>วันที่สั่ง:</strong> ${date} ${time}</p>
                <p><strong>กำหนดส่ง:</strong> ${bookedDate}</p>
                <p><strong>ประเภท:</strong> ${deliveryType}</p>
            </div>
            
            <button class="btn-view-details" onclick="event.stopPropagation(); viewOrderDetails(${order.order_id})">
                ดูรายละเอียด
            </button>
        </div>
    `;
}

// ==================== Display Orders ====================
function displayOrders() {
	const resultDiv = document.getElementById('trackResult');

	if (!resultDiv) {
		console.warn('trackResult element not found');
		return;
	}

	if (ongoingOrders.length === 0) {
		resultDiv.innerHTML = `
            <div class="no-orders">
                <div class="no-orders-icon">📦</div>
                <h3>ไม่มีรายการที่กำลังดำเนินการ</h3>
                <p>คุณไม่มีรายการขายที่กำลังดำเนินการในขณะนี้</p>
            </div>
        `;
		return;
	}

	// เรียงตาม order_at (ล่าสุดก่อน)
	const sortedOrders = [...ongoingOrders].sort((a, b) => {
		const dateA = new Date(a.order_at || 0);
		const dateB = new Date(b.order_at || 0);
		return dateB - dateA;
	});

	const ordersHTML = sortedOrders.map(order => renderOrderCard(order)).join('');

	resultDiv.innerHTML = `
        <div class="orders-list">
            <h3>รายการกำลังดำเนินการ (${ongoingOrders.length} รายการ)</h3>
            ${ordersHTML}
        </div>
    `;
}

// ==================== View Order Details ====================
window.viewOrderDetails = function (orderId) {
	console.log('📦 Viewing order details:', orderId);
	window.location.href = `status_details.html?order_id=${orderId}`;
};

// ==================== Initialize ====================
async function initStatusPage() {
	console.log('🚀 Initializing status page...');

	// โหลดข้อมูลจาก Firebase
	const loaded = await loadFirebaseData();

	if (!loaded) {
		console.error('❌ Failed to load data');
		const resultDiv = document.getElementById('trackResult');
		if (resultDiv) {
			resultDiv.innerHTML = `
                <div class="error-message">
                    <p>⚠️ ไม่สามารถโหลดข้อมูลได้</p>
                    <button onclick="location.reload()">ลองอีกครั้ง</button>
                </div>
            `;
		}
		return;
	}

	// แสดงรายการที่กำลังดำเนินการ
	displayOrders();

	console.log('✅ Status page initialized');
}

// ==================== Event Listeners ====================
document.addEventListener('DOMContentLoaded', () => {
	console.log('📄 DOM loaded, initializing status page...');
	initStatusPage();
});