-- PostgreSQL: tài liệu thiết kế Tier 2, không phải DB đang chạy.
CREATE TABLE products (id text PRIMARY KEY, name text NOT NULL, unit text NOT NULL, stock bigint NOT NULL CHECK (stock >= 0));
CREATE TABLE receipts (id text PRIMARY KEY, actor_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE receipt_lines (receipt_id text REFERENCES receipts(id), product_id text REFERENCES products(id), quantity bigint NOT NULL CHECK (quantity > 0), PRIMARY KEY (receipt_id, product_id));
CREATE TABLE audit_events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, receipt_id text REFERENCES receipts(id), actor_id text NOT NULL, action text NOT NULL, created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP);
-- actor_id là trường định danh nội bộ: cần kiểm soát truy cập khi triển khai thật.
-- Cập nhật tồn, phiếu, audit phải cùng transaction ở bản thật; mock chỉ lưu một snapshot localStorage.

-- Bổ sung thiết kế tham khảo v4, chưa chạy DB thật:
ALTER TABLE products ADD COLUMN active boolean NOT NULL DEFAULT true;
CREATE TABLE stock_adjustments (
 id text PRIMARY KEY, product_id text NOT NULL REFERENCES products(id),
 quantity bigint NOT NULL CHECK(quantity>0), reason text NOT NULL,
 status text NOT NULL CHECK(status IN ('pending','approved','rejected')),
 requested_by text NOT NULL, requested_at timestamptz NOT NULL,
 reviewed_by text, reviewed_at timestamptz, review_note text,
 before_stock bigint, after_stock bigint CHECK(after_stock>=0),
 CHECK((status='pending' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR (status<>'pending' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);
-- Bản thật: khóa dòng tồn/đề nghị trong transaction khi duyệt, chỉ cho pending->approved/rejected một lần.
-- Không tự áp schema này vào DB thật trong buổi học.

-- Thiết kế v7 cho bản thật: dùng tombstone để giữ khóa ngoại thay cho DELETE vật lý.
ALTER TABLE products ADD COLUMN deleted_at timestamptz;
ALTER TABLE products ADD COLUMN deleted_by text;
-- Chỉ chọn products.deleted_at IS NULL cho danh mục hiện hành.
-- Xóa nghiệp vụ khi stock=0 đặt deleted_at/deleted_by, đóng đề nghị pending và audit trong cùng transaction.
-- Demo dùng deletedProducts để giữ snapshot tương đương, chưa triển khai SQL thật.
