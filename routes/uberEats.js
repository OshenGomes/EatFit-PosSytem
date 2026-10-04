// routes/uberEats.js
const express = require('express');
const router = express.Router();
const {
    handleWebhook,
    getIntegrationStatus,
    getUberOrders,
    createTestOrder,
    getStoreInfo,
    updateStoreStatus,
} = require('../controllers/uberEatsCtrl');

/**
 * @swagger
 * /uber-eats/webhook:
 *   post:
 *     summary: Uber Eats webhook receiver
 *     description: >
 *       Receives order notifications from Uber Eats (orders.notification,
 *       orders.cancel, store.status.changed). Must respond with 200 immediately.
 *       Configure this URL in the Uber Developer Portal.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_type:
 *                 type: string
 *                 example: orders.notification
 *               meta:
 *                 type: object
 *                 properties:
 *                   resource_id:
 *                     type: string
 *                     example: uber-order-uuid-here
 *     responses:
 *       200:
 *         description: Acknowledged
 */
router.post('/webhook', handleWebhook);

/**
 * @swagger
 * /uber-eats/status:
 *   get:
 *     summary: Get Uber Eats integration status
 *     description: Returns configuration health, environment, and webhook URL.
 *     responses:
 *       200:
 *         description: Integration status
 */
router.get('/status', getIntegrationStatus);

/**
 * @swagger
 * /uber-eats/orders:
 *   get:
 *     summary: Get all Uber Eats orders from local DB
 *     responses:
 *       200:
 *         description: List of Uber Delivery orders
 */
router.get('/orders', getUberOrders);

/**
 * @swagger
 * /uber-eats/test-order:
 *   post:
 *     summary: Create a simulated Uber order (sandbox only)
 *     responses:
 *       201:
 *         description: Test order created
 *       403:
 *         description: Not allowed in production
 */
router.post('/test-order', createTestOrder);

/**
 * @swagger
 * /uber-eats/store:
 *   get:
 *     summary: Get store information from Uber Eats API
 *     responses:
 *       200:
 *         description: Uber store info
 */
router.get('/store', getStoreInfo);

/**
 * @swagger
 * /uber-eats/store/status:
 *   patch:
 *     summary: Pause or unpause the store on Uber Eats
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paused:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Store status updated
 */
router.patch('/store/status', updateStoreStatus);

module.exports = router;
