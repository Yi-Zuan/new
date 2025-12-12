document.addEventListener('DOMContentLoaded', () => {
    // 1. CẤU HÌNH & HẰNG SỐ
    const CONFIG = {
        DEFAULT_IMG: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        API: {
            HOTELS: '/api/hotels',
            REGISTER: '/api/register',
            LOGIN: '/api/login',
            CONTACT: '/api/contact',
            OFFERS: '/api/offers'
        }
    };

    const dom = {
        searchBtn: document.getElementById('search-button'),
        destInput: document.getElementById('destination'),
        resultsDiv: document.getElementById('results'),
        resultTitle: document.getElementById('result-title'),
        navLogin: document.getElementById('nav-login')
    };

    // Kiểm tra đăng nhập cũ từ localStorage khi tải trang
    const savedUser = localStorage.getItem('user');
    if (savedUser && dom.navLogin) {
        const userObj = JSON.parse(savedUser);
        dom.navLogin.innerText = userObj.full_name || 'Tài khoản';
    }

    // 2. UTILS
    const postData = (url, data) => {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json());
    };

    const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + ' VND';

    // 3. MODAL UTILS
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

    // 4. SEARCH FUNCTION
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
                        // Thay đổi quan trọng: Chuyển hướng sang detail.html
                        return `
                        <div class="hotel-card">
                            <img src="${img}" class="hotel-img" onerror="this.src='${CONFIG.DEFAULT_IMG}'" alt="${hotel.name}">
                            <div class="hotel-info">
                                <h3>${hotel.name}</h3>
                                <p>📍 ${hotel.city}</p>
                                <p style="color:#d82b45; font-weight:bold">${formatCurrency(hotel.price_per_night)}</p>
                                <button class="btn-book" onclick="window.location.href='detail.html?id=${hotel.hotel_id}'">XEM CHI TIẾT</button>
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

    // 5. CÁC CHỨC NĂNG KHÁC (AUTH, CONTACT, OFFERS)
    
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

    window.handleLogin = function() {
        const data = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-pass').value
        };

        postData(CONFIG.API.LOGIN, data)
            .then(d => {
                if (d.success) {
                    alert('Chào mừng ' + d.user.full_name);
                    // LƯU USER VÀO LOCALSTORAGE ĐỂ TRANG CHI TIẾT DÙNG
                    localStorage.setItem('user', JSON.stringify(d.user));
                    
                    window.closeModal('login-modal');
                    if(dom.navLogin) dom.navLogin.innerText = d.user.full_name;
                } else {
                    alert(d.message);
                }
            })
            .catch(err => alert('Lỗi đăng nhập: ' + err));
    };

    window.handleContact = function() {
        const data = {
            fullName: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            message: document.getElementById('contact-msg').value
        };
        postData(CONFIG.API.CONTACT, data)
            .then(d => { alert(d.message); window.closeModal('contact-modal'); })
            .catch(err => alert('Lỗi gửi liên hệ.'));
    };

    window.openOffers = function() {
        window.openModalById('offers-modal');
        const list = document.getElementById('offers-list');
        list.innerHTML = '<p style="text-align:center">Đang tải...</p>';
        fetch(CONFIG.API.OFFERS)
            .then(res => res.json())
            .then(data => {
                list.innerHTML = '';
                if(!data || data.length === 0) { list.innerHTML = '<p>Không có ưu đãi.</p>'; return; }
                data.forEach(o => {
                    list.innerHTML += `
                        <div class="hotel-card" style="padding:15px; border:1px dashed #d4af37">
                            <img src="${o.image_url}" style="width:100%; height:150px; object-fit:cover" onerror="this.src='${CONFIG.DEFAULT_IMG}'">
                            <h3>${o.title}</h3>
                            <p>${o.description}</p>
                            <strong style="background:#d4af37; color:white; padding:5px;">CODE: ${o.discount_code}</strong>
                        </div>`;
                });
            })
            .catch(() => list.innerHTML = '<p>Lỗi tải ưu đãi.</p>');
    };

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

    

    // Init
    if (dom.searchBtn) dom.searchBtn.addEventListener('click', (e) => { e.preventDefault(); performSearch(); });
    performSearch();
});