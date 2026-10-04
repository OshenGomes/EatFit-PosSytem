// controllers/uberEatsCtrl.js
// Uber Eats Marketplace API Integration
// Docs: https://developer.uber.com/docs/eats
// Support: eats-partner-tech-support@uber.com

const crypto = require('crypto');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { emitOrderEvent } = require('../utils/socket');

// ---------------------------------------------------------------------------
// Token Cache (in-memory — swap for Redis in production)
// ---------------------------------------------------------------------------
let tokenCache = { access_token: null, expires_at: 0 };

async function getAccessToken() {
    const now = Date.now();
    if (tokenCache.access_token && tokenCache.expires_at > now + 60000) {
        return tokenCache.access_token;
    }
    const clientId = process.env.UBER_EATS_CLIENT_ID;
    const clientSecret = process.env.UBER_EATS_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error('Uber Eats credentials not configured. Set UBER_EATS_CLIENT_ID and UBER_EATS_CLIENT_SECRET.');
    }
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'eats.pos_provisioning eats.order eats.store eats.report',
    });
    const response = await fetch('https://login.uber.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });
    if (!response.ok) throw new Error('Uber token error: ' + await response.text());
    const data = await response.json();
    tokenCache = { access_token: data.access_token, expires_at: now + data.expires_in * 1000 };
    return tokenCache.access_token;
}

// ---------------------------------------------------------------------------
// Signature Verification
// ---------------------------------------------------------------------------
function verifyUberSignature(req) {
    const clientSecret = process.env.UBER_EATS_CLIENT_SECRET;
    if (!clientSecret) return false;
    const signature = req.headers['x-uber-signature'];
    if (!signature) return false;
    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', clientSecret).update(body).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'));
    } catch { return false; }
}

// ---------------------------------------------------------------------------
// Webhook Handler
// ---------------------------------------------------------------------------
exports.handleWebhook = async (req, res) => {
    res.status(200).json({ status: 'received' });
    const { event_type, meta } = req.body;
    const isSandbox = process.env.UBER_EATS_ENV !== 'production';
    if (!verifyUberSignature(req)) {
        if (!isSandbox) { console.warn('[UberEats] Invalid signature - rejected'); return; }
        console.warn('[UberEats] Invalid signature (sandbox - proceeding)');
    }
    console.log('[UberEats] Webhook:', event_type, meta);
    try {
        switch (event_type) {
            case 'orders.notification':
            case 'orders.scheduled_notification':
                await handleNewOrder(meta && meta.resource_id); break;
            case 'orders.cancel':
                await handleOrderCancellation(meta && meta.resource_id); break;
            case 'store.status.changed':
                emitOrderEvent('uber:storeStatus', meta); break;
            default:
                console.log('[UberEats] Unhandled event:', event_type);
        }
    } catch (err) { console.error('[UberEats] Webhook error:', err); }
};

// ---------------------------------------------------------------------------
// Order Handlers
// ---------------------------------------------------------------------------
async function handleNewOrder(uberOrderId) {
    if (!uberOrderId) return;
    try {
        const token = await getAccessToken();
        const orderRes = await fetch('https://api.uber.com/v1/eats/orders/' + uberOrderId, {
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        });
        if (!orderRes.ok) {
            console.error('[UberEats] Failed to fetch order:', await orderRes.text());
            await denyOrder(uberOrderId, token, 'OUT_OF_ITEMS'); return;
        }
        const uberOrder = await orderRes.json();
        const internalOrder = await mapUberOrderToInternal(uberOrder);
        const existing = await Order.findOne({ orderId: internalOrder.orderId });
        if (existing) { await acceptOrder(uberOrderId, token); return; }
        const order = new Order(internalOrder);
        await order.save();
        await acceptOrder(uberOrderId, token);
        emitOrderEvent('order:new', order);
        emitOrderEvent('order:preparing', order);
        emitOrderEvent('uber:newOrder', { uberOrderId, order });
        console.log('[UberEats] Order saved:', order.orderId);
    } catch (err) { console.error('[UberEats] handleNewOrder error:', err); }
}

async function handleOrderCancellation(uberOrderId) {
    if (!uberOrderId) return;
    try {
        const shortId = uberOrderId.slice(-6).toUpperCase();
        const order = await Order.findOneAndUpdate(
            { $or: [{ orderId: 'UBR-' + shortId }, { orderId: uberOrderId }] },
            { orderStatus: 'Cancelled' }, { new: true }
        );
        if (order) {
            emitOrderEvent('order:statusUpdated', order);
            emitOrderEvent('uber:orderCancelled', { uberOrderId, order });
        }
    } catch (err) { console.error('[UberEats] handleOrderCancellation error:', err); }
}

async function acceptOrder(uberOrderId, token) {
    try {
        const res = await fetch('https://api.uber.com/v1/eats/orders/' + uberOrderId + '/accept_pos_order', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Accepted by EatFit POS' }),
        });
        if (!res.ok) console.error('[UberEats] Accept failed:', await res.text());
    } catch (err) { console.error('[UberEats] acceptOrder error:', err); }
}

