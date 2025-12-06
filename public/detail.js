document.addEventListener('DOMContentLoaded', () => {
    // 1. Lấy ID từ URL (Ví dụ: detail.html?id=5)
    const params = new URLSearchParams(window.location.search);
    const hotelId = params.get('id');
    const DEFAULT_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945';

    if (!hotelId) {
        alert("Không tìm thấy khách sạn!");
        window.location.href = "/";
    }

    // 2. Gọi API lấy dữ liệu
    fetch(`/api/hotels/${hotelId}`)
        .then(res => res.json())
        .then(hotel => {
            // Điền dữ liệu vào HTML
            document.getElementById('hotel-name').innerText = hotel.name;
            document.getElementById('hotel-address').innerText = hotel.address || hotel.city;
            document.getElementById('hotel-desc').innerText = hotel.description;
            
            const price = Number(hotel.price_per_night).toLocaleString() + ' VND';
            document.getElementById('hotel-price').innerText = price;
            document.getElementById('total-price').innerText = price; // Tạm tính 1 đêm
            
            document.getElementById('hotel-img').src = hotel.image_url || DEFAULT_IMG;
            document.getElementById('current-hotel-id').value = hotel.hotel_id;

            // Xử lý tiện ích (Nếu có)
            const amenitiesDiv = document.getElementById('hotel-amenities');
            amenitiesDiv.innerHTML = '';
            if (hotel.amenities) {
                hotel.amenities.split(',').forEach(item => {
                    amenitiesDiv.innerHTML += `
                        <div style="background:#f4f4f9; padding:5px 10px; border-radius:5px; border:1px solid #eee; font-size:13px">
                            <i class="fa-solid fa-check" style="color:#C5B000"></i> ${item}
                        </div>`;
                });
            }
        })
        .catch(err => {
            console.error(err);
            alert("Lỗi tải dữ liệu!");
        });

    // 3. Hàm xử lý đặt phòng
    window.submitBooking = function() {
        // Kiểm tra trạng thái đăng nhập
        if (!window.isLoggedIn) {
            alert('Vui lòng đăng nhập để đặt phòng.');
            window.location.href = '/'; // Quay về trang chủ để đăng nhập
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
            alert("Vui lòng điền đầy đủ thông tin nhận phòng!");
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
            if (d.success) window.location.href = '/'; // Thành công thì về trang chủ
        })
        .catch(err => alert("Lỗi kết nối server"));
    }
});