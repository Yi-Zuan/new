document.addEventListener('DOMContentLoaded', () => {
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

    initDarkMode();

    window.toggleDarkMode = toggleDarkMode;

    // 1: Cấu hình chung
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
        navLogin: document.getElementById('nav-login'),
        heroGreeting: document.getElementById('hero-greeting'),
        scrollTopBtn: document.getElementById('scroll-top-btn')
    };

    let allHotelsData = [];
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (dom.navLogin) {
            dom.navLogin.innerText = userObj.full_name || 'Tài khoản';
        }
        if (dom.heroGreeting && userObj.full_name) {
            dom.heroGreeting.textContent = `Xin chào, ${userObj.full_name}! Sẵn sàng cho chuyến nghỉ dưỡng tiếp theo?`;
        }
    }

    // 2: Các hàm tiện tích cơ bản
    const postData = (url, data) => {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json());
    };

    // 3: Quản lý Modal
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

    // 4: Tìm kiếm và hiển thị
    function isFavorite(hotelId) {
        return favorites.includes(hotelId);
    }

    function toggleFavorite(hotelId) {
        const index = favorites.indexOf(hotelId);
        if (index === -1) {
            favorites.push(hotelId);
        } else {
            favorites.splice(index, 1);
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderHotels(allHotelsData);
    }

    window.toggleFavorite = toggleFavorite;

    function renderHotels(listHotel) {
        const mainGrid = document.getElementById('results');
        const slider = document.getElementById('recommend-slider');

        if (mainGrid) mainGrid.innerHTML = '';
        if (slider) slider.innerHTML = '';

        if (!listHotel || listHotel.length === 0) {
            const msg = '<p style="grid-column: 1/-1; text-align:center;">Không tìm thấy khách sạn phù hợp.</p>';
            if (mainGrid) mainGrid.innerHTML = msg;
            return;
        }

        listHotel.forEach(hotel => {
            const price = Number(hotel.price_per_night).toLocaleString();
            const img = hotel.image_url || CONFIG.DEFAULT_IMG;
            const rating = hotel.rating || (Math.random() * (5 - 3) + 3).toFixed(1);

            const favClass = isFavorite(hotel.hotel_id) ? 'fav-active' : '';
            const cardHTML = `
                <div class="hotel-card">
                    <div style="overflow:hidden; height:200px;">
                        <img src="${img}" class="hotel-img" onerror="this.src='${CONFIG.DEFAULT_IMG}'">
                    </div>
                    <div class="hotel-info">
                        <button class="fav-btn ${favClass}" onclick="toggleFavorite(${hotel.hotel_id}); event.stopPropagation();">
                            <i class="fa${isFavorite(hotel.hotel_id) ? 's' : 'r'} fa-heart"></i>
                        </button>
                        <h3>${hotel.name}</h3>
                        <p style="font-size:13px; color:#666"><i class="fa-solid fa-location-dot"></i> ${hotel.city}</p>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px">
                            <span style="color:#d82b45; font-weight:bold;">${price} VND</span>
                            <span style="font-size:12px; background:#eee; padding:2px 8px; border-radius:10px">⭐ ${rating}</span>
                        </div>
                        <a href="hotel/detail.html?id=${hotel.hotel_id}" class="btn-book" style="margin-top:10px">XEM CHI TIẾT</a>
                    </div>
                </div>`;

            if (mainGrid) mainGrid.innerHTML += cardHTML;
            if (slider) slider.innerHTML += cardHTML;
        });
    }

    function performSearch() {
        const keyword = dom.destInput ? dom.destInput.value.trim() : '';

        if (dom.destInput) {
            localStorage.setItem('lastDestination', keyword);
        }
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
                    allHotelsData = data;
                    renderHotels(allHotelsData);
                })
                .catch(err => console.error(err));
        }
    }

    window.updateFilterLabel = function () {
        const val = document.getElementById('price-range').value;
        document.getElementById('price-label').innerText = Number(val).toLocaleString('vi-VN') + ' VNĐ';
    }

    window.applyFilters = function () {
        const maxPrice = Number(document.getElementById('price-range').value);
        const checkedBoxes = document.querySelectorAll('.star-check:checked');
        const selectedStars = Array.from(checkedBoxes).map(cb => Number(cb.value));

        const filteredList = allHotelsData.filter(hotel => {
            const priceOk = hotel.price_per_night <= maxPrice;
            let starOk = true;
            if (selectedStars.length > 0) {
                const currentRating = hotel.rating || 4.5;
                const is5Star = currentRating >= 4.7;
                const is4Star = currentRating < 4.7;

                if (selectedStars.includes(5) && is5Star) starOk = true;
                else if (selectedStars.includes(4) && is4Star) starOk = true;
                else if (selectedStars.includes(5) && selectedStars.includes(4)) starOk = true;
                else starOk = false;
            }
            return priceOk && starOk;
        });
        renderHotels(filteredList);
    }

    // 5: Chức năng người dùng (Login, Register, Contact, Offers)
    // Hàm chạy ngay khi web tải xong để kiểm tra xem đã đăng nhập chưa
    document.addEventListener("DOMContentLoaded", function () {
        checkLoginState();
    });

    // Hàm kiểm tra trạng thái và đổi tên nút
    function checkLoginState() {
        const userJson = localStorage.getItem('user');
        const navBtn = document.getElementById('nav-login');

        if (userJson && navBtn) {
            const user = JSON.parse(userJson);
            navBtn.innerHTML = `<i class="fa-solid fa-user"></i> ${user.full_name}`;
        } else if (navBtn) {
            navBtn.innerText = "Đăng nhập";
        }
    }

    // HÀM MỚI: Xử lý khi bấm nút trên Menu
    window.handleAuthClick = function (event) {
        event.preventDefault();
        const user = localStorage.getItem('user');

        if (user) {
            window.openModalById('logout-modal');
        } else {
            window.openModalById('login-modal');
        }
    };

    window.confirmLogout = function () {
        localStorage.removeItem('user');
        closeModal('logout-modal');

        checkLoginState();

        window.openModalById('logout-success-modal');
    };

    // Tự động tắt thông báo đăng xuất thành công
    const successModal = document.getElementById('logout-success-modal');
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                closeModal('logout-success-modal');
            }
        });
    }


    // Xử lý khi bấm nút đăng nhập
    window.handleLogin = function () {
        const data = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-pass').value
        };

        if (!data.email || !data.password) {
            alert("Vui lòng nhập email và mật khẩu!");
            return;
        }

        postData(CONFIG.API.LOGIN, data)
            .then(d => {
                if (d.success) {
                    alert('Chào mừng ' + d.user.full_name);

                    localStorage.setItem('user', JSON.stringify(d.user));

                    window.closeModal('login-modal');

                    checkLoginState();
                } else {
                    alert(d.message);
                }
            })
            .catch(err => alert('Lỗi đăng nhập: ' + err));
    };

    // Xử lý Đăng Ký
    window.handleRegister = function () {
        const data = {
            fullName: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-pass').value
        };

        if (!data.fullName || !data.email || !data.password) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        postData(CONFIG.API.REGISTER, data)
            .then(d => {
                alert(d.message);
                if (d.success) window.closeModal('register-modal');
            })
            .catch(err => alert('Lỗi kết nối: ' + err));
    };

    // Xử lý Liên Hệ
    window.handleContact = function () {
        const data = {
            fullName: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            message: document.getElementById('contact-msg').value
        };
        postData(CONFIG.API.CONTACT, data)
            .then(d => { alert(d.message); window.closeModal('contact-modal'); })
            .catch(err => alert('Lỗi gửi liên hệ.'));
    };

    // Xử lý Ưu Đãi
    window.openOffers = function () {
        window.openModalById('offers-modal');
        const list = document.getElementById('offers-list');
        list.innerHTML = '<p style="text-align:center">Đang tải...</p>';

        fetch(CONFIG.API.OFFERS)
            .then(res => res.json())
            .then(data => {
                list.innerHTML = '';
                if (!data || data.length === 0) { list.innerHTML = '<p style="text-align:center">Hiện chưa có ưu đãi nào.</p>'; return; }
                data.forEach(o => {
                    const imgUrl = o.image_url || 'https://via.placeholder.com/300x120?text=No+Image';

                    list.innerHTML += `
                    <div class="hotel-card" style="padding:15px; border:1px dashed #d4af37; margin-bottom:10px;">
                        <img src="${imgUrl}" style="width:100%; height:120px; object-fit:cover; border-radius:4px" onerror="this.src='https://via.placeholder.com/300x120'">
                        <h3 style="margin-top:10px; font-size:18px">${o.title}</h3>
                        <p style="font-size:14px; color:#555">${o.description}</p>
                        <div style="margin-top:10px;">
                            <strong style="background:#d4af37; color:white; padding:5px 10px; border-radius:4px;">CODE: ${o.discount_code}</strong>
                        </div>
                    </div>`;
                });
            })
            .catch(() => list.innerHTML = '<p style="text-align:center; color:red">Lỗi tải ưu đãi.</p>');
    };

    // 6. Lịch Sử Đặt Phòng (SỬA LẠI PHẦN NÀY ĐỂ HIỆN GIÁ ĐÚNG)
    window.openHistoryModal = function () {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(m => m.style.display = 'none');
        window.openModalById('history-modal');
    }

    window.viewMyBookings = function () {
        const phone = document.getElementById('history-phone-input').value.trim();
        const listDiv = document.getElementById('booking-history-list');

        if (!phone) {
            alert("Vui lòng nhập số điện thoại!");
            return;
        }

        listDiv.innerHTML = '<p style="text-align:center">⏳ Đang tìm kiếm...</p>';

        fetch(`/api/user-bookings?phone=${phone}`)
            .then(res => {
                if (!res.ok) throw new Error('Lỗi phản hồi từ server');
                return res.json();
            })
            .then(data => {
                listDiv.innerHTML = '';
                if (data.length === 0) {
                    listDiv.innerHTML = `<p style="text-align:center; color:red">Không tìm thấy đơn nào với SĐT: <b>${phone}</b></p>`;
                    return;
                }

                data.forEach(item => {
                    const checkIn = new Date(item.check_in_date).toLocaleDateString('vi-VN');
                    const checkOut = new Date(item.check_out_date).toLocaleDateString('vi-VN');
                    const created = new Date(item.created_at).toLocaleDateString('vi-VN');
                    const img = item.image_url || CONFIG.DEFAULT_IMG;

                    // Ưu tiên hiển thị total_price (giá thực tế), nếu không có thì lấy price_per_night (giá gốc)
                    let displayPrice = item.total_price ? item.total_price : item.price_per_night;
                    displayPrice = displayPrice ? Number(displayPrice).toLocaleString() : '---';

                    listDiv.innerHTML += `
                        <div style="display:flex; gap:15px; border:1px solid #eee; padding:15px; border-radius:8px; margin-bottom:15px; background:#fff; align-items:center;">
                            <img src="${img}" style="width:80px; height:80px; object-fit:cover; border-radius:6px; box-shadow:0 2px 5px rgba(0,0,0,0.1)">
                            <div style="flex:1">
                                <h4 style="margin:0 0 5px 0; color:#1a1a1a;">${item.hotel_name}</h4>
                                <div style="font-size:13px; color:#555;">
                                    <p><i class="fa-solid fa-calendar-check"></i> <b>${checkIn}</b> - <b>${checkOut}</b></p>
                                    <p><i class="fa-solid fa-user"></i> Khách: ${item.user_name}</p>
                                    <p style="font-size:12px; color:#999; margin-top:3px">Ngày đặt: ${created}</p>
                                </div>
                            </div>
                            <div style="text-align:right;">
                                <span style="background:#e6fffa; color:#00b894; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:bold; border:1px solid #00b894">Thành công</span>
                                <p style="margin-top:8px; font-weight:bold; color:#d4af37; font-size:15px;">${displayPrice} đ</p>
                            </div>
                        </div>`;
                });
            })
            .catch(err => {
                console.error(err);
                listDiv.innerHTML = '<p style="text-align:center; color:red">Lỗi kết nối server!</p>';
            });
    }

    // 7. Hàm ẩn / hiện mật khẩu
    window.togglePassword = function (icon) {
        const wrapper = icon.parentElement;
        const input = wrapper.querySelector('input');
        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    }

    // Khôi phục điểm đến đã tìm lần trước (nếu có)
    const lastDestination = localStorage.getItem('lastDestination');
    if (dom.destInput && lastDestination) {
        dom.destInput.value = lastDestination;
    }

    // Nút cuộn lên đầu trang
    if (dom.scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                dom.scrollTopBtn.style.display = 'block';
            } else {
                dom.scrollTopBtn.style.display = 'none';
            }
        });

        dom.scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    if (dom.searchBtn) dom.searchBtn.addEventListener('click', (e) => { e.preventDefault(); performSearch(); });
    performSearch();

    // Lifestyle Filter Function - Using actual database cities
    window.filterByLifestyle = function (lifestyle) {
        switch (lifestyle) {
            case 'romantic':
                alert('🌹 Đang tìm khách sạn lãng mạn cho cặp đôi...');

                // Fetch all hotels and filter by rating and romantic amenities
                fetch(CONFIG.API.HOTELS)
                    .then(res => res.json())
                    .then(data => {
                        allHotelsData = data;
                        const filtered = data.filter(h => {
                            const rating = h.rating || 4.0;
                            const hasRomanticAmenities = h.amenities && (
                                h.amenities.toLowerCase().includes('spa') ||
                                h.amenities.toLowerCase().includes('hồ bơi') ||
                                h.amenities.toLowerCase().includes('pool') ||
                                h.amenities.toLowerCase().includes('view')
                            );
                            // High-end hotels in romantic cities
                            const romanticCities = ['Đà Nẵng', 'Nha Trang', 'Vũng Tàu'];
                            const inRomanticCity = romanticCities.some(city =>
                                h.city && h.city.includes(city)
                            );
                            return rating >= 4.5 || hasRomanticAmenities || inRomanticCity;
                        });
                        renderHotels(filtered.length > 0 ? filtered : data);
                        scrollToResults();
                    })
                    .catch(err => {
                        console.error('Error fetching hotels:', err);
                        performSearch();
                    });
                break;

            case 'family':
                alert('👨‍👩‍👧‍👦 Đang tìm khách sạn thích hợp cho gia đình...');

                // Fetch all hotels and filter for family-friendly
                fetch(CONFIG.API.HOTELS)
                    .then(res => res.json())
                    .then(data => {
                        allHotelsData = data;
                        const filtered = data.filter(h => {
                            const hasBreakfast = h.amenities && h.amenities.toLowerCase().includes('ăn sáng');
                            const hasParking = h.amenities && (
                                h.amenities.toLowerCase().includes('bãi đỗ') ||
                                h.amenities.toLowerCase().includes('parking')
                            );
                            const affordablePrice = h.price_per_night <= 3000000;
                            // Cities good for families
                            const familyCities = ['Hà Nội', 'TP Hồ Chí Minh', 'Đà Nẵng'];
                            const inFamilyCity = familyCities.some(city =>
                                h.city && h.city.includes(city)
                            );
                            return hasBreakfast || hasParking || affordablePrice || inFamilyCity;
                        });
                        renderHotels(filtered.length > 0 ? filtered : data);
                        scrollToResults();
                    })
                    .catch(err => {
                        console.error('Error fetching hotels:', err);
                        performSearch();
                    });
                break;

            case 'nature':
                alert('🌿 Đang tìm khách sạn gần thiên nhiên...');

                // Search for beach and nature destinations
                if (dom.destInput) {
                    dom.destInput.value = 'Đà Nẵng'; // Beach city
                }
                performSearch();
                scrollToResults();
                break;
        }
    };

    function scrollToResults() {
        const resultsSection = document.getElementById('results');
        if (resultsSection) {
            setTimeout(() => {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
    }
});