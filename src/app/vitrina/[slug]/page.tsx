export const revalidate = 60; // ISR — vitrina pública indexável

interface VitrinaPageProps {
  params: Promise<{ slug: string }>;
}

export default async function VitrinaPage({ params }: VitrinaPageProps) {
  const { slug } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Vitrina pública — {slug}</p>
    </div>
  );
}
