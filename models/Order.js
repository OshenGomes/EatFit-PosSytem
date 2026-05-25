// models/Order.js
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    menuItemId: { type: Number, required: true },
    quantity: { type: Number, required: true },
    selectedAddons: {
        type: [
            {
                ingredientId: { type: Number, required: true },
                quantity: { type: Number, required: true }
            }
        ],
        default: []
    }
}, { _id: false });


const OrderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: false },
    customerAddress: { type: String, required: false },
    orderType: { type: String, required: true },
    orderStatus: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    totalPrice: { type: Number, required: true },
    orderTime: { type: Number, required: false },
    paymentMethod: { type: String, required: false },
    bankTransferReference: { type: String, required: false },
    orderDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
