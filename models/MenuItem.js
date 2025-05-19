// models/MenuItem.js
const mongoose = require('mongoose');
const getNextSequence = require('../utils/getNextSequence');

const MenuItemIngredientSchema = new mongoose.Schema({
    ingredientId: { type: Number, required: true },
    quantityNeeded: { type: Number, required: true }
}, { _id: false });

const AddonSchema = new mongoose.Schema({
    _id: { type: Number },
    ingredientId: { type: Number, required: true },
    quantityNeeded: { type: Number, required: true },
    price: { type: Number, default: 0 }
}, { _id: false });

const MenuItemSchema = new mongoose.Schema({
    _id: { type: Number },
    name: { type: String, required: true },
    mainCategory: { type: String, required: true },
    menuCategory: { type: String, required: true },
    description: { type: String },
    protein: { type: Number, required: true },
    webPrice: { type: Number, required: true },
    uberPrice: { type: Number, required: true },
    inHousePrice: { type: Number, required: true },
    ingredients: { type: [MenuItemIngredientSchema], default: [] },
    addons: { type: [AddonSchema], default: [] }
}, { _id: false });

MenuItemSchema.pre('save', async function(next) {
    if (this.isNew) {
        this._id = await getNextSequence('menuItemId');
        for (const addon of this.addons) {
            addon._id = await getNextSequence('addonId');
        }
    }
    next();
});

module.exports = mongoose.model('MenuItem', MenuItemSchema);