# Kế hoạch Thiết kế lại Giao diện Toàn bộ Hệ thống — TechShop POS

> **Định hướng thiết kế**: Industrial Precision / Workshop Pro  
> **Tài liệu đặc tả**: [`DESIGN.md`](./DESIGN.md)  
> **Người thực hiện**: Frontend Architect Specialist & UI/UX Pro Max  

---

## 🎯 Mục tiêu
Nâng cấp toàn bộ trải nghiệm người dùng và thẩm mỹ giao diện hệ thống TechShop POS (Sửa chữa & Bán hàng Laptop / Điện thoại) sang phong cách **Industrial Precision**:
1. Tối ưu tốc độ thao tác cho nhân viên bán hàng (POS) và kỹ thuật viên sửa chữa (Service Hub).
2. Chuẩn hóa hệ thống Design Tokens (Màu sắc, Typography, Spacing, Borders, Card, Tables, Status Badges).
3. Đảm bảo hiển thị dữ liệu mật độ cao, số liệu và mã phiếu sắc nét, dễ quan sát từ xa.
4. Giữ vững 100% độ tin cậy: Không gây lỗi logic nghiệp vụ, giữ tương thích TypeScript và Next.js 16 build.

---

## 📋 Lộ trình thực hiện chi tiết (Phasing Breakdown)

### Phase 1: Nền tảng Design Tokens & Cấu hình Styles
- [x] Tạo file chuẩn thiết kế [`DESIGN.md`](./DESIGN.md).
- [ ] Cập nhật [`src/app/globals.css`](./src/app/globals.css):
  - Định nghĩa biến CSS theo phong cách Industrial Precision (Cobalt `#1D4ED8`, Slate `#0F172A`/`#1E293B`, Amber `#D97706`).
  - Thiết lập font số monospace cho mã hóa đơn/tiền tệ.
  - Tối ưu hóa các lớp tiện ích: viền sắc nét, độ đổ bóng tinh tế.
- [ ] Tối ưu hóa UI Primitives cơ sở trong [`src/components/ui/`](./src/components/ui):
  - `button.tsx`: Độ nảy, viền tinh tế, kích thước chuẩn.
  - `badge.tsx`: Trạng thái sửa chữa và tồn kho tương phản cao.
  - `card.tsx`, `input.tsx`, `table.tsx`: Mật độ hiển thị cao (high-density compact view).

### Phase 2: Thanh điều hướng & Khung ứng dụng toàn cục (Global Shell)
- [ ] Nâng cấp [`src/components/app-header.tsx`](./src/components/app-header.tsx):
  - Thanh header cơ khí tinh gọn, logo cửa hàng chuyên nghiệp.
  - Tích hợp thanh tìm kiếm toàn cục (Global Quick Search) trực quan.
  - Ticker cảnh báo số phiếu sửa chữa đang chờ xử lý với badge phát sáng tinh tế.
  - Menu điều hướng phân nhóm rõ ràng (POS, Tiếp nhận, Kho hàng, Khách hàng, Báo cáo, Cài đặt).
- [ ] Tinh chỉnh [`src/app/(app)/layout.tsx`](./src/app/(app)/layout.tsx): Giới hạn khung hình responsive mượt mà.

### Phase 3: Phân hệ Dịch vụ & Trạm Sửa chữa (Service Hub)
- [ ] Cải tiến màn hình danh sách phiếu [`src/app/(app)/service/page.tsx`](./src/app/(app)/service/page.tsx):
  - Thanh lọc trạng thái sửa chữa trực quan (Tiếp nhận, Chẩn đoán, Chờ linh kiện, Đang sửa, Xong, Đã trả).
  - Bảng danh sách phiếu sửa chữa hiển thị thông tin thiết bị (Brand, Model, IMEI, Tên khách, Kỹ thuật viên phụ trách, Giá dự kiến, Hẹn trả).
- [ ] Cải tiến form nhận máy [`src/app/(app)/service/service-form.tsx`](./src/app/(app)/service/service-form.tsx):
  - Nhập thông tin khách hàng tự động gợi ý.
  - Checklist kiểm tra ngoại quan máy (Màn hình, Nguồn, Phím, Loa, Vỏ trầy xước, Mật khẩu máy).
  - Báo giá tạm tính & in phiếu nhận tức thì.
- [ ] Tinh chỉnh chi tiết ca sửa chữa [`src/app/(app)/service/[id]/page.tsx`](./src/app/(app)/service/[id]/page.tsx) & Dialog trả máy [`return-dialog.tsx`](./src/app/(app)/service/[id]/return-dialog.tsx).

### Phase 4: Phân hệ Bán hàng POS & Đa tab Workspace
- [ ] Cải tiến Workspace đa tab [`src/app/(app)/pos/workspace-client.tsx`](./src/app/(app)/pos/workspace-client.tsx):
  - Tab bar kiểu trình duyệt kỹ thuật sắc sảo, cho phép mở song song nhiều hóa đơn bán và phiếu nhận máy.
  - Đánh dấu trạng thái có thay đổi chưa lưu (dirty indicator).
- [ ] Cải tiến giao diện POS [`src/app/(app)/pos/pos-client.tsx`](./src/app/(app)/pos/pos-client.tsx):
  - Khu vực chọn sản phẩm: Bộ lọc danh mục dạng thẻ xúc giác, ô tìm kiếm nhanh barcode/SKU với phím tắt.
  - Giỏ hàng: Bảng linh kiện rõ nét, tăng giảm số lượng tức thì, chiết khấu linh hoạt.
  - Bảng thanh toán tổng hợp: Hiển thị tiền mặt, quét VietQR động, công nợ khách hàng, nút in hóa đơn nổi bật.

### Phase 5: Quản lý Kho, Khách hàng & Dashboard Quản trị
- [ ] Nâng cấp trang Kho & Sản phẩm ([`src/app/(app)/products/page.tsx`](./src/app/(app)/products/page.tsx), [`src/app/(app)/stock/page.tsx`](./src/app/(app)/stock/page.tsx)).
- [ ] Nâng cấp danh bạ Khách hàng ([`src/app/(app)/customers/page.tsx`](./src/app/(app)/customers/page.tsx)).
- [ ] Nâng cấp Báo cáo & Dashboard ([`src/app/(app)/dashboard/page.tsx`](./src/app/(app)/dashboard/page.tsx), [`src/app/(app)/reports/page.tsx`](./src/app/(app)/reports/page.tsx)).

### Phase 6: Kiểm tra, Tối ưu & Bàn giao
- [ ] Chạy kiểm tra TypeScript `npx tsc --noEmit`.
- [ ] Chạy build Next.js `npm run build` xác nhận không có lỗi phát sinh.
- [ ] Tổng kết và hướng dẫn sử dụng giao diện mới.
