require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// MiddleWare
app.use(cors());
app.use(express.json());

// Chạy Giao Diện Từ Thư Mục Public
app.use(express.static(path.join(__dirname, 'public')));

// Link DataBase
const dbConnection = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

dbConnection.getConnection((err, connection) => {
    if (err) {
        console.error(' Lỗi kết nối ', err.message);
    } else {
        console.log('Kết nối Database thành công');
        connection.release();
    }
});

// API
app.get('/api/hotels', (req, res) => {
    const city = req.query.city;
    let sql = 'SELECT * FROM hotels';
    let params = [];
    if (city) {
        sql += ' WHERE city LIKE ?';
        params.push(`%${city}%`);
    }
    dbConnection.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/api/hotels/:id', (req, res) => {
    dbConnection.query('SELECT * FROM hotels WHERE hotel_id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(results[0]);
    });
});

app.post('/api/register', (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({success: false, message: 'Thiếu thông tin'});
    const sql = 'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)';
    dbConnection.query(sql, [fullName, email, password], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Email đã tồn tại hoặc lỗi server' });
        res.json({ success: true, message: 'Đăng ký thành công! Hãy đăng nhập.' });
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    dbConnection.query(sql, [email, password], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.json({ success: false, message: 'Sai email hoặc mật khẩu!' });
        }
    });
});

app.post('/api/contact', (req, res) => {
    const { fullName, email, message } = req.body;
    const sql = 'INSERT INTO contacts (full_name, email, message) VALUES (?, ?, ?)';
    dbConnection.query(sql, [fullName, email, message], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, message: 'Tin nhắn đã được gửi!' });
    });
});

app.post('/api/bookings', (req, res) => {
    const { hotelId, name, phone, dateStart, dateEnd, totalPrice } = req.body;
    const sql = 'INSERT INTO bookings (hotel_id, user_name, user_phone, check_in_date, check_out_date, total_price) VALUES (?, ?, ?, ?, ?, ?)';
    dbConnection.query(sql, [hotelId, name, phone, dateStart, dateEnd, totalPrice], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi đặt phòng' });
        res.json({ success: true, message: 'Đặt phòng thành công!' });
    });
});

app.get('/api/offers', (req, res) => {
    dbConnection.query('SELECT * FROM offers', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/api/user-bookings', (req, res) => {
    const phone = req.query.phone;
    if (!phone) return res.json([]); 

    const sql = `
        SELECT 
            b.id, b.user_name, b.check_in_date, b.check_out_date, b.created_at, 'pending' as status, 
            b.total_price, 
            h.name AS hotel_name, 
            h.image_url,
            h.price_per_night  -- THÊM DÒNG NÀY ĐỂ TRÁNH LỖI NẾU TOTAL_PRICE NULL
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.hotel_id
        WHERE b.user_phone = ?
        ORDER BY b.created_at DESC
    `;

    dbConnection.query(sql, [phone], (err, results) => {
        if (err) {
            console.error("Lỗi lấy lịch sử:", err);
            return res.status(500).json({ error: 'Lỗi Database' });
        }
        res.json(results);
    });
});

app.post('/api/check-coupon', (req, res) => {
    const { code } = req.body;
    const coupons = {
        'SPRING15': 15, 'SUMMER20': 20, 'AUTUMN10': 10, 'WINTER25': 25, 'WELCOME10': 10
    };
    const discountPercent = coupons[code.toUpperCase()];

    if (discountPercent) {
        res.json({ success: true, discount: discountPercent, message: `Áp dụng mã thành công! Giảm ${discountPercent}%` });
    } else {
        res.json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});