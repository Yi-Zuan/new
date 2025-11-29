document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const destinationInput = document.getElementById('destination');
    const resultsDiv = document.getElementById('results');
    const resultTitle = document.getElementById('result-title');
    
    // Các biến cho Modal
    const modal = document.getElementById('hotel-modal');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close-btn');

    const DEFAULT_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945';

    // 1. HÀM TÌM KIẾM (GIỮ NGUYÊN NHƯNG SỬA NÚT BẤM)
    function performSearch() {
        const keyword = destinationInput.value.trim();
        let apiUrl = '/api/hotels';

        if (keyword) {
            apiUrl += `?city=${encodeURIComponent(keyword)}`;
            if(resultTitle) resultTitle.innerText = `Kết quả cho: "${keyword}"`;
        }

        resultsDiv.innerHTML = '<p style="text-align:center">⏳ Đang tải dữ liệu...</p>';

        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                resultsDiv.innerHTML = ''; 

                if (data.length === 0) {
                    resultsDiv.innerHTML = '<p style="text-align:center">Không tìm thấy khách sạn nào.</p>';
                    return;
                }

                data.forEach(hotel => {
                    const price = hotel.price_per_night ? Number(hotel.price_per_night).toLocaleString() : '0';
                    const img = hotel.image_url || DEFAULT_IMG;

                    // LƯU Ý: Ở dòng button bên dưới, ta thêm sự kiện onclick
                    const html = `
                        <div class="hotel-card">
                            <img src="${img}" class="hotel-img" onerror="this.src='${DEFAULT_IMG}'">
                            <div class="hotel-info">
                                <h3 class="hotel-name">${hotel.name}</h3>
                                <p>📍 ${hotel.city}</p>
                                <p class="hotel-price">${price} VND</p>
                                <p>⭐ ${hotel.rating}</p>
                                
                                <button class="btn-book" onclick="openModal(${hotel.hotel_id})">
                                    XEM CHI TIẾT
                                </button>
                            </div>
                        </div>
                    `;
                    resultsDiv.innerHTML += html;
                });
            })
            .catch(err => console.error(err));
    }