async function denyOrder(uberOrderId, token, reason) {
    try {
        const res = await fetch('https://api.uber.com/v1/eats/orders/' + uberOrderId + '/deny_pos_order', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason || 'OUT_OF_ITEMS' }),
        });
        if (!res.ok) console.error('[UberEats] Deny failed:', await res.text());
    } catch (err) { console.error('[UberEats] denyOrder error:', err); }
}

// ---------------------------------------------------------------------------
// Order Mapper: Uber format to internal POS format
// ---------------------------------------------------------------------------
async function mapUberOrderToInternal(uberOrder) {
    const uberItems = (uberOrder.cart && uberOrder.cart.items) || [];
    const items = [];
    for (const uberItem of uberItems) {
        const menuItem = await MenuItem.findOne({
            $or: [{ uberExternalId: uberItem.id }, { name: { $regex: new RegExp(uberItem.title, 'i') } }],
        });
        if (!menuItem) console.warn('[UberEats] Menu item not found:', uberItem.title);
        items.push({ menuItemId: menuItem ? menuItem._id : 0, quantity: uberItem.quantity || 1, selectedAddons: [] });
    }
    const shortId = (uberOrder.id || 'XXXXX').slice(-6).toUpperCase();
    const chargesTotal = uberOrder.payment && uberOrder.payment.charges && uberOrder.payment.charges.total;
    const total = chargesTotal ? chargesTotal.amount / 100 : 0;
    const eater = uberOrder.eater || {};
    const delivery = uberOrder.delivery || {};
    return {
        orderId: 'UBR-' + shortId,
        customerName: eater.first_name ? (eater.first_name + ' ' + (eater.last_name || '')).trim() : 'Uber Customer',
        customerPhone: eater.phone || '',
        customerAddress: (delivery.location && delivery.location.address) || 'Uber Delivery Address',
        orderType: 'Uber Delivery',
        orderStatus: 'Preparing',
        totalPrice: total,
        items,
        paymentMethod: 'Uber Pay',
        orderTime: new Date(uberOrder.placed_at || Date.now()).getTime(),
    };
}

// ---------------------------------------------------------------------------
// REST Endpoints
// ---------------------------------------------------------------------------
exports.getIntegrationStatus = (req, res) => {
    const clientId = process.env.UBER_EATS_CLIENT_ID;
    const clientSecret = process.env.UBER_EATS_CLIENT_SECRET;
    const storeId = process.env.UBER_EATS_STORE_ID;
    const env = process.env.UBER_EATS_ENV || 'sandbox';
    const apiBase = process.env.API_BASE_URL || 'https://eatfit-possytem-production.up.railway.app';
    res.json({
        configured: !!(clientId && clientSecret && storeId),
        environment: env,
        storeId: storeId || null,
        clientIdSet: !!clientId,
        clientSecretSet: !!clientSecret,
        webhookUrl: apiBase + '/api/uber-eats/webhook',
        tokenCached: !!(tokenCache.access_token && tokenCache.expires_at > Date.now()),
    });
};

exports.getUberOrders = async (req, res) => {
    try {
        const orders = await Order.find({ orderType: 'Uber Delivery' }).sort({ orderDate: -1 }).limit(100);
        res.json(orders);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createTestOrder = async (req, res) => {
    if (process.env.UBER_EATS_ENV === 'production') {
        return res.status(403).json({ error: 'Test orders not allowed in production' });
    }
    try {
        const menuItems = await MenuItem.find().limit(2);
        if (menuItems.length === 0) return res.status(400).json({ error: 'No menu items found' });
        const shortId = Math.random().toString(36).substr(2, 5).toUpperCase();
        const order = new Order({
            orderId: 'UBR-' + shortId,
            customerName: 'Test Uber Customer',
            customerPhone: '+94771234567',
            customerAddress: '123 Test Street, Colombo',
            orderType: 'Uber Delivery',
            orderStatus: 'Preparing',
            totalPrice: menuItems.reduce((sum, mi) => sum + (mi.price || 0), 0),
            items: menuItems.map(mi => ({ menuItemId: mi._id, quantity: 1, selectedAddons: [] })),
            paymentMethod: 'Uber Pay',
            orderTime: Date.now(),
        });
        await order.save();
        emitOrderEvent('order:new', order);
        emitOrderEvent('order:preparing', order);
        emitOrderEvent('uber:newOrder', { uberOrderId: shortId, order });
        res.status(201).json({ message: 'Test order created', order });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getStoreInfo = async (req, res) => {
    try {
        const token = await getAccessToken();
        const storeId = process.env.UBER_EATS_STORE_ID;
        if (!storeId) return res.status(400).json({ error: 'UBER_EATS_STORE_ID not configured' });
        const response = await fetch('https://api.uber.com/v1/eats/stores/' + storeId, {
            headers: { Authorization: 'Bearer ' + token },
        });
        res.json(await response.json());
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateStoreStatus = async (req, res) => {
    const { paused } = req.body;
    try {
        const token = await getAccessToken();
        const storeId = process.env.UBER_EATS_STORE_ID;
        if (!storeId) return res.status(400).json({ error: 'UBER_EATS_STORE_ID not configured' });
        const response = await fetch('https://api.uber.com/v1/eats/stores/' + storeId + '/status', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ paused_until: paused ? '9999-12-31T00:00:00Z' : null }),
        });
        res.json(await response.json());
    } catch (err) { res.status(500).json({ error: err.message }); }
};
