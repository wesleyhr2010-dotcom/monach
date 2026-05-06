interface EmptyStateProps {
  whatsapp: string;
}

export default function EmptyState({ whatsapp }: EmptyStateProps) {
  const waLink = `https://wa.me/${whatsapp.replace(/\D/g, "")}`;

  return (
    <div className="text-center py-20">
      <p className="text-gray-400 text-lg">
        No tiene artículos disponibles momentáneamente.
      </p>
      <a
        href={waLink}
        className="inline-block mt-4 text-[#35605a] underline"
      >
        Consultar por WhatsApp
      </a>
    </div>
  );
}
