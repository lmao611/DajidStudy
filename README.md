# 🌟 DajidStudy — Không Gian Cá Nhân & Nền Tảng Học Tập Tu Luyện

[![React](https://img.shields.io/badge/React-18.3-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg?logo=express)](https://expressjs.com/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-S3_Compatible-F38020.svg?logo=cloudflare)](https://developers.cloudflare.com/r2/)
[![Offline First](https://img.shields.io/badge/Storage-Offline_First-green.svg)]()

> **DajidStudy** là không gian số cá nhân độc đáo, kết hợp hài hòa giữa **Portfolio / Giới thiệu bản thân**, **Hệ thống Quản lý Thời khóa biểu & Mục tiêu học tập**, cùng **Nền tảng Luyện Từ vựng Thông minh** tích hợp cơ chế **Gamification Tu Luyện Cảnh Giới & Xếp Hạng Phong Cách DMC5 (Devil May Cry 5)**.

---

## 📑 Mục Lục
- [🌟 Điểm Nhấn & Tính Năng Nổi Bật](#-điểm-nhấn--tính-năng-nổi-bật)
- [🥋 Hệ Thống Tu Luyện Cảnh Giới & Xếp Hạng DMC5](#-hệ-thống-tu-luyện-cảnh-giới--xếp-hạng-dmc5)
- [🛠️ Công Nghệ Sử Dụng (Tech Stack)](#️-công-nghệ-sử-dụng-tech-stack)
- [📁 Cấu Trúc Thư Mục Chuẩn](#-cấu-trúc-thư-mục-chuẩn)
- [🚀 Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
- [⚙️ Cấu Hình Môi Trường (.env)](#️-cấu-hình-môi-trường-env)
- [💻 Lệnh Hỗ Trợ Developer (Dev Console Commands)](#-lệnh-hỗ-trợ-developer-dev-console-commands)
- [📜 Giấy Phép & Tác Quyền](#-giấy-phép--tác-quyền)

---

## 🌟 Điểm Nhấn & Tính Năng Nổi Bật

### 1. 🌓 Giao Diện Kép (Dual Theme Sáng / Tối Chuẩn Mực)
- **Độc lập hoàn toàn:** Chế độ Tối (Dark Theme) và Chế độ Sáng (Light Theme) được tách biệt tỉ mỉ, không xảy ra hiện tượng đè nền hay sai lệch màu sắc.
- **Icon Sáng/Tối Frameless (Không Khung):** Nút chuyển đổi giao diện trên Navbar dạng tối giản không viền hộp, icon Mặt Trời ☀️ (vàng neon hổ phách, xoay 360° vô tận) và Mặt Trăng 🌙 (ánh chàm huyền ảo, nghiêng góc đàn hồi khi hover).
- **Nền Lưới Chấm (Dot Grid) & Hào Quang Dọc:** Nền web trang bị lưới chấm xuyên suốt với mặt nạ mờ dần 2 biên (`linear-gradient mask`) cùng 2 dải hào quang kéo dài theo chiều dọc hông web (`h-[85vh]`).
- **Dải Chữ Chân Banner:** Chân Hero Banner sở hữu dải chữ nối tiếp nhau chạy vô tận qua bên phải:
  $$\text{Vui Vẻ} \quad - \quad \text{Học Hỏi} \quad - \quad \text{Sáng Tạo} \quad - \quad \text{Tò Mò} \quad - \quad \text{Năng Động} \quad - \quad \dots$$

### 2. 📅 Quản Lý Lịch Trình & Mục Tiêu Cá Nhân (Schedule & Goals)
- **Lập kế hoạch đa năng:** Phân loại ca học theo chủ đề: *Coding, Ngoại ngữ, Đại học, Thể dục, Tự học...*
- **Bộ lọc thông minh:** Lọc theo ngày trong tuần, trạng thái (chờ thực hiện, đã hoàn thành), tự động đếm tiến độ và tính tỷ lệ hoàn thành trực quan.
- **Mục tiêu ngắn hạn & dài hạn:** Thêm/sửa/xóa mục tiêu kèm nhãn theo dõi linh hoạt ngay tại trang chủ.

### 3. 📚 Luyện Từ Vựng Thông Minh (SRS Flashcard & Typing)
- **Flashcard 3D 2 Mặt Sống Động:** Hiệu ứng lật không gian 3 chiều mượt mà. Mặt trước hiển thị từ vựng, phiên âm chuẩn IPA, loại từ và độ khó; mặt sau hiển thị định nghĩa, ví dụ ngữ cảnh thực tế.
- **Chế Độ Luyện Gõ Từ (Typing Mode):** Tương tác gõ phím luyện nhớ từ vựng với hệ thống đánh giá tức thì, gợi ý thông minh và phím tắt tiện lợi.
- **Chế Độ Danh Sách (List Mode):** Tìm kiếm thời gian thực, lọc theo chủ đề, lọc trạng thái (Đang học / Đã thuộc).
- **Thuật Toán Lặp Lại Ngắt Quãng (SRS):** Tính toán độ ghi nhớ dựa trên đánh giá người dùng (Quên, Khó, Nhớ, Dễ) để phân bổ thời gian ôn tập tối ưu.
- **Kiểm Tra Trắc Nghiệm:** Bài test từ vựng tính giờ, cộng điểm thưởng Spirit Energy (SE) khi làm đúng.

### 4. 🖼️ Widget "Bức Ảnh Của Ngày" (Image of the Day) & Mood Tracker
- Khung ảnh kỷ niệm hỗ trợ xem ảnh toàn màn hình, lịch sử ảnh, chụp ảnh nhanh hoặc tải ảnh lên.
- Tích hợp ghi nhận trạng thái cảm xúc theo ngày (Mood / Emotion Tracker).

---

## 🥋 Hệ Thống Tu Luyện Cảnh Giới & Xếp Hạng DMC5

DajidStudy tích hợp sâu cơ chế trò chơi hóa (Gamification) nhằm biến việc học thành một hành trình tu tiên đột phá đầy hào hứng:

```text
               ╔═══════════════════════════════════════════╗
               ║       14 ĐẠI CẢNH GIỚI TU LUYỆN           ║
               ╠═══════════════════════════════════════════╣
               ║  1. Đấu Chi Khí      (0 SE)               ║
               ║  2. Đấu Giả          (2,000 SE)           ║
               ║  3. Đấu Sư          (6,000 SE)           ║
               ║  4. Đại Đấu Sư      (12,000 SE)          ║
               ║  5. Đấu Linh         (20,000 SE)          ║
               ║  6. Đấu Vương        (30,000 SE)          ║
               ║  7. Đấu Hoàng        (43,000 SE)          ║
               ║  8. Đấu Tông         (60,000 SE)          ║
               ║  9. Đấu Tôn          (82,000 SE)          ║
               ║  10. Đấu Thánh       (110,000 SE)         ║
               ║  11. Đấu Đế          (145,000 SE)         ║
               ║  12. Địa Chí Tôn     (190,000 SE)         ║
               ║  13. Thiên Chí Tôn   (250,000 SE)         ║
               ║  14. Chúa Tể Cảnh    (330,000 SE) ★       ║
               ╚═══════════════════════════════════════════╝
```

### ✨ Hoạt Họa Đóng Dấu DMC5 Kích Hoạt Khi Cuộn Tới (Scroll-Triggered)
- **Cảnh Giới Tu Luyện (Vocabulary Realm Badge):** Áp dụng hiệu ứng `dmcRankingStamp` giáng mạnh từ kích thước `scale(2.3)` xuống kèm chớp sáng linh khí xanh dương, sau đó tiếp nối hiệu ứng bồng bềnh `rankBadgeFloat`. Khi thử nghiệm các mốc cảnh giới mới, huy hiệu tự động đập xuống tái hiện cảm giác đột phá.
- **Cường Độ Học 5 Ngày (5-Day Activity DMC5 Rank):** Đo lường tổng số từ và điểm SE trong 5 ngày qua (Hạng D, C, B, A, S, SS, SSS).
- **Chuỗi Ngày Học (Streak Rank DMC5):** Đóng dấu trên nền lửa cam bập bùng theo chuỗi ngày học bền bỉ.
- **Bộ Lắng Nghe Cuộn (In-View Observer):** Hoạt họa chỉ kích hoạt **khi người dùng thực sự cuộn tới vị trí của huy hiệu** trong khung hồ sơ, chống giật layout và tạo ấn tượng thị giác tối đa.
- **Tính Năng Trọng Tu:** Cho phép phế bỏ toàn bộ tu vi hiện tại để tu luyện lại từ đầu nếu muốn thử thách bản thân.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Lớp (Layer) | Công nghệ chính | Mục đích / Tính năng |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18** + **Vite 5** | Render component hiệu năng cao, HMR cực nhanh |
| **Styling & Effects** | **Tailwind CSS 3** + Custom CSS | Giao diện Responsive, kính mờ Glassmorphism, 3D Transform |
| **Icons & Visuals** | **Lucide React** + **Canvas Confetti** | Icon vector sắc nét, hiệu ứng pháo hoa khi đột phá |
| **Cloud Storage** | **Cloudflare R2** (`@aws-sdk/client-s3`) | Lưu trữ Avatar đám mây, băm SHA-256 chống trùng lặp file |
| **State Management** | **Zustand / Custom React Store** | Quản lý state toàn cục, tự động cache `localStorage` |
| **Backend (Tùy chọn)** | **Node.js** + **Express.js** | RESTful API (Profile, Schedules, Vocabularies) |
| **Logging & Middleware** | **Morgan**, **CORS**, **Dotenv** | Ghi log request, bảo mật nguồn gốc, nạp biến môi trường |

---

## 📁 Cấu Trúc Thư Mục Chuẩn

```text
DajidStudy/
├── frontend/                               # Ứng dụng Frontend (React + Vite)
│   ├── public/                             # Tài nguyên tĩnh
│   │   ├── ranking/                        # 14 Huy hiệu Cảnh Giới Tu Luyện
│   │   ├── rating/                         # Huy hiệu DMC5 (D, C, B, A, S, SS, SSS)
│   │   ├── avt.jpg                         # Ảnh đại diện mặc định
│   │   └── logo.svg                        # Logo DajidStudy
│   ├── src/
│   │   ├── components/                     # Các UI Components tái sử dụng
│   │   │   ├── Navbar.jsx                  # Thanh điều hướng, Theme toggle, Avatar
│   │   │   ├── ProfileRankModal.jsx        # Modal Hồ sơ cá nhân & Cảnh giới DMC5
│   │   │   ├── ImageOfTheDay.jsx           # Widget bức ảnh của ngày & bộ sưu tập
│   │   │   ├── EmotionState.jsx            # Widget theo dõi cảm xúc
│   │   │   └── CountUp.jsx                 # Hiệu ứng số nhảy mượt mà
│   │   ├── pages/                          # Các trang ứng dụng
│   │   │   ├── Home.jsx                    # Trang chủ, Hero Banner, Giới thiệu & Mục tiêu
│   │   │   ├── Schedule.jsx                # Quản lý thời khóa biểu & ca học
│   │   │   └── Vocabulary.jsx              # Flashcard 3D, Luyện gõ, Kiểm tra từ vựng
│   │   ├── services/                       # Tầng giao tiếp ngoại vi
│   │   │   ├── api.js                      # Kết nối Express Backend API
│   │   │   └── r2Storage.js                # Tải file lên Cloudflare R2 Bucket
│   │   ├── stores/                         # Quản lý State tập trung
│   │   │   └── studyStore.jsx              # Store chính (Profile, Schedule, Vocab, History)
│   │   ├── utils/                          # Hàm tiện ích tính toán
│   │   │   └── testScoring.js              # Thuật toán tính Cảnh giới SE & Hạng DMC5
│   │   ├── App.jsx                         # Shell ứng dụng & background halos
│   │   ├── main.jsx                        # React entry point
│   │   └── index.css                       # Tailwind layers & Keyframe animations
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                                # REST API Server (Express.js)
│   ├── controller/                         # Xử lý business logic các endpoint
│   ├── routes/                             # Định tuyến REST API
│   ├── lib/                                # Kết nối Database & Helper response
│   ├── model/                              # Mô hình dữ liệu (Profile, Schedule, Vocab)
│   ├── server.js                           # Express App entry point
│   └── package.json
│
├── package.json                            # Điều khiển chung toàn bộ workspace
└── README.md                               # Tài liệu hướng dẫn dự án
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
- **Node.js**: Phiên bản `>= 18.0.0`
- **npm** hoặc **yarn** / **pnpm**

---

### Cách 1: Chạy Nhanh Frontend (Khuyến Nghị)
Ứng dụng được thiết kế theo triết lý **Offline-First**, tự động nạp sẵn dữ liệu mẫu vào `localStorage`. Bạn có thể trải nghiệm đầy đủ mọi chức năng mà không bắt buộc phải bật backend:

```bash
# 1. Đi vào thư mục frontend
cd frontend

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Khởi chạy máy chủ phát triển
npm run dev
```
Mở trình duyệt tại: [http://localhost:5173](http://localhost:5173)

---

### Cách 2: Chạy Đồng Thời Cả Frontend & Backend

1. **Khởi chạy Backend Server:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   > Backend sẽ lắng nghe tại: `http://localhost:5000` (Kiểm tra sức khỏe tại `http://localhost:5000/api/health`).

2. **Khởi chạy Frontend (ở Terminal mới):**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Hoặc chạy từ thư mục gốc:**
   ```bash
   npm run dev:frontend
   npm run dev:backend
   ```

---

## ⚙️ Cấu Hình Môi Trường (.env)

Nếu bạn muốn cấu hình Backend API tùy biến hoặc kích hoạt **Cloudflare R2** để lưu trữ Avatar online, hãy tạo file `frontend/.env.local`:

```env
# URL kết nối Backend API (Mặc định: http://localhost:5000/api)
VITE_API_BASE_URL=http://localhost:5000/api

# Cấu hình Cloudflare R2 Storage (Tùy chọn)
VITE_R2_ACCOUNT_ID=your_cloudflare_account_id
VITE_R2_ACCESS_KEY_ID=your_r2_access_key_id
VITE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
VITE_R2_BUCKET_NAME=dajidstudy-bucket
VITE_R2_PUBLIC_URL=https://pub-your-bucket.r2.dev
```

> **Lưu ý:** Khi chưa cấu hình R2, ứng dụng sẽ tự động chuyển sang lưu trữ Avatar bằng Base64 trực tiếp trong `localStorage` mà không phát sinh lỗi.

---

## 💻 Lệnh Hỗ Trợ Developer (Dev Console Commands)

Trong quá trình phát triển hoặc kiểm thử giao diện, bạn có thể mở **F12 Console** trên trình duyệt và gõ các lệnh nhanh sau:

| Lệnh Console | Chức năng |
| :--- | :--- |
| `window.setSE(50000)` | Đặt nhanh điểm Spirit Energy (SE) lên 50,000 để xem hiệu ứng Cảnh giới Đấu Tông. |
| `window.setSE(330000)` | Đạt ngay cảnh giới tối cao **Chúa Tể Cảnh** (330k SE). |
| `window.resetSE()` | Khôi phục điểm SE ban đầu của tài khoản. |
| `window.resetProgress()` | Khởi tạo lại toàn bộ dữ liệu mẫu (Thời khóa biểu, Từ vựng, Cảnh giới). |

---

## 🔨 Lệnh Build Production

```bash
# Kiểm tra & đóng gói ứng dụng cho môi trường Production
cd frontend
npm run build
```
Thư mục xuất bản `frontend/dist` sẵn sàng để triển khai lên **Vercel**, **Netlify**, **Cloudflare Pages** hoặc **Firebase Hosting**.

---

## 📜 Giấy Phép & Tác Quyền

Dự án được xây dựng và duy trì bởi **DajidStudy Team**. 
Mọi ý kiến đóng góp, báo lỗi hoặc yêu cầu tính năng vui lòng liên hệ qua email hoặc tạo Issue trong repository.

*Chúc đạo hữu học tập vui vẻ, sớm ngày đột phá đỉnh phong cảnh giới! 🚀*
