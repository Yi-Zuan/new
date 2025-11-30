document.addEventListener('DOMContentLoaded', () => {
    // --- KHAI BÁO BIẾN ---
    const searchButton = document.getElementById('search-button');
    const destinationInput = document.getElementById('destination');
    const resultsDiv = document.getElementById('results');
    const resultTitle = document.getElementById('result-title');
    const DEFAULT_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945';

    // --- CÁC HÀM MODAL (Global để HTML gọi được) ---
    window.openModalById = (id) => document.getElementById(id).style.display = 'block';
    window.closeModal = (id) => document.getElementById(id).style.display = 'none';
    window.closeAllModals = () => document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    
    // Đóng modal khi click ra ngoài
    window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.style.display = 'none'; };

    // --- 1. TÌM KIẾM ---
    function performSearch() {
        const keyword = destinationInput.value.trim();
        let apiUrl = '/api/hotels'; // Đường dẫn tương đối
        if (keyword) {
            apiUrl += `?city=${encodeURIComponent(keyword)}`;
            if(resultTitle) resultTitle.innerText = `Kết quả cho: "${keyword}"`;
        }
        
        resultsDiv.innerHTML = '<p style="text-align:center">⏳ Đang tải...</p>';
        
        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                resultsDiv.innerHTML = '';
                if(data.length === 0) { resultsDiv.innerHTML = '<p style="text-align:center">Không tìm thấy.</p>'; return; }
                
                data.forEach(hotel => {
                    const price = Number(hotel.price_per_night).toLocaleString();
                    const img = hotel.image_url || DEFAULT_IMG;
                    resultsDiv.innerHTML += `
                        <div class="hotel-card">
                            <img src="${img}" class="hotel-img" onerror="this.src='${DEFAULT_IMG}'">
                            <div class="hotel-info">
                                <h3>${hotel.name}</h3>
                                <p>📍 ${hotel.city}</p>
                                <p style="color:#d82b45; font-weight:bold">${price} VND</p>
                                <button class="btn-book" onclick="openDetail(${hotel.hotel_id})">XEM CHI TIẾT</button>
                            </div>
                        </div>`;
                });
            });
    }

    // --- 2. XEM CHI TIẾT ---
    window.openDetail = function(id) {
        window.openModalById('hotel-modal');
        document.getElementById('modal-body').innerHTML = '<p style="text-align:center; padding:20px">Đang tải...</p>';
        
        fetch(`/api/hotels/${id}`)
            .then(res => res.json())
            .then(hotel => {
                const img = hotel.image_url || DEFAULT_IMG;
                const amenities = hotel.amenities ? hotel.amenities.split(',').map(a => `<span class="amenity-tag">✓ ${a}</span>`).join(' ') : '';
                
                document.getElementById('modal-body').innerHTML = `
                    <div class="modal-grid">
                        <div class="modal-left"><img src="${img}" class="modal-img-large"></div>
                        <div class="modal-right">
                            <h2>${hotel.name}</h2>
                            <p>${hotel.description || ''}</p>
                            <div class="amenity-list">${amenities}</div>
                            <button class="btn-book-large" onclick="openBookingForm(${hotel.hotel_id}, '${hotel.name}')">ĐẶT PHÒNG NGAY</button>
                        </div>
                    </div>`;
            });
    }

    // --- 3. ĐĂNG KÝ ---
    window.handleRegister = function() {
        const data = {
            fullName: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-pass').value
        };
        fetch('/api/register', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }).then(res => res.json()).then(d => {
            alert(d.message);
            if(d.success) window.closeModal('register-modal');
        });
    }

    // --- 4. ĐĂNG NHẬP ---
    window.handleLogin = function() {
        const data = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-pass').value
        };
        fetch('/api/login', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }).then(res => res.json()).then(d => {
            if(d.success) {
                alert('Chào mừng ' + d.user.full_name);
                window.closeModal('login-modal');
                document.getElementById('nav-login').innerText = d.user.full_name;
            } else {
                alert(d.message);
            }
        });
    }

    // --- 5. LIÊN HỆ ---
    window.handleContact = function() {
        const data = {
            fullName: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            message: document.getElementById('contact-msg').value
        };
        fetch('/api/contact', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }).then(res => res.json()).then(d => {
            alert(d.message);
            window.closeModal('contact-modal');
        });
    }

    // --- 6. ƯU ĐÃI ---
    window.openOffers = function() {
        window.openModalById('offers-modal');
        const list = document.getElementById('offers-list');
        list.innerHTML = 'Loading...';
        fetch('/api/offers').then(res => res.json()).then(data => {
            list.innerHTML = '';
            data.forEach(o => {
                list.innerHTML += `
                    <div class="hotel-card" style="padding:15px; border:1px dashed #d4af37">
                        <img src="${o.image_url}" style="width:100%; height:150px; object-fit:cover">
                        <h3>${o.title}</h3>
                        <p>${o.description}</p>
                        <strong style="background:#d4af37; color:white; padding:5px">CODE: ${o.discount_code}</strong>
                    </div>`;
            });
        });
    }

    // --- 7. ĐẶT PHÒNG ---
    window.openBookingForm = function(id, name) {
        window.closeModal('hotel-modal');
        window.openModalById('booking-modal');
        document.getElementById('booking-hotel-name').innerText = name;
        document.getElementById('booking-hotel-id').value = id;
    }

    window.submitBooking = function() {
        const data = {
            hotelId: document.getElementById('booking-hotel-id').value,
            name: document.getElementById('book-name').value,
            phone: document.getElementById('book-phone').value,
            dateStart: document.getElementById('book-start').value,
            dateEnd: document.getElementById('book-end').value
        };
        fetch('/api/bookings', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }).then(res => res.json()).then(d => {
            alert(d.message);
            if(d.success) window.closeModal('booking-modal');
        });
    }

    if(searchButton) {
        searchButton.addEventListener('click', (e) => { e.preventDefault(); performSearch(); });
    }

    // --- HÀM CHUYỂN CẢNH (SPA) ---
