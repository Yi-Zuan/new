document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. CẤU HÌNH & HẰNG SỐ (CONSTANTS)
    // ==========================================
    const CONFIG = {
        DEFAULT_IMG: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        API: {
            HOTELS: '/api/hotels',
            REGISTER: '/api/register',
            LOGIN: '/api/login',
            CONTACT: '/api/contact',
            OFFERS: '/api/offers',
            BOOKINGS: '/api/bookings'
        }
    };

    // DOM Elements thường dùng
    const dom = {
        searchBtn: document.getElementById('search-button'),
        destInput: document.getElementById('destination'),
        resultsDiv: document.getElementById('results'),
        resultTitle: document.getElementById('result-title'),
        navLogin: document.getElementById('nav-login')
    };

    // ==========================================
    // 2. HÀM TIỆN ÍCH (UTILS)
    // ==========================================
    
    // Hàm rút gọn để gọi fetch API (Post data)
    const postData = (url, data) => {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json());
    };

    // Hàm định dạng tiền tệ
    const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VND';

    // ==========================================
    // 3. QUẢN LÝ MODAL (Global functions)
    // ==========================================
    window.openModalById = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'block';
    };

    window.closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    };

    window.closeAllModals = () => {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    };

    // Đóng modal khi click ra vùng tối bên ngoài
    window.onclick = (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    };

    // ==========================================
    // 4. CHỨC NĂNG TÌM KIẾM & HIỂN THỊ
    // ==========================================
    function performSearch() {
        const keyword = dom.destInput ? dom.destInput.value.trim() : '';
        let apiUrl = CONFIG.API.HOTELS;

        if (keyword) {
            apiUrl += `?city=${encodeURIComponent(keyword)}`;
            if (dom.resultTitle) dom.resultTitle.innerText = `Kết quả cho: "${keyword}"`;
        }

        if (dom.resultsDiv) {
            dom.resultsDiv.innerHTML = '<p style="text-align:center">⏳ Đang tải dữ liệu...</p>';
            
            fetch(apiUrl)
                .then(res => res.json())
                .then(data => {
                    dom.resultsDiv.innerHTML = '';
                    if (!data || data.length === 0) {
                        dom.resultsDiv.innerHTML = '<p style="text-align:center">Không tìm thấy khách sạn nào.</p>';
                        return;
                    }

                    const html = data.map(hotel => {
                        const img = hotel.image_url || CONFIG.DEFAULT_IMG;
                        return `
                        <div class="hotel-card">
                            <img src="${img}" class="hotel-img" onerror="this.src='${CONFIG.DEFAULT_IMG}'" alt="${hotel.name}">
                            <div class="hotel-info">
                                <h3>${hotel.name}</h3>
                                <p>📍 ${hotel.city}</p>
                                <p style="color:#d82b45; font-weight:bold">${formatCurrency(hotel.price_per_night)}</p>
                                <button class="btn-book" onclick="openDetail(${hotel.hotel_id})">XEM CHI TIẾT</button>
                            </div>
                        </div>`;
                    }).join('');
                    
                    dom.resultsDiv.innerHTML = html;
                })
                .catch(err => {
                    console.error(err);
                    dom.resultsDiv.innerHTML = '<p style="text-align:center; color:red">Lỗi tải dữ liệu.</p>';
                });
        }
    }

    // ==========================================
    // 5. CHỨC NĂNG CHI TIẾT (Global)
    // ==========================================
    window.openDetail = function(id) {
        window.openModalById('hotel-modal');
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = '<p style="text-align:center; padding:20px">⏳ Đang tải thông tin...</p>';

        fetch(`${CONFIG.API.HOTELS}/${id}`)
            .then(res => res.json())
            .then(hotel => {
                const img = hotel.image_url || CONFIG.DEFAULT_IMG;
                // Tạo tags tiện ích
                const amenities = hotel.amenities 
                    ? hotel.amenities.split(',').map(a => `<span class="amenity-tag">✓ ${a.trim()}</span>`).join(' ') 
                    : '';

                modalBody.innerHTML = `
                    <div class="modal-grid">
                        <div class="modal-left">
                            <img src="${img}" class="modal-img-large" onerror="this.src='${CONFIG.DEFAULT_IMG}'">
                        </div>
                        <div class="modal-right">
                            <h2>${hotel.name}</h2>
                            <p>${hotel.description || 'Chưa có mô tả.'}</p>
                            <div class="amenity-list">${amenities}</div>
                            <br>
                            <button class="btn-book-large" onclick="openBookingForm(${hotel.hotel_id}, '${hotel.name}')">ĐẶT PHÒNG NGAY</button>
                        </div>
                    </div>`;
            })
            .catch(err => {
                console.error(err);
                modalBody.innerHTML = '<p style="text-align:center; color:red">Không thể tải thông tin chi tiết.</p>';
            });
    };

    // ==========================================
    // 6. CÁC CHỨC NĂNG FORM (AUTH, CONTACT)
    // ==========================================
    
    // Đăng ký
    window.handleRegister = function() {
        const data = {
            fullName: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-pass').value
        };
        
        postData(CONFIG.API.REGISTER, data)
            .then(d => {
                alert(d.message);
                if (d.success) window.closeModal('register-modal');
            })
            .catch(err => alert('Lỗi kết nối: ' + err));
    };

    // Đăng nhập
    window.handleLogin = function() {
        const data = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-pass').value
        };

        postData(CONFIG.API.LOGIN, data)
            .then(d => {
                if (d.success) {
                    alert('Chào mừng ' + d.user.full_name);
                    window.closeModal('login-modal');
                    if(dom.navLogin) dom.navLogin.innerText = d.user.full_name;
                } else {
                    alert(d.message);
                }
            })
            .catch(err => alert('Lỗi đăng nhập: ' + err));
    };

    // Liên hệ
    window.handleContact = function() {
        const data = {
            fullName: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            message: document.getElementById('contact-msg').value
        };

        postData(CONFIG.API.CONTACT, data)
            .then(d => {
                alert(d.message);
                window.closeModal('contact-modal');
            })
            .catch(err => alert('Không thể gửi liên hệ lúc này.'));
    };

    // ==========================================
    // 7. CHỨC NĂNG ƯU ĐÃI (OFFERS)
    // ==========================================
    window.openOffers = function() {
        window.openModalById('offers-modal');
        const list = document.getElementById('offers-list');
        list.innerHTML = '<p style="text-align:center">Đang tải ưu đãi...</p>';

        fetch(CONFIG.API.OFFERS)
            .then(res => res.json())
            .then(data => {
                list.innerHTML = '';
                if(data.length === 0) {
                    list.innerHTML = '<p>Hiện không có ưu đãi nào.</p>';
                    return;
                }
                
                data.forEach(o => {
                    list.innerHTML += `
                        <div class="hotel-card" style="padding:15px; border:1px dashed #d4af37">
                            <img src="${o.image_url}" style="width:100%; height:150px; object-fit:cover" onerror="this.src='${CONFIG.DEFAULT_IMG}'">
                            <h3>${o.title}</h3>
                            <p>${o.description}</p>
                            <strong style="background:#d4af37; color:white; padding:5px; display:inline-block; margin-top:5px">CODE: ${o.discount_code}</strong>
                        </div>`;
                });
            })
            .catch(err => {
                list.innerHTML = '<p style="color:red">Lỗi tải ưu đãi.</p>';
            });
    };

    // ==========================================
    // 8. CHỨC NĂNG ĐẶT PHÒNG (BOOKING)
    // ==========================================
    window.openBookingForm = function(id, name) {
        window.closeModal('hotel-modal'); // Đóng modal chi tiết trước
        window.openModalById('booking-modal'); // Mở modal đặt phòng
        
        const nameEl = document.getElementById('booking-hotel-name');
        const idEl = document.getElementById('booking-hotel-id');
        
        if(nameEl) nameEl.innerText = name;
        if(idEl) idEl.value = id;
    };

    window.submitBooking = function() {
        const data = {
            hotelId: document.getElementById('booking-hotel-id').value,
            name: document.getElementById('book-name').value,
            phone: document.getElementById('book-phone').value,
            dateStart: document.getElementById('book-start').value,
            dateEnd: document.getElementById('book-end').value
        };

        postData(CONFIG.API.BOOKINGS, data)
            .then(d => {
                alert(d.message);
                if (d.success) window.closeModal('booking-modal');
            })
            .catch(err => alert('Lỗi đặt phòng: ' + err));
    };

    // ==========================================
    // 9. KHỞI TẠO (INIT)
    // ==========================================
    if (dom.searchBtn) {
        dom.searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
    }

    // Tự động tìm kiếm lần đầu khi tải trang
    performSearch();
});