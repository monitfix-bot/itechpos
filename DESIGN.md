---
name: Industrial Precision
version: 1.0.0
description: Design tokens and visual rationale for TechShop POS & Repair Service Management System.
colors:
  # Base Backgrounds & Surfaces
  background: "#F8FAFC"
  foreground: "#0F172A"
  surface: "#FFFFFF"
  surface-muted: "#F1F5F9"
  surface-hover: "#E2E8F0"
  
  # Borders & Dividers
  border: "#CBD5E1"
  border-subtle: "#E2E8F0"
  border-strong: "#94A3B8"
  
  # Brand & Primary (Precision Cobalt)
  primary: "#1D4ED8"
  primary-hover: "#1E40AF"
  primary-foreground: "#FFFFFF"
  primary-subtle: "#EFF6FF"
  
  # Secondary / Steel Gray
  secondary: "#334155"
  secondary-hover: "#1E293B"
  secondary-foreground: "#F8FAFC"
  
  # Accent & Hardware Alerts (Technical Amber)
  accent: "#D97706"
  accent-hover: "#B45309"
  accent-foreground: "#FFFFFF"
  accent-subtle: "#FEF3C7"
  
  # Semantic States
  success: "#059669"
  success-foreground: "#FFFFFF"
  success-subtle: "#D1FAE5"
  
  warning: "#D97706"
  warning-foreground: "#FFFFFF"
  warning-subtle: "#FEF3C7"
  
  destructive: "#DC2626"
  destructive-foreground: "#FFFFFF"
  destructive-subtle: "#FEE2E2"
  
  info: "#0284C7"
  info-foreground: "#FFFFFF"
  info-subtle: "#E0F2FE"

typography:
  font-sans: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  font-mono: "var(--font-mono), 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace"
  h1:
    fontSize: "24px"
    fontWeight: "700"
    lineHeight: "1.25"
  h2:
    fontSize: "20px"
    fontWeight: "600"
    lineHeight: "1.3"
  h3:
    fontSize: "16px"
    fontWeight: "600"
    lineHeight: "1.4"
  body:
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1.5"
  caption:
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "1.4"
  code:
    fontSize: "13px"
    fontWeight: "600"
    fontFamily: "{typography.font-mono}"

rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"

spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"

components:
  card:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border-subtle}"
    rounded: "{rounded.lg}"
    shadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "36px"
  table-header:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.secondary}"
    fontSize: "12px"
    fontWeight: "600"
---

# TechShop Design System — Industrial Precision

## 1. Overview
Hệ thống thiết kế giao diện dành riêng cho phần mềm quản lý cửa hàng bán lẻ và trạm dịch vụ sửa chữa phần cứng Laptop & Điện thoại (**TechShop POS**).
Định hướng thiết kế: **Industrial Precision / Workshop Pro** — Đề cao tính chính xác kỹ thuật, khả năng thao tác tốc độ cao, hiển thị dữ liệu mật độ cao nhưng rành mạch, chống nhầm lẫn cho kỹ thuật viên và thu ngân.

## 2. Màu sắc chủ đạo (Color Palette)
- **Primary (Cobalt Blue - `#1D4ED8`)**: Màu nhấn hành động chính, nút tạo đơn, chốt thanh toán, lưu tiếp nhận máy. Tạo cảm giác tin cậy, chuẩn mực công nghệ cao.
- **Hardware Warning / Active State (Technical Amber - `#D97706`)**: Dùng cho các cảnh báo phần cứng, đơn chờ kiểm tra, ca sửa chữa đang chẩn đoán hoặc chờ linh kiện.
- **Surface & Steel (Slate/Graphite - `#0F172A`, `#334155`, `#F8FAFC`)**: Nền phân tầng rõ nét, khung viền cơ khí sắc cạnh, loại bỏ hoàn toàn các dải màu tím AI (Purple Ban).
- **Trạng thái phiếu sửa chữa (Service Status Colors)**:
  - Tiếp nhận (Received): Xanh lam trung tính (`#0284C7`)
  - Đang chẩn đoán (Diagnosing): Vàng hổ phách (`#D97706`)
  - Chờ linh kiện (Waiting Parts): Cam kỹ thuật (`#EA580C`)
  - Đang sửa (Repairing): Xanh dương kỹ thuật (`#2563EB`)
  - Đã sửa xong (Completed): Xanh lá chuẩn (`#059669`)
  - Đã giao / Đã trả máy (Delivered): Xám chì (`#475569`)
  - Hủy / Báo trả (Cancelled): Đỏ cảnh báo (`#DC2626`)

## 3. Typography & Data Density
- **Font chữ chính**: `Geist Sans` / System Sans-serif — rõ ràng, khoảng cách ký tự chặt chẽ, tối ưu đọc lướt nhanh trên màn hình cảm ứng hoặc desktop 1080p+.
- **Font mã số & tiền tệ**: `Geist Mono` / JetBrains Mono — áp dụng cho Mã phiếu (SC-xxxx, HD-xxxx), số IMEI/Serial, giá tiền tệ (VNĐ), số tồn kho. Đảm bảo các con số căn thẳng cột trong bảng biểu.
- **Mật độ thông tin**: Giao diện được thiết kế theo cấu trúc `compact-pro` — giảm khoảng đệm thừa thãi, tối đa hóa diện tích hiển thị danh sách linh kiện và giỏ hàng.

## 4. Layout & Navigation
- **Header thanh thoát**: Header cố định phía trên hiển thị logo cửa hàng, thanh tìm kiếm toàn cục (Global Quick Search bằng phím tắt `Ctrl+K`), Ticker đếm phiếu sửa chữa đang chờ xử lý, nút truy cập nhanh POS / Nhận máy và thông tin ca làm việc.
- **Khu vực làm việc POS (Workspace)**: Thiết kế hỗ trợ đa tab làm việc đồng thời (mở nhiều đơn bán hàng hoặc tiếp nhận máy cùng lúc), không bị mất trạng thái khi chuyển đổi.
- **Trạm sửa chữa (Service Hub)**: Phân chia rõ ràng giữa danh sách tiếp nhận, bảng thông số kiểm tra ngoại quan máy (vỏ, màn hình, bàn phím, mật khẩu) và nhật ký sửa chữa.

## 5. Do's and Don'ts
- **DO**: Luôn dùng định dạng tiền tệ có phân cách hàng nghìn rõ ràng và mã số bằng font monospace.
- **DO**: Giữ độ tương phản cao giữa chữ và nền (WCAG AA/AAA).
- **DON'T**: Không sử dụng màu tím chuyển sắc (Purple Ban).
- **DON'T**: Không ẩn các nút chức năng cốt lõi (như In phiếu, Lưu đơn) trong các menu đa cấp khó tìm.
