// --- KHAI BÁO BIẾN TOÀN CỤC ---
window.currentPricePerNight = 0;   
window.currentDiscountPercent = 0; 

document.addEventListener('DOMContentLoaded', () => {
    // Dark Mode Toggle Functionality
    function initDarkMode() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const html = document.documentElement;
        html.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function toggleDarkMode() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                if (theme === 'dark') {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }
        }
    }

    // Initialize dark mode on page load
    initDarkMode();

    // Make toggle function globally available
    window.toggleDarkMode = toggleDarkMode;

    // Modal Functions
    window.openModalById = function(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'block';
    };

    window.closeModal = function(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    };

    window.onclick = function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    };

    // Login function (if needed)
    window.handleLogin = function() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-pass').value;
        
        if(!email || !password) {
            alert("Vui lòng nhập email và mật khẩu!");
            return;
        }

        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(d => {
            if (d.success) {
                alert('Chào mừng ' + d.user.full_name);
                localStorage.setItem('user', JSON.stringify(d.user));
                window.closeModal('login-modal');
                if (document.getElementById('nav-login')) {
                    document.getElementById('nav-login').innerHTML = `<i class="fa-solid fa-user"></i> ${d.user.full_name}`;
                }
            } else {
                alert(d.message);
            }
        })
        .catch(err => alert('Lỗi đăng nhập: ' + err));
    };

    // ======================================================
    // 1. LẤY ID TỪ URL & TẢI DỮ LIỆU KHÁCH SẠN
    // ======================================================
    const params = new URLSearchParams(window.location.search);
    const hotelId = params.get('id');
    const DEFAULT_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945';

    // Nếu không có ID trên URL thì quay về trang chủ
    if (!hotelId) {
        alert("Không tìm thấy khách sạn!");
        window.location.href = "/";
        return;
    }

    // Lấy Data Từ Server
    fetch(`/api/hotels/${hotelId}`)
        .then(res => res.json())
        .then(hotel => {
            // Điền thông tin cơ bản
            if(document.getElementById('hotel-name')) document.getElementById('hotel-name').innerText = hotel.name;
            if(document.getElementById('hotel-address')) document.getElementById('hotel-address').innerText = hotel.address || hotel.city;
            if(document.getElementById('hotel-desc')) document.getElementById('hotel-desc').innerText = hotel.description || 'Chưa có mô tả chi tiết.';
            
            // Format Giá Tiền & Ảnh
            const priceNum = Number(hotel.price_per_night);
            if(document.getElementById('hotel-price')) document.getElementById('hotel-price').innerText = priceNum.toLocaleString('vi-VN') + ' VND';
            if(document.getElementById('hotel-img')) document.getElementById('hotel-img').src = hotel.image_url || DEFAULT_IMG;
            if(document.getElementById('current-hotel-id')) document.getElementById('current-hotel-id').value = hotel.hotel_id;

            // Hiển thị tiện ích
            const amenitiesDiv = document.getElementById('hotel-amenities');
            if(amenitiesDiv) {
                amenitiesDiv.innerHTML = '';
                if (hotel.amenities) {
                    hotel.amenities.split(',').forEach(item => {
                        amenitiesDiv.innerHTML += `
                            <div class="amenity-tag">
                                <i class="fa-solid fa-check-circle"></i> ${item.trim()}
                            </div>`;
                    });
                }
            }

            // [QUAN TRỌNG] Lưu giá vào biến toàn cục để tính toán sau
            window.currentPricePerNight = priceNum;
        })
        .catch(err => console.error("Lỗi tải khách sạn:", err));


    // ======================================================
    // 2. LOGIC TÍNH TIỀN & MÃ GIẢM GIÁ
    // ======================================================
    const startInput = document.getElementById('book-start');
    const endInput = document.getElementById('book-end');
    const totalSpan = document.getElementById('total-price');
    const couponMsg = document.getElementById('coupon-msg');

    // HÀM TÍNH TỔNG TIỀN
    window.calculateTotal = function() {
        if(!startInput || !endInput) return;

        const d1 = new Date(startInput.value);
        const d2 = new Date(endInput.value);
        
        // Chỉ tính khi có đủ ngày và ngày đi lớn hơn ngày đến
        if (d1 && d2 && d2 > d1 && window.currentPricePerNight) {
            
            // Tính số đêm
            const diffTime = Math.abs(d2 - d1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            // Tính tiền gốc
            let originalTotal = diffDays * window.currentPricePerNight;
            
            // Tính tiền giảm
            let discountAmount = 0;
            if (window.currentDiscountPercent > 0) {
                discountAmount = originalTotal * (window.currentDiscountPercent / 100);
            }

            // Tổng cuối cùng
            let finalTotal = originalTotal - discountAmount;

            // Hiển thị
            if (discountAmount > 0) {
                totalSpan.innerHTML = `
                    <div style="text-align: right;">
                        <span style="text-decoration: line-through; color: #999; font-size: 13px;">
                            ${originalTotal.toLocaleString('vi-VN')} đ
                        </span>
                        <br>
                        <span style="color: #d82b45; font-size: 20px; font-weight: bold;">
                            ${finalTotal.toLocaleString('vi-VN')} VND
                        </span>
                        <div style="font-size: 11px; color: #2ecc71;">(Đã giảm ${window.currentDiscountPercent}%)</div>
                    </div>`;
            } else {
                totalSpan.innerText = finalTotal.toLocaleString('vi-VN') + ' VND';
            }
        } else {
            totalSpan.innerText = '0 VND';
        }
    }

    // Gắn sự kiện thay đổi ngày
    if(startInput) startInput.addEventListener('change', calculateTotal);
    if(endInput) endInput.addEventListener('change', calculateTotal);


    // HÀM ÁP DỤNG MÃ (GỌI TỪ NÚT BẤM)
    window.applyCoupon = function() {
        const codeInput = document.getElementById('coupon-code');
        const code = codeInput.value.trim();

        // Reset
        window.currentDiscountPercent = 0;
        
        if (!code) {
            couponMsg.style.color = 'red';
            couponMsg.innerText = 'Vui lòng nhập mã!';
            calculateTotal(); 
            return;
        }

        couponMsg.innerText = 'Đang kiểm tra...';
        couponMsg.style.color = '#666';

        fetch('/api/check-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.currentDiscountPercent = data.discount; 
                couponMsg.style.color = 'green';
                couponMsg.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${data.message}`;
            } else {
                window.currentDiscountPercent = 0;
                couponMsg.style.color = 'red';
                couponMsg.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${data.message}`;
            }
            // Luôn tính lại tiền sau khi kiểm tra
            calculateTotal();
        })
        .catch(err => {
            console.error(err);
            couponMsg.style.color = 'red';
            couponMsg.innerText = 'Lỗi kết nối server!';
        });
    }

    // ======================================================
    // 3. XỬ LÝ ĐẶT PHÒNG
    // ======================================================
    window.submitBooking = function() {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
            alert('Vui lòng đăng nhập để đặt phòng!');
            if(window.openModalById) window.openModalById('login-modal');
            return;
        }

        // Tính lại giá lần cuối để gửi lên server
        const d1 = new Date(startInput.value);
        const d2 = new Date(endInput.value);
        if (!d1 || !d2 || d1 >= d2) {
            alert("Ngày đặt phòng không hợp lệ!");
            return;
        }
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        let originalTotal = diffDays * window.currentPricePerNight;
        let discountAmount = 0;
        if (window.currentDiscountPercent > 0) {
            discountAmount = originalTotal * (window.currentDiscountPercent / 100);
        }
        let finalTotal = originalTotal - discountAmount;


        const data = {
            hotelId: document.getElementById('current-hotel-id').value,
            name: document.getElementById('book-name').value,
            phone: document.getElementById('book-phone').value,
            dateStart: document.getElementById('book-start').value,
            dateEnd: document.getElementById('book-end').value,
            totalPrice: finalTotal // Gửi giá đã giảm lên server
        };

        if (!data.name || !data.phone) {
            alert("Vui lòng điền tên và số điện thoại!");
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