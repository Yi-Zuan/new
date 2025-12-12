document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. CÁC HÀM HỖ TRỢ NAVBAR & MODAL
    // ==========================================
    window.openModalById = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'block';
    };

    window.closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    };

    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    };

    // Kiểm tra và hiển thị tên người dùng nếu đã đăng nhập
    const updateLoginStatus = () => {
        const savedUser = localStorage.getItem('user');
        const navLogin = document.getElementById('nav-login');
        if(savedUser && navLogin) {
            const user = JSON.parse(savedUser);
            navLogin.innerText = user.full_name || 'Tài khoản';
            // Tự điền tên vào form đặt phòng
            const nameInput = document.getElementById('book-name');
            if(nameInput) nameInput.value = user.full_name;
        }
    };
    updateLoginStatus();

    // ==========================================
    // 2. XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ
    // ==========================================
    window.handleLogin = function() {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;

        fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: email, password: pass })
        })
        .then(res => res.json())
        .then(d => {
            if (d.success) {
                alert('Chào mừng ' + d.user.full_name);
                localStorage.setItem('user', JSON.stringify(d.user));
                window.closeModal('login-modal');
                updateLoginStatus();
            } else {
                alert(d.message);
            }
        })
        .catch(err => alert('Lỗi đăng nhập: ' + err));
    };

    window.handleRegister = function() {
        const data = {
            fullName: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-pass').value
        };
        fetch('/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(d => {
            alert(d.message);
            if (d.success) window.closeModal('register-modal');
        })
        .catch(err => alert('Lỗi đăng ký: ' + err));
    };

    // ==========================================
    // 3. LOGIC TRANG CHI TIẾT
    // ==========================================
    const params = new URLSearchParams(window.location.search);
    const hotelId = params.get('id');
    const DEFAULT_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945';

    if (!hotelId) {
        alert("Không tìm thấy mã khách sạn!");
        window.location.href = "/";
        return;
    }

    // Gọi API lấy dữ liệu khách sạn
    fetch(`/api/hotels/${hotelId}`)
        .then(res => res.json())
        .then(hotel => {
            document.getElementById('hotel-name').innerText = hotel.name;
            document.getElementById('hotel-address').innerText = hotel.address || hotel.city;
            document.getElementById('hotel-desc').innerText = hotel.description || 'Chưa có mô tả chi tiết.';
            
            const price = Number(hotel.price_per_night).toLocaleString('vi-VN') + ' VND';
            document.getElementById('hotel-price').innerText = price;
            document.getElementById('total-price').innerText = price; 
            
            document.getElementById('hotel-img').src = hotel.image_url || DEFAULT_IMG;
            document.getElementById('current-hotel-id').value = hotel.hotel_id;

            const amenitiesDiv = document.getElementById('hotel-amenities');
            amenitiesDiv.innerHTML = '';
            if (hotel.amenities) {
                hotel.amenities.split(',').forEach(item => {
                    amenitiesDiv.innerHTML += `
                        <div style="background:#f4f4f9; padding:8px 15px; border-radius:20px; border:1px solid #eee; font-size:14px; display:flex; align-items:center; gap:5px;">
                            <i class="fa-solid fa-check" style="color:#C5B000"></i> ${item.trim()}
                        </div>`;
                });
            }
        })
        .catch(err => {
            console.error(err);
            alert("Lỗi tải dữ liệu khách sạn!");
        });

    // Hàm đặt phòng
    window.submitBooking = function() {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            alert('Vui lòng đăng nhập để đặt phòng!');
            window.openModalById('login-modal'); // Mở modal đăng nhập ngay
            return;
        }

        const data = {
            hotelId: document.getElementById('current-hotel-id').value,
            name: document.getElementById('book-name').value,
            phone: document.getElementById('book-phone').value,
            dateStart: document.getElementById('book-start').value,
            dateEnd: document.getElementById('book-end').value
        };

        if (!data.name || !data.phone || !data.dateStart || !data.dateEnd) {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        if (new Date(data.dateStart) >= new Date(data.dateEnd)) {
            alert("Ngày trả phòng phải sau ngày nhận phòng!");
            return;
        }

        fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(d => {
            alert(d.message);
            if (d.success) window.location.href = '/'; 
        })
        .catch(err => alert("Lỗi kết nối server: " + err));
    }
});