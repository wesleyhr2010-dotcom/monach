import { prisma } from './src/lib/prisma';

async function main() {
  const oldDomain = 'pub-933b2a69d9e34d719dd55ee2dcfa0a35.r2.dev';
  const newDomain = 'cdn.monarcasemijoyas.com.py';

  console.log(`Substituindo ${oldDomain} por ${newDomain} no banco de dados...`);

  // 1. products (images text[])
  const products = await prisma.$executeRawUnsafe(`
    UPDATE products 
    SET images = (
      SELECT array_agg(REPLACE(elem, '${oldDomain}', '${newDomain}'))
      FROM unnest(images) as elem
    )
    WHERE array_to_string(images, ',') LIKE '%${oldDomain}%';
  `);
  console.log(`Atualizou ${products} produtos (images).`);

  // 2. product_variants (image_url text)
  const variants = await prisma.$executeRawUnsafe(`
    UPDATE product_variants 
    SET image_url = REPLACE(image_url, '${oldDomain}', '${newDomain}')
    WHERE image_url LIKE '%${oldDomain}%';
  `);
  console.log(`Atualizou ${variants} variantes de produtos (image_url).`);

  // 3. resellers (avatar_url text)
  const resellers = await prisma.$executeRawUnsafe(`
    UPDATE resellers 
    SET avatar_url = REPLACE(avatar_url, '${oldDomain}', '${newDomain}')
    WHERE avatar_url LIKE '%${oldDomain}%';
  `);
  console.log(`Atualizou ${resellers} avatares de revendedoras.`);

  // 4. reseller_documentos (url text)
  const docs = await prisma.$executeRawUnsafe(`
    UPDATE reseller_documentos 
    SET url = REPLACE(url, '${oldDomain}', '${newDomain}')
    WHERE url LIKE '%${oldDomain}%';
  `);
  console.log(`Atualizou ${docs} documentos de revendedoras.`);

  // 5. contratos (url text)
  const contratos = await prisma.$executeRawUnsafe(`
    UPDATE contratos 
    SET url = REPLACE(url, '${oldDomain}', '${newDomain}')
    WHERE url LIKE '%${oldDomain}%';
  `);
  console.log(`Atualizou ${contratos} contratos.`);

  // 6. maletas (comprovante_devolucao_url text)
  const maletas = await prisma.$executeRawUnsafe(`
    UPDATE maletas 
    SET comprovante_devolucao_url = REPLACE(comprovante_devolucao_url, '${oldDomain}', '${newDomain}')
    WHERE comprovante_devolucao_url LIKE '%${oldDomain}%';
  `);
  console.log(`Atualizou ${maletas} comprovantes de devolução de maletas.`);

  // 7. brindes (imagem_url text)
  const brindes = await prisma.$executeRawUnsafe(`
    UPDATE brindes 
    SET imagem_url = REPLACE(imagem_url, '${oldDomain}', '${newDomain}')
    WHERE imagem_url LIKE '%${oldDomain}%';
  `);
  console.log(`Atualizou ${brindes} imagens de brindes.`);

  // 8. resellers (documentos_url jsonb)
  const resellersDocs = await prisma.$executeRawUnsafe(`
    UPDATE resellers 
    SET documentos_url = REPLACE(documentos_url::text, '${oldDomain}', '${newDomain}')::jsonb
    WHERE documentos_url::text LIKE '%${oldDomain}%';
  `);
  console.log(`Atualizou ${resellersDocs} array Json documentos_url em revendedoras.`);

  console.log('Finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
