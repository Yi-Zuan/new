require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- QUAN TRỌNG: TRỎ VÀO THƯ MỤC PUBLIC ---
app.use(express.static(path.join(__dirname, 'public')));

// Kết nối Database (Giữ nguyên)
const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

dbConnection.connect(err => {
    if (err) console.error('❌ Lỗi DB:', err.message);
    else console.log('✅ Đã kết nối Database thành công.');
});

// API Lấy danh sách khách sạn
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

// API Lấy chi tiết 1 khách sạn
app.get('/api/hotels/:id', (req, res) => {
    dbConnection.query('SELECT * FROM hotels WHERE hotel_id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results[0]);
    });
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});