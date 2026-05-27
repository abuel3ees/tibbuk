CREATE TABLE IF NOT EXISTS "migrations"(
  "id" integer primary key autoincrement not null,
  "migration" varchar not null,
  "batch" integer not null
);
CREATE TABLE IF NOT EXISTS "users"(
  "id" integer primary key autoincrement not null,
  "name" varchar not null,
  "email" varchar not null,
  "email_verified_at" datetime,
  "password" varchar not null,
  "role" varchar not null default 'admin',
  "remember_token" varchar,
  "created_at" datetime,
  "updated_at" datetime,
  "two_factor_secret" text,
  "two_factor_recovery_codes" text,
  "two_factor_confirmed_at" datetime
);
CREATE UNIQUE INDEX "users_email_unique" on "users"("email");
CREATE TABLE IF NOT EXISTS "password_reset_tokens"(
  "email" varchar not null,
  "token" varchar not null,
  "created_at" datetime,
  primary key("email")
);
CREATE TABLE IF NOT EXISTS "sessions"(
  "id" varchar not null,
  "user_id" integer,
  "ip_address" varchar,
  "user_agent" text,
  "payload" text not null,
  "last_activity" integer not null,
  primary key("id")
);
CREATE INDEX "sessions_user_id_index" on "sessions"("user_id");
CREATE INDEX "sessions_last_activity_index" on "sessions"("last_activity");
CREATE TABLE IF NOT EXISTS "cache"(
  "key" varchar not null,
  "value" text not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_expiration_index" on "cache"("expiration");
CREATE TABLE IF NOT EXISTS "cache_locks"(
  "key" varchar not null,
  "owner" varchar not null,
  "expiration" integer not null,
  primary key("key")
);
CREATE INDEX "cache_locks_expiration_index" on "cache_locks"("expiration");
CREATE TABLE IF NOT EXISTS "jobs"(
  "id" integer primary key autoincrement not null,
  "queue" varchar not null,
  "payload" text not null,
  "attempts" integer not null,
  "reserved_at" integer,
  "available_at" integer not null,
  "created_at" integer not null
);
CREATE INDEX "jobs_queue_index" on "jobs"("queue");
CREATE TABLE IF NOT EXISTS "job_batches"(
  "id" varchar not null,
  "name" varchar not null,
  "total_jobs" integer not null,
  "pending_jobs" integer not null,
  "failed_jobs" integer not null,
  "failed_job_ids" text not null,
  "options" text,
  "cancelled_at" integer,
  "created_at" integer not null,
  "finished_at" integer,
  primary key("id")
);
CREATE TABLE IF NOT EXISTS "failed_jobs"(
  "id" integer primary key autoincrement not null,
  "uuid" varchar not null,
  "connection" varchar not null,
  "queue" varchar not null,
  "payload" text not null,
  "exception" text not null,
  "failed_at" datetime not null default CURRENT_TIMESTAMP
);
CREATE INDEX "failed_jobs_connection_queue_failed_at_index" on "failed_jobs"(
  "connection",
  "queue",
  "failed_at"
);
CREATE UNIQUE INDEX "failed_jobs_uuid_unique" on "failed_jobs"("uuid");
CREATE TABLE IF NOT EXISTS "passkeys"(
  "id" integer primary key autoincrement not null,
  "user_id" integer not null,
  "name" varchar not null,
  "credential_id" varchar not null,
  "credential" text not null,
  "last_used_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  foreign key("user_id") references "users"("id") on delete cascade
);
CREATE INDEX "passkeys_user_id_index" on "passkeys"("user_id");
CREATE UNIQUE INDEX "passkeys_credential_id_unique" on "passkeys"(
  "credential_id"
);
CREATE TABLE IF NOT EXISTS "products"(
  "id" integer primary key autoincrement not null,
  "sku" varchar,
  "name" varchar not null,
  "slug" varchar not null,
  "description" text,
  "excerpt" text,
  "price" numeric not null,
  "sale_price" numeric,
  "cost_price" numeric,
  "category" varchar,
  "stock_status" varchar not null default 'in_stock',
  "quantity" integer,
  "featured_image" varchar,
  "is_active" tinyint(1) not null default '1',
  "created_at" datetime,
  "updated_at" datetime,
  "variants" text,
  "allows_engraving" tinyint(1) not null default '0',
  "engraving_price" numeric,
  "allows_stitching" tinyint(1) not null default '0',
  "stitching_price" numeric,
  "allows_sizes" tinyint(1) not null default '0',
  "available_sizes" text,
  "allows_gender" tinyint(1) not null default '0',
  "allows_color" tinyint(1) not null default '0',
  "available_colors" text
);
CREATE UNIQUE INDEX "products_sku_unique" on "products"("sku");
CREATE UNIQUE INDEX "products_slug_unique" on "products"("slug");
CREATE TABLE IF NOT EXISTS "orders"(
  "id" integer primary key autoincrement not null,
  "customer_name" varchar not null,
  "customer_phone" varchar not null,
  "customer_email" varchar,
  "delivery_address" text not null,
  "status" varchar not null default 'pending',
  "notes" text,
  "total_amount" numeric not null default '0',
  "created_at" datetime,
  "updated_at" datetime,
  "customer_facebook" varchar
);
CREATE TABLE IF NOT EXISTS "order_items"(
  "id" integer primary key autoincrement not null,
  "order_id" integer not null,
  "product_id" integer not null,
  "product_name" varchar not null,
  "quantity" integer not null,
  "unit_price" numeric not null,
  "cost_price" numeric,
  "created_at" datetime,
  "updated_at" datetime,
  "engraving_text" varchar,
  "stitching_text" varchar,
  "selected_size" varchar,
  "selected_gender" varchar,
  "selected_color" varchar,
  foreign key("order_id") references "orders"("id") on delete cascade,
  foreign key("product_id") references "products"("id") on delete cascade
);
CREATE TABLE IF NOT EXISTS "notifications"(
  "id" varchar not null,
  "type" varchar not null,
  "notifiable_type" varchar not null,
  "notifiable_id" integer not null,
  "data" text not null,
  "read_at" datetime,
  "created_at" datetime,
  "updated_at" datetime,
  primary key("id")
);
CREATE INDEX "notifications_notifiable_type_notifiable_id_index" on "notifications"(
  "notifiable_type",
  "notifiable_id"
);
CREATE TABLE IF NOT EXISTS "settings"(
  "key" varchar not null,
  "value" text,
  "created_at" datetime,
  "updated_at" datetime,
  primary key("key")
);
CREATE TABLE IF NOT EXISTS "media"(
  "id" integer primary key autoincrement not null,
  "path" varchar not null,
  "filename" varchar not null,
  "size" integer,
  "created_at" datetime,
  "updated_at" datetime
);

INSERT INTO migrations VALUES(1,'0001_01_01_000000_create_users_table',1);
INSERT INTO migrations VALUES(2,'0001_01_01_000001_create_cache_table',1);
INSERT INTO migrations VALUES(3,'0001_01_01_000002_create_jobs_table',1);
INSERT INTO migrations VALUES(4,'2024_01_01_000000_create_passkeys_table',1);
INSERT INTO migrations VALUES(5,'2025_08_14_170933_add_two_factor_columns_to_users_table',1);
INSERT INTO migrations VALUES(6,'2026_05_24_221615_create_products_table',1);
INSERT INTO migrations VALUES(7,'2026_05_24_221616_create_orders_table',1);
INSERT INTO migrations VALUES(8,'2026_05_24_221617_create_order_items_table',1);
INSERT INTO migrations VALUES(9,'2026_05_24_222424_create_notifications_table',1);
INSERT INTO migrations VALUES(10,'2026_05_25_003753_add_variants_to_products_table',1);
INSERT INTO migrations VALUES(11,'2026_05_25_100000_add_engraving_to_products_and_order_items',1);
INSERT INTO migrations VALUES(12,'2026_05_25_110000_create_settings_table',1);
INSERT INTO migrations VALUES(13,'2026_05_25_120000_add_facebook_url_to_orders',1);
INSERT INTO migrations VALUES(14,'2026_05_25_200000_add_customizations_to_products_and_order_items',2);
INSERT INTO migrations VALUES(15,'2026_05_26_000001_create_media_table',3);
