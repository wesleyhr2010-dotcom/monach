import { getPrisma } from "./db";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "@/generated/prisma/client";

// Track created IDs for cleanup
const createdIds: {
  authUsers: string[];
  resellers: string[];
  products: string[];
  variants: string[];
  maletas: string[];
} = {
  authUsers: [],
  resellers: [],
  products: [],
  variants: [],
  maletas: [],
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase URL or service role key");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function seedUser(
  role: UserRole,
  data: {
    email: string;
    password: string;
    nome: string;
    whatsapp?: string;
    cedula?: string;
    colaboradora_id?: string;
  }
) {
  const prisma = await getPrisma();
  const supabase = getSupabaseAdmin();

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create auth user: ${authError?.message}`);
  }

  const authUserId = authData.user.id;
  createdIds.authUsers.push(authUserId);

  // Create Reseller profile
  const slugBase = data.email.split("@")[0].replace(/[^a-z0-9]/gi, "-").toLowerCase();
  const slug = `${slugBase}-${Date.now()}`;

  const reseller = await prisma.reseller.create({
    data: {
      auth_user_id: authUserId,
      name: data.nome,
      email: data.email,
      whatsapp: data.whatsapp || "+595981234567",
      slug,
      role,
      cedula: data.cedula || "",
      is_active: true,
      perfil_completo: true,
      onboarding_completo: true,
      colaboradora_id: data.colaboradora_id || null,
    },
  });

  createdIds.resellers.push(reseller.id);
  await prisma.$disconnect();
  return { authUserId, reseller };
}

export async function seedProductAndVariant(data?: {
  product?: Partial<{ sku: string; name: string; price: number }>;
  variant?: Partial<{ attribute_name: string; attribute_value: string; price: number; stock_quantity: number }>;
}) {
  const prisma = await getPrisma();
  const timestamp = Date.now();
  const product = await prisma.product.create({
    data: {
      sku: data?.product?.sku || `E2E-SKU-${timestamp}`,
      name: data?.product?.name || `Produto E2E ${timestamp}`,
      price: data?.product?.price ?? 150000,
      short_description: "Descrição de teste",
      description: "Descrição completa de teste",
      ativo: true,
    },
  });
  createdIds.products.push(product.id);

  const variant = await prisma.productVariant.create({
    data: {
      product_id: product.id,
      attribute_name: data?.variant?.attribute_name || "cor",
      attribute_value: data?.variant?.attribute_value || `Dourado ${timestamp}`,
      price: data?.variant?.price ?? 150000,
      stock_quantity: data?.variant?.stock_quantity ?? 100,
      sku: `${product.sku}-VAR1`,
      in_stock: true,
      ativo: true,
    },
  });
  createdIds.variants.push(variant.id);

  await prisma.$disconnect();
  return { product, variant };
}

export async function seedMaleta(
  resellerId: string,
  items: { variantId: string; quantity: number; precoFixado?: number }[]
) {
  const prisma = await getPrisma();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const maleta = await prisma.maleta.create({
    data: {
      reseller_id: resellerId,
      status: "ativa",
      data_envio: new Date(),
      data_limite: futureDate,
      itens: {
        create: items.map((item) => ({
          product_variant_id: item.variantId,
          quantidade_enviada: item.quantity,
          preco_fixado: item.precoFixado ?? 150000,
        })),
      },
    },
    include: { itens: true },
  });

  createdIds.maletas.push(maleta.id);
  await prisma.$disconnect();
  return maleta;
}

export async function seedScenario() {
  const timestamp = Date.now();

  // 1. Admin
  const { reseller: admin } = await seedUser("ADMIN", {
    email: `e2e-admin-${timestamp}@test.com`,
    password: "AdminPass123!",
    nome: `Admin E2E ${timestamp}`,
  });

  // 2. Colaboradora
  const { reseller: colaboradora } = await seedUser("COLABORADORA", {
    email: `e2e-colab-${timestamp}@test.com`,
    password: "ColabPass123!",
    nome: `Colaboradora E2E ${timestamp}`,
  });

  // 3. Revendedora (under colaboradora)
  const { authUserId: resellerAuthId, reseller } = await seedUser("REVENDEDORA", {
    email: `e2e-reseller-${timestamp}@test.com`,
    password: "ResellerPass123!",
    nome: `Revendedora E2E ${timestamp}`,
    colaboradora_id: colaboradora.id,
  });

  // 4. Products with variants
  const products: { product: { id: string; name: string; sku: string }; variant: { id: string } }[] = [];
  for (let i = 0; i < 3; i++) {
    products.push(
      await seedProductAndVariant({
        product: {
          sku: `E2E-PROD-${timestamp}-${i}`,
          name: `Produto E2E ${timestamp} ${i}`,
          price: 100000 + i * 50000,
        },
        variant: {
          attribute_value: `Variante ${i}`,
          stock_quantity: 50,
        },
      })
    );
  }

  // 5. Active maleta for reseller with 2 items
  const maleta = await seedMaleta(reseller.id, [
    { variantId: products[0].variant.id, quantity: 5, precoFixado: 100000 },
    { variantId: products[1].variant.id, quantity: 3, precoFixado: 150000 },
  ]);

  return {
    admin,
    colaboradora,
    reseller,
    resellerAuthId,
    products: products.map((p) => p.product),
    variants: products.map((p) => p.variant),
    maleta,
  };
}

export async function cleanupScenario() {
  const prisma = await getPrisma();

  // Delete in reverse dependency order
  for (const maletaId of createdIds.maletas) {
    await prisma.maleta.delete({ where: { id: maletaId } }).catch(() => {});
  }
  for (const variantId of createdIds.variants) {
    await prisma.productVariant.delete({ where: { id: variantId } }).catch(() => {});
  }
  for (const productId of createdIds.products) {
    await prisma.product.delete({ where: { id: productId } }).catch(() => {});
  }
  for (const resellerId of createdIds.resellers) {
    await prisma.reseller.delete({ where: { id: resellerId } }).catch(() => {});
  }

  const supabase = getSupabaseAdmin();
  for (const authUserId of createdIds.authUsers) {
    await supabase.auth.admin.deleteUser(authUserId).catch(() => {});
  }

  await prisma.$disconnect();

  // Reset tracking
  createdIds.authUsers = [];
  createdIds.resellers = [];
  createdIds.products = [];
  createdIds.variants = [];
  createdIds.maletas = [];
}
