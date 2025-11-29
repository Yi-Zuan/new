// 1. DÒNG NÀY PHẢI Ở TRÊN CÙNG (Để nạp biến môi trường)

require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
// Lấy Port từ .env, nếu không có thì dùng 3000
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- KẾT NỐI DATABASE BẰNG BIẾN MÔI TRƯỜNG ---
const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,      // Đọc từ .env
    port: process.env.DB_PORT,      // Đọc từ .env
    user: process.env.DB_USER,      // Đọc từ .env
    password: process.env.DB_PASS, // Đọc từ .env (BẢO MẬT TUYỆT ĐỐI)
    database: process.env.DB_NAME,  // Đọc từ .env
    ssl: { rejectUnauthorized: false }
});

dbConnection.connect(err => {
    if (err) return console.error('❌ Lỗi kết nối Database:', err.message);
    console.log('✅ Đã kết nối Database Aiven thành công.');
});

// ... (GIỮ NGUYÊN CÁC ĐOẠN API CỦA BẠN Ở DƯỚI) ...

// VÍ DỤ API CŨ CỦA BẠN (Copy lại phần API từ file cũ dán vào đây)
app.get('/api/hotels', (req, res) => {
    // ... code cũ ...
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
// ... (Dán tiếp các API đăng nhập/đăng ký vào đây) ...

// --- API LẤY CHI TIẾT 1 KHÁCH SẠN (QUAN TRỌNG) ---
app.get('/api/hotels/:id', (req, res) => {
    const id = req.params.id; 
    
    // Câu lệnh SQL lấy khách sạn theo ID
    const sql = 'SELECT * FROM hotels WHERE hotel_id = ?';
    
    dbConnection.query(sql, [id], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Lỗi Database' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy khách sạn' });
        }
        // Trả về kết quả đầu tiên
        res.json(results[0]);
    });
});

// --- API ĐẶT PHÒNG (MỚI) ---
app.post('/api/bookings', (req, res) => {
    const { hotelId, name, phone, dateStart, dateEnd } = req.body;
    
    // Kiểm tra dữ liệu đầu vào
    if (!name || !phone || !dateStart || !dateEnd) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin!' });
    }

    const sql = 'INSERT INTO bookings (hotel_id, user_name, user_phone, check_in_date, check_out_date) VALUES (?, ?, ?, ?, ?)';
    
    dbConnection.query(sql, [hotelId, name, phone, dateStart, dateEnd], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Lỗi lưu đơn đặt phòng' });
        }
        res.json({ success: true, message: 'Đặt phòng thành công! Chúng tôi sẽ liên hệ sớm.' });
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});