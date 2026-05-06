/**
 * Test data factories for E2E tests.
 * All values are unique to avoid collisions across parallel runs.
 */

export function uniqueId() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTestReseller(overrides?: Record<string, unknown>) {
  const id = uniqueId();
  return {
    email: `${id}@test.com`,
    password: "TestPass123!",
    nome: `Revendedora ${id}`,
    whatsapp: "+595981234567",
    cedula: "1234567",
    instagram: "@testuser",
    edad: "25",
    estado_civil: "soltero",
    hijos: "0",
    empresa: "Test Empresa",
    informconf: "ok",
    ...overrides,
  };
}

export function createTestProduct(overrides?: Record<string, unknown>) {
  const id = uniqueId();
  return {
    sku: `E2E-${id.toUpperCase().slice(0, 20)}`,
    name: `Produto Teste ${id}`,
    short_description: "Descrição curta de teste",
    description: "Descrição completa do produto de teste",
    price: 150000,
    ...overrides,
  };
}

export function createTestVariant(overrides?: Record<string, unknown>) {
  const id = uniqueId();
  return {
    attribute_name: "cor",
    attribute_value: `Dourado ${id}`,
    price: 150000,
    stock_quantity: 100,
    ...overrides,
  };
}
