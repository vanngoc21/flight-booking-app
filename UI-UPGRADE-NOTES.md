# SKYHAVEN UI Upgrade — Luxury + Modern

## Phạm vi
- Client: đồng bộ palette navy/sky/champagne, nền sáng trung tính, màu chữ phụ và viền; tinh chỉnh các thành phần premium dùng chung và style nền web.
- Admin: làm mới theme Ant Design, sidebar, trạng thái menu, topbar, card, bảng, input, nút, modal, phân trang và màn hình đăng nhập theo cùng ngôn ngữ thị giác.
- Server: giữ nguyên toàn bộ mã nguồn.

## Nguyên tắc thiết kế
- Navy `#123B5D` làm màu thương hiệu và CTA chính.
- Blue `#2878B9` dùng cho liên kết/trạng thái thông tin.
- Champagne `#E8C27A` dùng tiết chế cho điểm nhấn.
- Canvas `#F7F9FC`, border `#E1EAF1`, muted `#687F91`.
- Bo góc mềm, shadow nhẹ, trạng thái focus rõ ràng và responsive cho màn hình nhỏ.

## Bảo toàn nghiệp vụ
Không sửa route API, controller, model, schema, payment flow, authentication flow hoặc dữ liệu backend. Các thay đổi trong Client giới hạn ở màn hình, component trình bày, theme và CSS; các file service/hook/provider không thuộc giao diện được giữ nguyên.

## Kiểm tra
- Đã đối chiếu file trước/sau từ ZIP gốc để xác nhận không có file nào trong `server/` bị thay đổi.
- Chưa chạy được build TypeScript/Vite hoặc Expo trong môi trường đóng gói này vì dependency chưa có sẵn và npm registry không phản hồi trong thời gian chờ. Cần chạy build/lint trên máy phát triển sau khi cài dependency.
