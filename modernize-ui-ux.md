# Kế hoạch Hiện đại hoá & Tinh tế Giao diện Toàn hệ thống (UI/UX Modernization Plan)

## 🎯 Định hướng Nghệ thuật & Trải nghiệm (Art Direction & UX Philosophy)
Dựa trên nguyên lý **Anti-Slop Frontend** (`@design-taste-frontend`), **UI/UX Intelligence** (`@ui-ux-pro-max`) và yêu cầu cụ thể của bạn:
1. **Hiện đại, Gọn gàng (Modern & Tidy)**:
   - Chuẩn phong cách **Linear / Raycast Precision**: Đường viền hairline siêu mảnh `1px`, mặt phẳng flat sang trọng, không bóng đổ dày cộp hay dải màu gradient sến súa.
   - "Màu sắc đặt vào dữ liệu, không đặt vào khung viền" (*Colour goes on data, not chrome*).
   - Bộ số liệu KPI thuần typography (font chữ đậm tự tin, con số rõ ràng, nhãn phụ trau chuốt, loại bỏ các icon nằm trong ô tròn sặc sỡ kiểu template cũ).
   - Monospace chính xác cho mã SKU, mã phiếu sửa chữa, số tiền VNĐ và số IMEI/Serial.
2. **Hiệu ứng Animation Độc đáo & Thân thiện (Subtle, Delightful Micro-interactions)**:
   - **Tactile Click/Press**: Nút bấm và thẻ sản phẩm có hiệu ứng nhấn nhẹ (`active:scale-[0.98] transition-all duration-150`).
   - **Live Pulse Indicator**: Chấm trạng thái phát sáng nhịp tim (`animate-pulse`) cho các phiếu sửa chữa đang chạy thời gian thực.
   - **Sleek Drawer & Tabs**: Hiệu ứng chuyển tab mượt mà với thanh chỉ báo trượt, giỏ hàng POS trượt mở êm ái.
   - **Interactive Hover Glow**: Viền sáng tinh tế khi hover qua thẻ linh kiện hoặc hàng dữ liệu.
3. **Mật độ Thông tin Cao (High Density)**:
   - Padding được nén gọn chuẩn quầy kỹ thuật, hiển thị nhiều thông tin trên cùng 1 màn hình mà không cần cuộn nhiều.
   - Phím tắt nhanh (`kbd`), tìm kiếm tức thì `Ctrl+K`.

---

## 📋 Các giai đoạn triển khai (Phased Implementation)

### Giai đoạn 1: Hệ thống Design Tokens & CSS Micro-Animations
- Cập nhật `src/app/globals.css`:
  - Thêm animation keyframes: `subtle-bounce`, `pulse-glow`, `scale-tap`, `shimmer`.
  - Tinh chỉnh palette: Tương phản cao cho Dark & Light mode, viền hairline sắc nét `oklch`.

### Giai đoạn 2: App Header & Workstation Navigation Bar
- Tinh chỉnh `src/components/app-header.tsx`:
  - Thanh header hiện đại với logo icon cách điệu tinh xảo, tab điều hướng dạng pill gọn gàng với hiệu ứng hover mượt.
  - Ticker phiếu sửa chữa đang chờ với badge phát sáng thời gian thực (`live indicator`).
  - Menu cá nhân và tìm kiếm toàn cục `Ctrl+K` sắc sảo.

### Giai đoạn 3: Màn hình Bán lẻ & Thao tác POS (`/pos`)
- Nâng cấp `src/app/(app)/pos/pos-client.tsx` & `src/app/(app)/pos/workspace-client.tsx`:
  - Tab workspace chuyển đổi giữa các đơn bán hàng nhanh với dirty state badge.
  - Lưới linh kiện mật độ cao, chip danh mục trượt ngang mượt mà, nút thêm nhanh vào giỏ dạng tactile button.
  - Drawer giỏ hàng và thanh toán: Tự động tính toán chiết khấu, gợi ý tiền mặt, VietQR động, và in hoá đơn tức thì.

### Giai đoạn 4: Hub Tiếp nhận Sửa chữa & Thiết bị (`/service` & `/service/[id]`)
- Nâng cấp `src/app/(app)/service/page.tsx`:
  - Thanh lọc pipeline trực quan: Tiếp nhận → Chẩn đoán → Đang sửa → Chờ trả → Đã giao.
  - Thẻ phiếu sửa chữa dạng Compact Workstation Card: Hiển thị ngay model thiết bị, tên khách, tình trạng, KTV phụ trách và thời gian tiếp nhận.
  - Form tiếp nhận `service-form.tsx`: Khảo sát nhanh ngoại quan máy, phụ kiện, mật khẩu mở khoá màn hình và báo giá dự kiến.

### Giai đoạn 5: Dashboard Trung tâm (`/dashboard`)
- Nâng cấp `src/app/(app)/dashboard/page.tsx`:
  - Biến đổi khối KPI theo chuẩn Linear: Loại bỏ icon đóng hộp màu, dùng thanh số liệu thuần typography sắc bén và hairlines phân cách.
  - Biểu đồ doanh thu 30 ngày Recharts với gradient fill tối giản và tooltip hover nổi.
  - Bảng cảnh báo tồn kho sắp hết & danh sách máy cần bàn giao trong ngày.

### Giai đoạn 6: Quản lý Kho & Khách hàng (`/products`, `/customers`, `/sales`)
- Nâng cấp bảng linh kiện với thanh hiển thị mức tồn kho an toàn (`Stock Meter`).
- Danh bạ khách hàng với Avatar chữ cái theo mã màu cố định, nút gọi/nhắn nhanh và lịch sử sửa chữa.

### Giai đoạn 7: Kiểm thử, Build & Đo lường
- Chạy `npx tsc --noEmit` và kiểm tra giao diện trực tiếp trên trình duyệt.
