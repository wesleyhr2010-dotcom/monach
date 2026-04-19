-- ============================================
-- Monarca Semijoyas — Supabase Schema
-- Execute this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: products
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_description TEXT DEFAULT '',
  description TEXT DEFAULT '',
  price NUMERIC(12, 2) DEFAULT NULL,
  categories TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  product_type TEXT NOT NULL DEFAULT 'simple' CHECK (product_type IN ('simple', 'variable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for SKU lookups
CREATE INDEX idx_products_sku ON products (sku);

-- GIN index for full-text search on name
CREATE INDEX idx_products_name_gin ON products USING GIN (to_tsvector('spanish', name));

-- Index for sorting by creation date
CREATE INDEX idx_products_created_at ON products (created_at DESC);

-- ============================================
-- Table: product_variants
-- ============================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  price NUMERIC(12, 2) DEFAULT NULL,
  sku TEXT DEFAULT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching variants by product
CREATE INDEX idx_variants_product_id ON product_variants (product_id);

-- Unique constraint: no duplicate attribute values per product
CREATE UNIQUE INDEX idx_variants_unique ON product_variants (product_id, attribute_name, attribute_value);

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- ============================================

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can read products
CREATE POLICY "Public can read products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role has full access
CREATE POLICY "Service role full access on products"
  ON products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Product Variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Public can read variants
CREATE POLICY "Public can read variants"
  ON product_variants FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role has full access
CREATE POLICY "Service role full access on variants"
  ON product_variants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
