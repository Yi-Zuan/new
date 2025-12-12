require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Cấu hình để chạy giao diện từ thư mục public
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

// --- 1. API TÌM KIẾM ---
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

// --- 2. API CHI TIẾT ---
app.get('/api/hotels/:id', (req, res) => {
    dbConnection.query('SELECT * FROM hotels WHERE hotel_id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Not found' });
        res.json(results[0]);
    });
});

// --- 3. API ĐĂNG KÝ ---
app.post('/api/register', (req, res) => {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({success: false, message: 'Thiếu thông tin'});
    
    const sql = 'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)';
    dbConnection.query(sql, [fullName, email, password], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Email đã tồn tại hoặc lỗi server' });
        res.json({ success: true, message: 'Đăng ký thành công! Hãy đăng nhập.' });
    });
});

// --- 4. API ĐĂNG NHẬP ---
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

// --- 5. API LIÊN HỆ ---
app.post('/api/contact', (req, res) => {
    const { fullName, email, message } = req.body;
    const sql = 'INSERT INTO contacts (full_name, email, message) VALUES (?, ?, ?)';
    dbConnection.query(sql, [fullName, email, message], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, message: 'Tin nhắn đã được gửi!' });
    });
});

// --- 6. API ĐẶT PHÒNG ---
app.post('/api/bookings', (req, res) => {
    const { hotelId, name, phone, dateStart, dateEnd } = req.body;
    
    if (!hotelId || !name || !phone || !dateStart || !dateEnd) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt phòng' });
    }
    
    // Insert booking không cần email
    const sql = 'INSERT INTO bookings (hotel_id, user_name, user_phone, check_in_date, check_out_date) VALUES (?, ?, ?, ?, ?)';
    const params = [hotelId, name, phone, dateStart, dateEnd];
    
    dbConnection.query(sql, params, (err, result) => {
        if (err) {
            console.error('Lỗi đặt phòng:', err);
            return res.status(500).json({ success: false, message: 'Lỗi đặt phòng: ' + err.message });
        }
        
        // Lấy thông tin booking vừa tạo để trả về
        const bookingId = result.insertId;
        const getBookingSql = `
            SELECT 
                b.*, 
                h.name AS hotelName, 
                h.price_per_night,
                h.image_url,
                h.city,
                h.address
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.hotel_id
            WHERE b.booking_id = ?
        `;
        
        dbConnection.query(getBookingSql, [bookingId], (err, bookingResults) => {
            if (err) {
                console.error('Lỗi lấy thông tin booking:', err);
                return res.json({ 
                    success: true, 
                    message: 'Đặt phòng thành công!',
                    bookingId: bookingId
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Đặt phòng thành công!',
                booking: bookingResults[0]
            });
        });
    });
});

// --- 7. API ƯU ĐÃI ---
app.get('/api/offers', (req, res) => {
    dbConnection.query('SELECT * FROM offers', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// --- 8. API LẤY DANH SÁCH BOOKING (theo tên và số điện thoại) ---
app.get('/api/bookings', (req, res) => {
    const userName = req.query.name;
    const userPhone = req.query.phone;
    
    let sql, params;
    
    // Nếu có cả tên và số điện thoại, lọc theo cả hai
    if (userName && userPhone) {
        sql = `
            SELECT 
                b.*, 
                h.name AS hotelName, 
                h.price_per_night,
                h.image_url,
                h.city,
                h.address
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.hotel_id
            WHERE b.user_name = ? AND b.user_phone = ?
            ORDER BY b.booking_id DESC;
        `;
        params = [userName, userPhone];
    } else if (userName) {
        // Chỉ lọc theo tên
        sql = `
            SELECT 
                b.*, 
                h.name AS hotelName, 
                h.price_per_night,
                h.image_url,
                h.city,
                h.address
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.hotel_id
            WHERE b.user_name = ?
            ORDER BY b.booking_id DESC;
        `;
        params = [userName];
    } else {
        // Lấy tất cả bookings
        sql = `
            SELECT 
                b.*, 
                h.name AS hotelName, 
                h.price_per_night,
                h.image_url,
                h.city,
                h.address
            FROM bookings b
            JOIN hotels h ON b.hotel_id = h.hotel_id
            ORDER BY b.booking_id DESC;
        `;
        params = [];
    }
    
    dbConnection.query(sql, params, (err, results) => {
        if (err) {
            console.error('LỖI TRUY VẤN LỊCH SỬ BOOKING:', err);
            return res.status(500).json({ success: false, message: 'Lỗi server khi tải dữ liệu: ' + err.message });
        }
        res.json(results);
    });
});

// --- 9. API KIỂM TRA BOOKING THEO ID (sau khi đặt phòng) ---
app.get('/api/bookings/:id', (req, res) => {
    const bookingId = req.params.id;
    
    const sql = `
        SELECT 
            b.*, 
            h.name AS hotelName, 
            h.price_per_night,
            h.image_url,
            h.city,
            h.address,
            h.description
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.hotel_id
        WHERE b.booking_id = ?
    `;
    
    dbConnection.query(sql, [bookingId], (err, results) => {
        if (err) {
            console.error('LỖI TRUY VẤN BOOKING:', err);
            return res.status(500).json({ success: false, message: 'Lỗi server khi tải dữ liệu.' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy booking.' });
        }
        
        res.json({ success: true, booking: results[0] });
    });
});

app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});
