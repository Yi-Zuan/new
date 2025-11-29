require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- CẤU HÌNH THƯ MỤC PUBLIC (Quan trọng để chạy trên Render) ---
app.use(express.static(path.join(__dirname, 'public')));

// --- KẾT NỐI DATABASE ---
const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

dbConnection.connect(err => {
    if (err) console.error('❌ Lỗi kết nối DB:', err.message);
    else console.log('✅ Đã kết nối Database thành công.');
});

// ========================================================
// 1. API TÌM KIẾM & DANH SÁCH KHÁCH SẠN
// ========================================================
app.get('/api/hotels', (req, res) => {
    const citySearch = req.query.city;
    let sql = 'SELECT * FROM hotels';
    let params = [];
    if (citySearch) {
        sql += ' WHERE city LIKE ?';
        params.push(`%${citySearch}%`);
    }
    dbConnection.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ========================================================
// 2. API LẤY CHI TIẾT 1 KHÁCH SẠN
// ========================================================
app.get('/api/hotels/:id', (req, res) => {
    dbConnection.query('SELECT * FROM hotels WHERE hotel_id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(results[0]);
    });
});

// ========================================================
// 3. API ĐĂNG KÝ THÀNH VIÊN
// ========================================================
app.post('/api/register', (req, res) => {
    const { fullName, email, password } = req.body;
    const sql = 'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)';
    dbConnection.query(sql, [fullName, email, password], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Email này đã tồn tại!' });
        res.json({ success: true, message: 'Đăng ký thành công!' });
    });
});

// ========================================================
// 4. API ĐĂNG NHẬP
// ========================================================
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

// ========================================================
// 5. API GỬI LIÊN HỆ
// ========================================================
app.post('/api/contact', (req, res) => {
    const { fullName, email, message } = req.body;
    const sql = 'INSERT INTO contacts (full_name, email, message) VALUES (?, ?, ?)';
    dbConnection.query(sql, [fullName, email, message], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, message: 'Đã gửi tin nhắn liên hệ!' });
    });
});

// ========================================================
// 6. API LẤY ƯU ĐÃI
// ========================================================
app.get('/api/offers', (req, res) => {
    dbConnection.query('SELECT * FROM offers', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ========================================================
// 7. API ĐẶT PHÒNG (BOOKING)
// ========================================================
app.post('/api/bookings', (req, res) => {
    const { hotelId, name, phone, dateStart, dateEnd } = req.body;
    
    if (!name || !phone || !dateStart || !dateEnd) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin!' });
    }

    const sql = 'INSERT INTO bookings (hotel_id, user_name, user_phone, check_in_date, check_out_date) VALUES (?, ?, ?, ?, ?)';
    dbConnection.query(sql, [hotelId, name, phone, dateStart, dateEnd], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi server' });
        res.json({ success: true, message: 'Đặt phòng thành công! Chúng tôi sẽ liên hệ sớm.' });
    });
});

// KHỞI ĐỘNG SERVER
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});