// HÀM MỞ MODAL CHI TIẾT (PHIÊN BẢN ĐẸP)
window.openModal = function(id) {
    const modal = document.getElementById('hotel-modal');
    const modalBody = document.getElementById('modal-body');

    // Hiện modal lên
    modal.style.display = "block";
    modalBody.innerHTML = '<div style="padding:50px; text-align:center"><i class="fas fa-spinner fa-spin fa-3x"></i><p>Đang tải dữ liệu...</p></div>';

    // Gọi API
    fetch(`http://localhost:3000/api/hotels/${id}`)
        .then(res => {
            if (!res.ok) throw new Error('Lỗi tải dữ liệu!');
            return res.json();
        })
        .then(hotel => {
            const price = Number(hotel.price_per_night).toLocaleString();
            const img = hotel.image_url || DEFAULT_IMG;
            
            // Xử lý tiện ích: Tách chuỗi dấu phẩy thành các thẻ
            let amenitiesHtml = '';
            if (hotel.amenities) {
                const list = hotel.amenities.split(','); // Tách chuỗi
                list.forEach(item => {
                    amenitiesHtml += `<span class="amenity-tag"><i class="fas fa-check-circle"></i>${item.trim()}</span>`;
                });
            } else {
                amenitiesHtml = '<span>Đang cập nhật...</span>';
            }

            // Giao diện HTML mới (Chia đôi màn hình)
            modalBody.innerHTML = `
                <div class="modal-grid">
                    <div class="modal-left">
                        <img src="${img}" class="modal-img-large" onerror="this.src='${DEFAULT_IMG}'">
                    </div>

                    <div class="modal-right">
                        <span class="close-btn" style="color:#000; top:10px; right:20px" onclick="document.getElementById('hotel-modal').style.display='none'">&times;</span>
                        
                        <h2 class="modal-title-large">${hotel.name}</h2>
                        <div class="modal-address">
                            <i class="fas fa-map-marker-alt"></i> ${hotel.address || hotel.city}
                        </div>

                        <p class="modal-desc">${hotel.description || 'Chưa có mô tả chi tiết.'}</p>

                        <div class="amenity-list">
                            ${amenitiesHtml}
                        </div>

                        <div class="modal-footer-custom">
                            <div>
                                <span style="font-size:12px; color:#666">Giá từ</span><br>
                                <span class="modal-price-large">${price} VND</span>
                            </div>
                            <button class="btn-book-large" onclick="openBookingForm(${hotel.hotel_id}, '${hotel.name}')">ĐẶT PHÒNG NGAY</button>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(err => {
            console.error(err);
            modalBody.innerHTML = `
                <div style="padding:50px; text-align:center">
                    <i class="fas fa-exclamation-triangle" style="color:red; font-size:40px"></i>
                    <h3>Lỗi tải dữ liệu!</h3>
                    <p>Không thể lấy thông tin khách sạn ID: ${id}</p>
                </div>
            `;
        });
}

    // 3. CÁC SỰ KIỆN ĐÓNG MODAL
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    if (searchButton) {
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
    }

    performSearch();

    // --- CÁC HÀM XỬ LÝ MODAL CHUNG ---
    window.openModalById = function(id) {
        document.getElementById(id).style.display = 'block';
    }

    window.closeModal = function(id) {
        document.getElementById(id).style.display = 'none';
    }

    window.closeAllModals = function() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }

    window.switchModal = function(closeId, openId) {
        closeModal(closeId);
        openModalById(openId);
    }

    // --- 1. XỬ LÝ ĐĂNG KÝ ---
    window.handleRegister = function() {
        const fullName = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-pass').value;

        fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            if(data.success) switchModal('register-modal', 'login-modal');
        });
    }

    // --- 2. XỬ LÝ ĐĂNG NHẬP ---
    window.handleLogin = function() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-pass').value;

        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert('Xin chào, ' + data.user.full_name);
                closeModal('login-modal');
                // Đổi nút Đăng nhập thành tên người dùng
                document.getElementById('nav-login').innerText = data.user.full_name;
                document.getElementById('nav-login').onclick = null; // Tắt click
            } else {
                alert(data.message);
            }
        });
    }

    // --- 3. XỬ LÝ LIÊN HỆ ---
    window.handleContact = function() {
        const fullName = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-msg').value;

        fetch('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, message })
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            closeModal('contact-modal');
        });
    }

    // --- 4. XỬ LÝ ƯU ĐÃI ---
    window.openOffers = function() {
        openModalById('offers-modal');
        const listDiv = document.getElementById('offers-list');
        listDiv.innerHTML = '<p>Đang tải ưu đãi...</p>';

        fetch('http://localhost:3000/api/offers')
        .then(res => res.json())
        .then(data => {
            listDiv.innerHTML = '';
            data.forEach(offer => {
                listDiv.innerHTML += `
                    <div class="hotel-card offer-card">
                        <img src="${offer.image_url}" class="hotel-img" style="height:150px">
                        <div class="hotel-info">
                            <h3>${offer.title}</h3>
                            <p>${offer.description}</p>
                            <div class="offer-code">CODE: ${offer.discount_code}</div>
                        </div>
                    </div>
                `;
            });
        });
    }
    // --- HÀM MỞ FORM ĐẶT PHÒNG ---
    window.openBookingForm = function(hotelId, hotelName) {
        closeModal('hotel-modal'); // Tắt modal chi tiết đi
        openModalById('booking-modal'); // Mở modal đặt phòng lên
        
        // Điền sẵn tên và ID khách sạn vào form
        document.getElementById('booking-hotel-name').innerText = hotelName;
        document.getElementById('booking-hotel-id').value = hotelId;
    }

    // --- HÀM GỬI ĐƠN LÊN SERVER ---
    window.submitBooking = function() {
        const hotelId = document.getElementById('booking-hotel-id').value;
        const name = document.getElementById('book-name').value;
        const phone = document.getElementById('book-phone').value;
        const dateStart = document.getElementById('book-start').value;
        const dateEnd = document.getElementById('book-end').value;

        fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hotelId, name, phone, dateStart, dateEnd })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                alert('✅ ' + data.message);
                closeModal('booking-modal');
            } else {
                alert('❌ ' + data.message);
            }
        })
        .catch(err => alert('Lỗi kết nối server!'));
    }
});
