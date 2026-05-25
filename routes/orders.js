// routes/orders.js
const express = require('express');
const router = express.Router();
const {
    placeOrder,
    getAllOrders,
    getPreparingOrders,
    updateOrderStatus
} = require('../controllers/orderCtrl');

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Place a new order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: CUSTOM-001
 *                 description: Required only for non-Uber/PickMe orders. For Uber or PickMe orders, this is auto-generated.
 *               customerName:
 *                 type: string
 *                 example: John Doe
 *               customerPhone:
 *                 type: string
 *                 example: 0771234567
 *               customerAddress:
 *                 type: string
 *                 example: address
 *               orderType:
 *                 type: string
 *                 example: Takeaway
 *                 description: One of "Uber Delivery", "Pick Me Delivery", "Pick Me Pickup", or other custom types
 *               orderStatus:
 *                 type: string
 *                 example: Pending
 *               totalPrice:
 *                 type: number
 *                 example: 19.99
 *               orderTime:
 *                 type: number
 *                 example: 1719055200000
 *               paymentMethod:
 *                 type: string
 *                 example: Cash
 *               bankTransferReference:
 *                 type: string
 *                 example: TXN123456789
 *                 description: Required if paymentMethod is "online bank transfer"
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuItemId:
 *                       type: integer
 *                       example: 101
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *                     selectedAddons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ingredientId:
 *                             type: integer
 *                             example: 3
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *     responses:
 *       201:
 *         description: Order placed
 */
router.post('/', placeOrder);


/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     responses:
 *       200:
 *         description: A list of all orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   orderId:
 *                     type: string
 *                     example: CUSTOM-001
 *                   customerName:
 *                     type: string
 *                     example: John Doe
 *                   customerPhone:
 *                     type: string
 *                     example: 0771234567
 *                   customerAddress:
 *                      type: string
 *                      example: address
 *                   orderType:
 *                     type: string
 *                     example: Takeaway
 *                   orderStatus:
 *                     type: string
 *                     example: Pending
 *                   totalPrice:
 *                     type: number
 *                     example: 19.99
 *                   orderTime:
 *                     type: number
 *                     example: 1719055200000
 *                   paymentMethod:
 *                     type: string
 *                     example: Cash
 *                   orderDate:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-06-22T15:30:00.000Z
 *                   items:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         menuItemId:
 *                           type: integer
 *                           example: 101
 *                         quantity:
 *                           type: integer
 *                           example: 2
 *                         selectedAddons:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               ingredientId:
 *                                 type: integer
 *                                 example: 3
 *                               quantity:
 *                                 type: integer
 *                                 example: 2
 */
router.get('/', getAllOrders);


/**
 * @swagger
 * /orders/preparing:
 *   get:
 *     summary: Get all orders with status "Preparing"
 *     responses:
 *       200:
 *         description: A list of preparing orders
 */
router.get('/preparing', getPreparingOrders);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update the status of an order
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 example: Completed
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
