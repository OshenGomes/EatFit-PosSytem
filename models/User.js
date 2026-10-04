// models/User.js
const mongoose = require('mongoose');
const getNextSequence = require('../utils/getNextSequence');

const UserSchema = new mongoose.Schema({
    _id: { type: Number },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    role: { 
        type: String, 
        required: true, 
        enum: ['SUPER_ADMIN', 'ADMIN', 'KITCHEN', 'EMPLOYEE'],
        default: 'EMPLOYEE'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INVITED', 'INACTIVE'],
        default: 'ACTIVE'
    },
    phone: { 
        type: String, 
        trim: true,
        default: ''
    },
    firebaseUid: { 
        type: String,
        default: null
    },
    invitedBy: { 
        type: String,
        default: null
    },
    inviteToken: { 
        type: String,
        default: null
    },
    inviteExpiresAt: { 
        type: Date,
        default: null
    },
    lastLoginAt: { 
        type: Date,
        default: null
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, { _id: false });

UserSchema.pre('save', async function (next) {
    if (this.isNew && !this._id) {
        this._id = await getNextSequence('userId');
    }
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('User', UserSchema);
