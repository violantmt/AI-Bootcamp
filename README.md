# AI Bootcamp — ThuNTM72 · PB03

Prototype quản lý kho văn phòng phẩm nội bộ, Tier 2. HTML/JavaScript tương tác, API mock và localStorage; dùng dữ liệu giả, không phải production backend/auth/database.

## Chạy demo trên web
GitHub Pages source được chuẩn bị ở `docs/index.html`. Bật trong **Settings → Pages → Build and deployment → Deploy from a branch → main → /docs → Save**. Sau khi deployment hoàn tất, địa chỉ dự kiến:

https://violantmt.github.io/AI-Bootcamp/

Địa chỉ này chỉ hoạt động sau khi Pages được bật và build thành công; việc push source không tự chứng minh site đã live. Nếu repository hoặc tài khoản không cho phép Pages, cần chủ repo xử lý setting/quyền gói phù hợp.

## Source và bài nộp
- Source HTML gốc: [CODEBASE/prototype/MO-DEMO.html](CODEBASE/prototype/MO-DEMO.html).
- Mã nguồn tách module và tests: [CODEBASE/prototype](CODEBASE/prototype).
- [Tải ZIP bài nộp](ThuNTM72_AI-Transformation_PB03_NopBai.zip).
- Mở HTML trên máy: tải ZIP, giải nén rồi mở CODEBASE/prototype/MO-DEMO.html.

## Giới hạn
Role selector là mô phỏng, không chứng minh RBAC/SoD thật. Dữ liệu chỉ lưu trên trình duyệt đang dùng. Không dùng dữ liệu bí mật hoặc tồn kho thật. Các test production/concurrency/storage failure mở rộng còn Not Tested như hồ sơ bài nộp; không đổi trạng thái chỉ vì site xuất bản.

`docs/index.html` là bản standalone giống source trong ZIP. Khi sửa source về sau, phải build/copy lại docs để site đồng bộ. Không thay file ZIP đã nộp nếu chưa tạo phiên bản bài nộp mới.
