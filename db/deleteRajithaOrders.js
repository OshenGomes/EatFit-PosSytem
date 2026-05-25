/*
  db/deleteRajithaOrders.js
  Script to delete all orders for customer "Rajitha"
*/

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Order = require('../models/Order');

async function deleteRajithaOrders() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatfit-possystem';
  console.log('Connecting to', uri);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  console.log('Deleting orders for customer "Rajitha"...');
  const result = await Order.deleteMany({ customerName: "Rajitha" });
  console.log(`Deleted ${result.deletedCount} orders for Rajitha`);

  await mongoose.disconnect();
}

deleteRajithaOrders().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});