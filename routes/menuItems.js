const express = require('express');
const router = express.Router();
const {
    createMenuItem,
    getAllMenuItems,
    getMenuItemById,
    updateMenuItem,
    deleteMenuItem,
    upload,
    uploadImageOnly
} = require('../controllers/menuItemCtrl');

/**
 * @swagger
 * /menu-items:
 *   get:
 *     summary: Get all menu items
 *     tags:
 *       - Menu Items
 *     responses:
 *       200:
 *         description: A list of menu items
 */
router.get('/', getAllMenuItems);

/**
 * @swagger
 * /menu-items:
 *   post:
 *     summary: Create a new menu item
 *     tags:
 *       - Menu Items
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - webPrice
 *               - uberPrice
 *             properties:
 *               name:
 *                 type: string
 *               mainCategory:
 *                 type: string
 *               menuCategory:
 *                 type: string
 *               description:
 *                 type: string
 *               protein:
 *                  type: number
 *                  example: 10.00
 *               webPrice:
 *                 type: number
 *               uberPrice:
 *                 type: number
 *               halal:
 *                 type: boolean
 *               imageurl:
 *                 type: string
 *                 example: "https://res.cloudinary.com/demo/image/upload/v1710000000/item.jpg"
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ingredientId:
 *                       type: integer
 *                     quantityNeeded:
 *                       type: integer
 *               addons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ingredientId:
 *                       type: integer
 *                     quantityNeeded:
 *                       type: integer
 *                     price:
 *                       type: number
 *               nutrition:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     protein:
 *                       type: number
 *                     fat:
 *                       type: number
 *                     carbs:
 *                       type: number
 *                     sugar:
 *                       type: number
 *                     calories:
 *                       type: number
 *     responses:
 *       201:
 *         description: Menu item created
 */
router.post('/', createMenuItem);

/**
 * @swagger
 * /menu-items/upload:
 *   post:
 *     summary: Upload image only and return the Cloudinary URL
 *     tags:
 *       - Menu Items
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *       400:
 *         description: No image file provided
 *       500:
 *         description: Server error
 */
router.post('/upload',upload, uploadImageOnly);

/**
 * @swagger
 * /menu-items/{id}:
 *   get:
 *     summary: Get menu item by ID
 *     tags:
 *       - Menu Items
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: A single menu item
 */
router.get('/:id', getMenuItemById);

/**
 * @swagger
 * /menu-items/{id}:
 *   put:
 *     summary: Update menu item by ID
 *     tags:
 *       - Menu Items
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               mainCategory:
 *                 type: string
 *               menuCategory:
 *                 type: string
 *               description:
 *                 type: string
 *               webPrice:
 *                 type: number
 *               uberPrice:
 *                 type: number
 *               halal:
 *                 type: boolean
 *               imageurl:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ingredientId:
 *                       type: integer
 *                     quantityNeeded:
 *                       type: integer
 *               addons:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ingredientId:
 *                       type: integer
 *                     quantityNeeded:
 *                       type: integer
 *                     price:
 *                       type: number
 *               nutrition:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     protein:
 *                       type: number
 *                     fat:
 *                       type: number
 *                     carbs:
 *                       type: number
 *                     sugar:
 *                       type: number
 *                     calories:
 *                       type: number
 *     responses:
 *       200:
 *         description: Menu item updated
 */
router.put('/:id', updateMenuItem);

/**
 * @swagger
 * /menu-items/{id}:
 *   delete:
 *     summary: Delete menu item by ID
 *     tags:
 *       - Menu Items
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       204:
 *         description: Menu item deleted
 */
router.delete('/:id', deleteMenuItem);

module.exports = router;
