// controllers/userCtrl.js
const crypto = require('crypto');
const User = require('../models/User');
const { admin, isConfigured } = require('../utils/firebaseAdmin');

const SUPER_ADMIN_EMAIL = 'rajithatw07102@gmail.com';

const PREDEFINED_USERS = [
    {
        email: 'rajithatw07102@gmail.com',
        name: 'Rajitha Dissanayaka (Super Admin)',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        phone: '+94 77 000 0001'
    },
    {
        email: 'thilina.samarainghe@prolabr.com',
        name: 'Thilina Samarasinghe (Prolab Admin)',
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: '+94 77 000 0002'
    },
    {
        email: 'sunethya.admin@eat.fit.pos',
        name: 'Sunethya (Admin)',
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: '+94 77 000 0003'
    },
    {
        email: 'prameesh.admin@eat.fit.pos',
        name: 'Prameesh (Admin)',
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: '+94 77 000 0004'
    },
    {
        email: 'admin@eat.fit.pos',
        name: 'EatFit General Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: '+94 77 000 0005'
    },
    {
        email: 'kitchen@eat.fit.pos',
        name: 'Kitchen Staff Terminal',
        role: 'KITCHEN',
        status: 'ACTIVE',
        phone: '+94 77 000 0006'
    },
    {
        email: 'user1@eat.fit.pos',
        name: 'User 1 (Employee)',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        phone: '+94 77 000 0007'
    },
    {
        email: 'nisansala.user@eat.fit.pos',
        name: 'Nisansala (Employee)',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        phone: '+94 77 000 0008'
    },
    {
        email: 'hasitha.user@eat.fit.pos',
        name: 'Hasitha (Employee)',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        phone: '+94 77 000 0009'
    }
];

// Helper to verify Super Admin
function isSuperAdminRequester(req) {
    const email = (
        req.headers['x-user-email'] ||
        req.headers['x-requester-email'] ||
        (req.body && req.body.requesterEmail) ||
        (req.query && req.query.requesterEmail) ||
        ''
    ).toLowerCase().trim();

    return email === SUPER_ADMIN_EMAIL.toLowerCase();
}

// Auto-seed initial users if they don't exist
async function seedInitialUsers() {
    try {
        console.log('🔄 Checking initial users and roles...');
        for (const u of PREDEFINED_USERS) {
            const exists = await User.findOne({ email: u.email.toLowerCase() });
            if (!exists) {
                const newUser = new User(u);
                await newUser.save();
                console.log(`  + Seeded user: ${u.email} [${u.role}]`);
            } else {
                // Ensure Super Admin retains SUPER_ADMIN role
                if (u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && exists.role !== 'SUPER_ADMIN') {
                    exists.role = 'SUPER_ADMIN';
                    await exists.save();
                }
            }
        }
        console.log('✅ Initial users and roles verified.');
    } catch (err) {
        console.error('❌ Error seeding initial users:', err.message);
    }
}

// 1. Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const { role, status, search } = req.query;
        const filter = {};

        if (role) filter.role = role.toUpperCase();
        if (status) filter.status = status.toUpperCase();
        if (search) {
            const s = new RegExp(search, 'i');
            filter.$or = [{ name: s }, { email: s }, { phone: s }];
        }

        const users = await User.find(filter).sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Get user by ID or email
