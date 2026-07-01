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
      <div className="flex items-center justify-center gap-0">
        <Stat value={String(total)} label="Productos" />
        <Divider />
        <Stat value={String(pending)} label="Pendientes" />
        <Divider />
        <Stat value={formatCLP(totalPrice)} label="Aprox." />
      </div>
    </PageHeader>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-8 text-center">
      <span className="text-cream-100 block text-xl font-bold">{value}</span>
      <span className="text-2xs tracking-eyebrow text-brown-300 block uppercase">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="bg-cream-100/20 h-8 w-px" />;
}
