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
    const sql = 'INSERT INTO bookings (hotel_id, user_name, user_phone, check_in_date, check_out_date) VALUES (?, ?, ?, ?, ?)';
    dbConnection.query(sql, [hotelId, name, phone, dateStart, dateEnd], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Lỗi đặt phòng' });
        res.json({ success: true, message: 'Đặt phòng thành công!' });
    });
});

// --- 7. API ƯU ĐÃI ---
app.get('/api/offers', (req, res) => {
    dbConnection.query('SELECT * FROM offers', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// CHỨC NĂNG XEM LỊCH SỬ ĐẶT PHÒNG (MỚI)
    // ==========================================
    window.openBookings = function() {
        // 1. Kiểm tra đăng nhập
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            alert("Vui lòng đăng nhập để xem lịch sử đặt phòng!");
            window.openModalById('login-modal');
            return;
        }

        const user = JSON.parse(savedUser);
        window.openModalById('bookings-modal');
        const listDiv = document.getElementById('booking-history-list');
        listDiv.innerHTML = '<p style="text-align:center">⏳ Đang tải dữ liệu...</p>';

        // 2. Gọi API lấy danh sách (Giả sử API hỗ trợ lọc theo email)
        // Nếu backend chưa có filter, code này sẽ lấy tất cả booking
        fetch(`/api/bookings?email=${encodeURIComponent(user.email)}`) 
            .then(res => res.json())
            .then(data => {
                listDiv.innerHTML = '';
                
                // Lọc booking của user hiện tại (nếu API trả về tất cả)
                // const myBookings = data.filter(b => b.email === user.email); 
                // Nếu API đã lọc sẵn thì dùng luôn data:
                const myBookings = data; 

                if (!myBookings || myBookings.length === 0) {
                    listDiv.innerHTML = `
                        <div style="text-align:center; padding:20px;">
                            <i class="fa-solid fa-calendar-xmark" style="font-size:40px; color:#ddd"></i>
                            <p>Bạn chưa có đơn đặt phòng nào.</p>
                        </div>`;
                    return;
                }

                // Sắp xếp đơn mới nhất lên đầu
                myBookings.reverse();

                // 3. Render ra HTML
                myBookings.forEach(booking => {
                    // Xử lý ngày tháng cho đẹp
                    const start = new Date(booking.dateStart).toLocaleDateString('vi-VN');
                    const end = new Date(booking.dateEnd).toLocaleDateString('vi-VN');
                    
                    // Giả lập tính giá (Nếu API không trả về tổng tiền, ta tự tính hoặc để trống)
                    // Ở đây tôi giả định booking có trường hotelName, nếu không có phải fetch thêm
                    const hotelName = booking.hotelName || booking.name || "Khách sạn Meliá"; 
                    const statusClass = 'status-success'; // Mặc định xanh
                    const statusText = 'Đã xác nhận';

                    listDiv.innerHTML += `
                        <div class="booking-item">
                            <div class="booking-info">
                                <h4>🏨 ${hotelName}</h4>
                                <p><i class="fa-regular fa-calendar"></i> ${start} - ${end}</p>
                                <p><i class="fa-solid fa-user"></i> ${booking.name} (${booking.phone})</p>
                            </div>
                            <div class="booking-status">
                                <span class="status-badge ${statusClass}">${statusText}</span>
                                <span class="booking-price">Đã đặt</span>
                            </div>
                        </div>`;
                });
            })
            .catch(err => {
                console.error(err);
                listDiv.innerHTML = '<p style="text-align:center; color:red">Không thể tải lịch sử đơn hàng.</p>';
            });
    };

app.listen(PORT, () => {
    console.log(`Server chạy tại cổng ${PORT}`);
});