exports.getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const isNumeric = /^\d+$/.test(id);
        const user = isNumeric
            ? await User.findById(Number(id))
            : await User.findOne({ email: id.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Create a user (Direct creation by Super Admin)
exports.createUser = async (req, res) => {
    try {
        if (!isSuperAdminRequester(req)) {
            return res.status(403).json({
                error: `Permission denied. Only Super Admin (${SUPER_ADMIN_EMAIL}) has authority to create users.`
            });
        }

        const { email, name, role, phone, password } = req.body;

        if (!email || !name || !role) {
            return res.status(400).json({ error: 'Email, name, and role are required.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ error: `User with email ${normalizedEmail} already exists.` });
        }

        let firebaseUid = null;
        let firebaseCreated = false;

        // Create in Firebase Auth if Admin SDK is configured and password is provided
        if (isConfigured() && password) {
            try {
                const fbUser = await admin.auth().createUser({
                    email: normalizedEmail,
                    password: password,
                    displayName: name,
                    emailVerified: true
                });
                firebaseUid = fbUser.uid;
                firebaseCreated = true;
            } catch (fbErr) {
                console.warn('Firebase user creation notice:', fbErr.message);
            }
        }

        const newUser = new User({
            email: normalizedEmail,
            name: name.trim(),
            role: role.toUpperCase(),
            phone: phone || '',
            firebaseUid: firebaseUid,
            status: 'ACTIVE',
            invitedBy: SUPER_ADMIN_EMAIL
        });

        await newUser.save();

        res.status(201).json({
            message: 'User created successfully.',
            user: newUser,
            firebaseSynced: firebaseCreated
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 4. Invite a user (Send invite token / invitation link by Super Admin)
exports.inviteUser = async (req, res) => {
    try {
        if (!isSuperAdminRequester(req)) {
            return res.status(403).json({
                error: `Permission denied. Only Super Admin (${SUPER_ADMIN_EMAIL}) has authority to invite users.`
            });
        }

        const { email, name, role, phone } = req.body;

        if (!email || !name || !role) {
            return res.status(400).json({ error: 'Email, name, and role are required for invite.' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing && existing.status === 'ACTIVE') {
            return res.status(409).json({ error: `User ${normalizedEmail} is already active.` });
        }

        const inviteToken = crypto.randomBytes(24).toString('hex');
        const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        let userRecord;
        if (existing) {
            existing.name = name.trim();
            existing.role = role.toUpperCase();
            existing.phone = phone || existing.phone;
            existing.status = 'INVITED';
            existing.inviteToken = inviteToken;
            existing.inviteExpiresAt = inviteExpiresAt;
            existing.invitedBy = SUPER_ADMIN_EMAIL;
            userRecord = await existing.save();
        } else {
            userRecord = new User({
                email: normalizedEmail,
                name: name.trim(),
                role: role.toUpperCase(),
                phone: phone || '',
                status: 'INVITED',
                inviteToken: inviteToken,
                inviteExpiresAt: inviteExpiresAt,
                invitedBy: SUPER_ADMIN_EMAIL
            });
            await userRecord.save();
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const inviteUrl = `${frontendUrl}/login?inviteToken=${inviteToken}&email=${encodeURIComponent(normalizedEmail)}`;

        res.status(200).json({
            message: `Invitation generated successfully for ${normalizedEmail}`,
            user: userRecord,
            inviteToken,
            inviteExpiresAt,
            inviteUrl
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 5. Update user
exports.updateUser = async (req, res) => {
    try {
        if (!isSuperAdminRequester(req)) {
            return res.status(403).json({
                error: `Permission denied. Only Super Admin (${SUPER_ADMIN_EMAIL}) has authority to update user roles and status.`
            });
        }

        const id = req.params.id;
        const isNumeric = /^\d+$/.test(id);
        const user = isNumeric
            ? await User.findById(Number(id))
            : await User.findOne({ email: id.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { name, role, phone, status } = req.body;

        // Prevent demoting Super Admin
        if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
            if (role && role.toUpperCase() !== 'SUPER_ADMIN') {
                return res.status(400).json({ error: 'Cannot demote the primary Super Admin account.' });
            }
        }

        if (name) user.name = name.trim();
        if (role) user.role = role.toUpperCase();
        if (phone !== undefined) user.phone = phone;
        if (status) user.status = status.toUpperCase();

        await user.save();

        res.status(200).json({
            message: 'User updated successfully',
            user
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 6. Delete user
exports.deleteUser = async (req, res) => {
    try {
        if (!isSuperAdminRequester(req)) {
            return res.status(403).json({
                error: `Permission denied. Only Super Admin (${SUPER_ADMIN_EMAIL}) has authority to delete users.`
            });
        }

        const id = req.params.id;
        const isNumeric = /^\d+$/.test(id);
        const user = isNumeric
            ? await User.findById(Number(id))
            : await User.findOne({ email: id.toLowerCase().trim() });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
            return res.status(400).json({ error: 'Cannot delete the primary Super Admin account.' });
        }

        await User.findByIdAndDelete(user._id);

        // Delete from Firebase if configured and uid present
        if (isConfigured() && user.firebaseUid) {
            try {
                await admin.auth().deleteUser(user.firebaseUid);
            } catch (fbErr) {
                console.warn('Firebase user deletion notice:', fbErr.message);
            }
        }

        res.status(200).json({ message: `User ${user.email} removed successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. Get roles and permissions metadata
exports.getRolesList = async (_req, res) => {
    res.status(200).json({
        superAdminEmail: SUPER_ADMIN_EMAIL,
        roles: [
            {
                id: 'SUPER_ADMIN',
                name: 'Super Admin',
                description: 'Full system control, can create and invite users, manage system roles and view all operations.',
                permissions: ['create_users', 'invite_users', 'manage_roles', 'view_dashboard', 'manage_inventory', 'manage_menu', 'manage_orders', 'kitchen_display']
            },
            {
                id: 'ADMIN',
                name: 'Admin',
                description: 'Operational administrator with access to dashboard, orders, inventory and menu items.',
                permissions: ['view_dashboard', 'manage_inventory', 'manage_menu', 'manage_orders', 'kitchen_display']
            },
            {
                id: 'KITCHEN',
                name: 'Kitchen Staff',
                description: 'Kitchen terminal view for tracking preparing orders and order statuses.',
                permissions: ['kitchen_display', 'update_order_status']
            },
            {
                id: 'EMPLOYEE',
                name: 'Employee',
                description: 'Staff member who takes customer orders, views inventory quantities and menus.',
                permissions: ['manage_orders', 'view_inventory', 'view_menu']
            }
        ]
    });
};

module.exports.seedInitialUsers = seedInitialUsers;
