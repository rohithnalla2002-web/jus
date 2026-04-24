DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS accounting_monthly CASCADE;
DROP TABLE IF EXISTS karigar_jobs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS salary_payments CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;

CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  weight TEXT NOT NULL,
  purity TEXT NOT NULL,
  price_rupees BIGINT NOT NULL,
  hallmark BOOLEAN NOT NULL DEFAULT true,
  hallmark_number TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  provider_name TEXT NOT NULL DEFAULT '',
  storage_box_number TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT 'necklace',
  stock INT NOT NULL DEFAULT 0,
  high_selling BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  total_purchases_rupees BIGINT NOT NULL DEFAULT 0,
  visits INT NOT NULL DEFAULT 0,
  last_visit TEXT NOT NULL DEFAULT ''
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  salary_rupees BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  join_date TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT ''
);

CREATE TABLE salary_payments (
  id BIGSERIAL PRIMARY KEY,
  employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount_rupees BIGINT NOT NULL,
  month_period TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_salary_payments_employee ON salary_payments (employee_id, created_at DESC);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  payment_mode TEXT NOT NULL DEFAULT 'cash',
  items TEXT NOT NULL,
  total_rupees BIGINT NOT NULL,
  status TEXT NOT NULL,
  order_date DATE NOT NULL
);

CREATE TABLE karigar_jobs (
  id SERIAL PRIMARY KEY,
  column_key TEXT NOT NULL CHECK (column_key IN ('assigned', 'inProgress', 'completed')),
  title TEXT NOT NULL,
  karigar TEXT NOT NULL,
  material TEXT NOT NULL DEFAULT '',
  deadline TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  customer_name TEXT NOT NULL DEFAULT '',
  customer_mobile TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  reference_image TEXT NOT NULL DEFAULT '',
  price_rupees BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE activities (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  time_display TEXT NOT NULL,
  type TEXT NOT NULL,
  activity_date DATE NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE accounting_monthly (
  id SERIAL PRIMARY KEY,
  month_label TEXT NOT NULL UNIQUE,
  income_rupees BIGINT NOT NULL,
  expense_rupees BIGINT NOT NULL
);

CREATE INDEX idx_orders_order_date ON orders (order_date);
CREATE INDEX idx_activities_created ON activities (created_at DESC);
