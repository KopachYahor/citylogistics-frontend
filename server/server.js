require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();

// ============================================
// ПОДКЛЮЧЕНИЕ К MONGODB
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/citylogistics';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Подключено к MongoDB'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

// ============================================
// MONGODB СХЕМЫ
// ============================================

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickupAddress: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    recipientPhone: String,
    deliveryDate: String,
    deliveryTime: String,
    cargoType: String,
    weight: String,
    places: String,
    conditions: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

// ============================================
// CORS
// ============================================

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

app.use(express.json());

// ============================================
// MIDDLEWARE
// ============================================

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Токен не предоставлен' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(403).json({ success: false, message: 'Пользователь не найден' });
        }
        
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Неверный токен' });
    }
};

// ============================================
// МАРШРУТЫ
// ============================================

// Проверка сервера
app.get('/api/health', async (req, res) => {
    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();
    
    res.json({ 
        success: true,
        message: 'Сервер работает!',
        time: new Date(),
        stats: { users: userCount, orders: orderCount }
    });
});

// Регистрация
app.post('/api/register', async (req, res) => {
    console.log('📝 Регистрация:', req.body);
    
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Заполните все поля'
        });
    }
    
    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Пароль должен быть минимум 6 символов'
        });
    }
    
    try {
        // Проверяем, существует ли пользователь
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь уже существует'
            });
        }
        
        // Хешируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Создаем пользователя
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });
        
        // Создаем токен
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '7d' }
        );
        
        console.log('✅ Пользователь создан:', newUser.email);
        
        res.json({
            success: true,
            message: 'Регистрация успешна',
            data: {
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email
                },
                token
            }
        });
    } catch (err) {
        console.error('❌ Ошибка регистрации:', err);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// Вход
app.post('/api/login', async (req, res) => {
    console.log('📝 Вход:', req.body);
    
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }
        
        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }
        
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '7d' }
        );
        
        console.log('✅ Успешный вход:', user.email);
        
        res.json({
            success: true,
            message: 'Вход выполнен',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                },
                token
            }
        });
    } catch (err) {
        console.error('❌ Ошибка входа:', err);
        res.status(500).json({
            success: false,
            message: 'Ошибка сервера'
        });
    }
});

// Получить данные пользователя
app.get('/api/user', authenticateToken, async (req, res) => {
    res.json({
        success: true,
        data: { user: req.user }
    });
});

// Получить все заказы пользователя
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const userOrders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: { orders: userOrders }
        });
    } catch (err) {
        console.error('❌ Ошибка получения заказов:', err);
        res.status(500).json({
            success: false,
            message: 'Ошибка получения заказов'
        });
    }
});

// Создать новый заказ
app.post('/api/orders', authenticateToken, async (req, res) => {
    console.log('📝 Создание заказа:', req.body);
    
    const { pickupAddress, deliveryAddress, recipientPhone, deliveryDate, deliveryTime, cargoType, weight, places, conditions } = req.body;
    
    if (!pickupAddress || !deliveryAddress) {
        return res.status(400).json({
            success: false,
            message: 'Укажите адреса отправления и доставки'
        });
    }
    
    try {
        const newOrder = await Order.create({
            userId: req.user._id,
            pickupAddress,
            deliveryAddress,
            recipientPhone,
            deliveryDate,
            deliveryTime,
            cargoType,
            weight,
            places,
            conditions,
            status: 'pending'
        });
        
        console.log('✅ Заказ создан:', newOrder._id);
        
        res.json({
            success: true,
            message: 'Заказ создан',
            data: { order: newOrder }
        });
    } catch (err) {
        console.error('❌ Ошибка создания заказа:', err);
        res.status(500).json({
            success: false,
            message: 'Ошибка создания заказа'
        });
    }
});

// Обновить статус заказа
app.put('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Заказ не найден'
            });
        }
        
        order.status = req.body.status || order.status;
        await order.save();
        
        res.json({
            success: true,
            message: 'Заказ обновлён',
            data: { order }
        });
    } catch (err) {
        console.error('❌ Ошибка обновления заказа:', err);
        res.status(500).json({
            success: false,
            message: 'Ошибка обновления заказа'
        });
    }
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n✅ Сервер запущен на http://localhost:${PORT}`);
    console.log(`📝 Тест: http://localhost:${PORT}/api/health\n`);
});

app.get('/', async (req, res) => {
    const userCount = await User.countDocuments();
    const orderCount = await Order.countDocuments();
    
    res.send(`
        <h1>✅ Сервер работает!</h1>
        <p>Пользователей в базе: ${userCount}</p>
        <p>Заказов в базе: ${orderCount}</p>
        <p>Перейдите на ваш сайт: <a href="http://127.0.0.1:5500">http://127.0.0.1:5500</a></p>
    `);
});
