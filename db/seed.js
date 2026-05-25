/*
  db/seed.js
  Simple seeding script using the project's Mongoose models.
  Usage: set MONGODB_URI in .env then run: node db/seed.js
*/

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const path = require('path');
const fs = require('fs');
const Ingredient = require('../models/Ingredient');
const MenuItem = require('../models/MenuItem');
const Counter = require('../models/Counter');

const dataDir = __dirname;

function loadJson(fileName) {
  const full = path.join(dataDir, fileName);
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

const ingredients = loadJson('ingredients.json');
const menuItems = loadJson('menuItems.json');
const counters = loadJson('counters.json');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eatfit-possystem';
  console.log('Connecting to', uri);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  console.log('Updating menu items...');
  for (const menuItem of menuItems) {
    await MenuItem.updateOne(
      { _id: menuItem._id },
      { $set: menuItem },
      { upsert: true }
    );
  }

  console.log('Seeded menu items without clearing existing data');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});