import { requireAuth } from "@/lib/user";
import { StockSyncUpload } from "@/components/admin/estoque/StockSyncUpload";

export const dynamic = "force-dynamic";

export default async function StockSyncPage() {
  await requireAuth();

  return (
    <div style={{ padding: 24 }}>
      <StockSyncUpload />
    </div>
  );
}
