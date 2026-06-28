import { PageHeader } from "@/shared/components/PageHeader/PageHeader";
import { formatCLP } from "@/shared/utils/formatCurrency";

interface Props {
  total: number;
  pending: number;
  totalPrice: number;
}

export function WishlistHeader({ total, pending, totalPrice }: Props) {
  return (
    <PageHeader eyebrow="Mi lista de deseos ✨" title="Wishlist">
      <div className="flex items-center justify-center gap-0">
        <Stat value={String(total)} label="Productos" />
        <Divider />
        <Stat value={String(pending)} label="Pendientes" />
        <Divider />
        <Stat value={formatCLP(totalPrice)} label="Aprox." />
      </div>
    </PageHeader>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-8 text-center">
      <span className="block text-xl font-bold text-cream-100">{value}</span>
      <span className="block text-2xs uppercase tracking-eyebrow text-brown-300">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-cream-100/20" />;
}
