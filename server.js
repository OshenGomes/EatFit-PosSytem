require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { seedInitialUsers } = require('./controllers/userCtrl');
const { initSocket } = require('./utils/socket');

// Init Express App & HTTP Server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middlewares
app.use(cors());
app.use(express.json());

// Swagger Setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'POS Inventory & User Management API',
            version: '1.0.0',
            description: 'API documentation for POS system with ingredient-based inventory, orders, user roles, and real-time WebSockets'
        },
        servers: [
            {
                url: 'https://eatfit-possytem-production.up.railway.app/api',
                description: 'Production'
            },
            {
                url: 'http://localhost:5000/api',
                description: 'Local development'
            }
        ]
    },
    apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(async () => {
        console.log('✅ MongoDB connected');
        await seedInitialUsers();
    })
    .catch(err => console.error('❌ MongoDB error:', err));

// Routes
const ingRouter = require('./routes/ingredients');
const miRouter = require('./routes/menuItems');
const ordRouter = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const userRouter = require('./routes/users');

app.use('/api/ingredients', ingRouter);
app.use('/api/menu-items', miRouter);
app.use('/api/orders', ordRouter);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRouter);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running with WebSockets at http://localhost:${PORT}`));
