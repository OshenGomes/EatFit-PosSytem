// routes/users.js
const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    createUser,
    inviteUser,
    updateUser,
    deleteUser,
    getRolesList
} = require('../controllers/userCtrl');

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with optional filters
 *     tags:
 *       - Users & Roles
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role (SUPER_ADMIN, ADMIN, KITCHEN, EMPLOYEE)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (ACTIVE, INVITED, INACTIVE)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */
router.get('/', getAllUsers);

/**
 * @swagger
 * /users/roles/list:
 *   get:
 *     summary: Get list of roles and permissions
 *     tags:
 *       - Users & Roles
 *     responses:
 *       200:
 *         description: Roles and permissions list
 */
router.get('/roles/list', getRolesList);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID or email
 *     tags:
 *       - Users & Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User object
 *       404:
 *         description: User not found
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (Super Admin only - rajithatw07102@gmail.com)
 *     tags:
 *       - Users & Roles
 *     parameters:
 *       - in: header
 *         name: x-user-email
 *         schema:
 *           type: string
 *         description: Requester email (Must be rajithatw07102@gmail.com)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: "newstaff@eat.fit.pos"
 *               name:
 *                 type: string
 *                 example: "Staff Member"
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, KITCHEN, EMPLOYEE]
 *                 example: "EMPLOYEE"
 *               phone:
 *                 type: string
 *                 example: "+94 77 123 4567"
 *               password:
 *                 type: string
 *                 example: "EatFit@2026"
 *     responses:
 *       201:
 *         description: User created successfully
 *       403:
 *         description: Forbidden - Only Super Admin can create users
 */
router.post('/', createUser);

/**
 * @swagger
 * /users/invite:
 *   post:
 *     summary: Invite a user with an invite token (Super Admin only - rajithatw07102@gmail.com)
 *     tags:
 *       - Users & Roles
 *     parameters:
 *       - in: header
 *         name: x-user-email
 *         schema:
 *           type: string
 *         description: Requester email (Must be rajithatw07102@gmail.com)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: "invited@eat.fit.pos"
 *               name:
 *                 type: string
 *                 example: "Invited Staff"
 *               role:
 *                 type: string
 *                 enum: [ADMIN, KITCHEN, EMPLOYEE]
 *                 example: "EMPLOYEE"
 *               phone:
 *                 type: string
 *                 example: "+94 77 999 8888"
 *     responses:
 *       200:
 *         description: Invitation created and link generated
 *       403:
 *         description: Forbidden - Only Super Admin can invite users
 */
router.post('/invite', inviteUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user details or role (Super Admin only)
 *     tags:
 *       - Users & Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-user-email
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, KITCHEN, EMPLOYEE]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INVITED, INACTIVE]
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Forbidden
 */
router.put('/:id', updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (Super Admin only)
 *     tags:
 *       - Users & Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-user-email
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Forbidden
 */
router.delete('/:id', deleteUser);

module.exports = router;