function showHome() {
    document.getElementById('home-view').style.display = 'block';
    document.getElementById('detail-view').style.display = 'none';
    window.scrollTo(0, 0);
}

function showDetail(id) {
    document.getElementById('home-view').style.display = 'none';
    document.getElementById('detail-view').style.display = 'block';
    window.scrollTo(0, 0);
    loadHotelDetail(id);
}

// --- LOGIC GỐC ---
document.addEventListener('DOMContentLoaded', () => {
    // Modal helpers
    window.openModalById = (id) => document.getElementById(id).style.display = 'block';
    window.closeModal = (id) => document.getElementById(id).style.display = 'none';
    window.onclick = (e) => { if(e.target.classList.contains('modal')) e.target.style.display = 'none'; };

    // 1. Tìm kiếm
    window.performSearch = function() {
        const city = document.getElementById('destination').value;
        let url = '/api/hotels';
        if(city) url += `?city=${encodeURIComponent(city)}`;
        
        document.getElementById('results').innerHTML = '<p style="text-align:center">Đang tải...</p>';
        
        fetch(url).then(res => res.json()).then(data => {
            const div = document.getElementById('results');
            div.innerHTML = '';
            data.forEach(h => {
                const price = Number(h.price_per_night).toLocaleString();
                const img = h.image_url || 'https://via.placeholder.com/400';
                div.innerHTML += `
                    <div class="hotel-card">
                        <img src="${img}" class="hotel-img">
                        <div class="hotel-info">
                            <h3>${h.name}</h3>
                            <p>📍 ${h.city}</p>
                            <p style="color:#d82b45; font-weight:bold">${price} VND</p>
                            <button class="btn-book" onclick="showDetail(${h.hotel_id})">XEM CHI TIẾT</button>
                        </div>
                    </div>`;
            });
        });
    }

    // 2. Load Chi tiết
    window.loadHotelDetail = function(id) {
        document.getElementById('detail-name').innerText = "Đang tải...";
        fetch(`/api/hotels/${id}`).then(res => res.json()).then(h => {
            document.getElementById('detail-name').innerText = h.name;
            document.getElementById('detail-address').innerText = h.address || h.city;
            document.getElementById('detail-desc').innerText = h.description;
            document.getElementById('detail-price').innerText = Number(h.price_per_night).toLocaleString() + ' VND';
            document.getElementById('detail-img').src = h.image_url;
            document.getElementById('current-hotel-id').value = h.hotel_id;
            
            // Tiện ích
            const amenitiesDiv = document.getElementById('detail-amenities');
            amenitiesDiv.innerHTML = '';
            if(h.amenities) {
                h.amenities.split(',').forEach(a => {
                    amenitiesDiv.innerHTML += `<span style="background:#eee; padding:5px 10px; border-radius:20px; font-size:13px; border:1px solid #ddd">${a}</span>`;
                });
            }
        });
    }

    // 3. Đặt phòng
    window.submitBooking = function() {
        const data = {
            hotelId: document.getElementById('current-hotel-id').value,
            name: document.getElementById('book-name').value,
            phone: document.getElementById('book-phone').value,
            dateStart: document.getElementById('book-start').value,
            dateEnd: document.getElementById('book-end').value
        };
        fetch('/api/bookings', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        }).then(res => res.json()).then(d => {
            alert(d.message);
            if(d.success) showHome();
        });
    }
});
    performSearch();
});