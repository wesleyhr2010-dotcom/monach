-- ============================================
-- Monarca Semijoyas — Resellers Schema
-- Execute this in Supabase SQL Editor
-- ============================================

-- Tabela de revendedoras
CREATE TABLE resellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resellers_slug ON resellers (slug);
CREATE INDEX idx_resellers_active ON resellers (is_active);

-- Trigger auto-update updated_at
CREATE TRIGGER trigger_resellers_updated_at
  BEFORE UPDATE ON resellers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Maleta: associa produtos à revendedora
CREATE TABLE reseller_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  custom_price NUMERIC(12, 2) DEFAULT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reseller_id, product_id)
);

CREATE INDEX idx_reseller_products_reseller ON reseller_products (reseller_id);
CREATE INDEX idx_reseller_products_product ON reseller_products (product_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;

-- Public can read active resellers
CREATE POLICY "Public can read active resellers"
  ON resellers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Service role full access
CREATE POLICY "Service role full access on resellers"
  ON resellers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE reseller_products ENABLE ROW LEVEL SECURITY;

-- Public can read reseller products
CREATE POLICY "Public can read reseller products"
  ON reseller_products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role full access
CREATE POLICY "Service role full access on reseller_products"
  ON reseller_products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
