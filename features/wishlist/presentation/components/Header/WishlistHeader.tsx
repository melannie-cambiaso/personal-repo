import { PageHeader } from "@/shared/components";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  total: number;
  pending: number;
  totalPrice: number;
}

export function WishlistHeader({ total, pending, totalPrice }: Props) {
  return (
    <PageHeader eyebrow="Mi lista de deseos ✨" title="Wishlist">
      <div className="flex flex-wrap items-stretch justify-center gap-3">
        <Stat value={String(total)} label="Productos" />
        <Stat value={String(pending)} label="Pendientes" />
        <Stat value={formatCLP(totalPrice)} label="Aprox." />
      </div>
    </PageHeader>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-blush-300 bg-cream-50/70 flex min-w-24 flex-col items-center rounded-2xl border-2 px-4 py-2">
      <span className="font-figure text-brown-900 text-lg font-semibold">{value}</span>
      <span className="text-blush-800 text-sm">{label}</span>
    </div>
  );
}
