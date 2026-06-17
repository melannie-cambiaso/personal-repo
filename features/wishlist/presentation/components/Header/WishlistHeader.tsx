const formatCLP = (n: number) => `$${n.toLocaleString("es-CL")}`;

interface Props {
  total: number;
  pending: number;
  totalPrice: number;
}

export function WishlistHeader({ total, pending, totalPrice }: Props) {
  return (
    <header
      className="w-full px-6 py-10 text-center"
      style={{ background: "var(--gradient-header)" }}
    >
      <p className="text-brown-200 text-2xs tracking-eyebrow mb-3 font-semibold uppercase">
        Mi lista de deseos ✨
      </p>
      <h1 className="font-dancing text-cream-100 mb-8 text-6xl font-bold">Wishlist</h1>

      <div className="flex items-center justify-center gap-0">
        <Stat value={String(total)} label="Productos" />
        <Divider />
        <Stat value={String(pending)} label="Pendientes" />
        <Divider />
        <Stat value={formatCLP(totalPrice)} label="Aprox." />
      </div>
    </header>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-8 text-center">
      <span className="text-cream-100 block text-xl font-bold">{value}</span>
      <span className="text-brown-300 text-2xs tracking-eyebrow block uppercase">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="bg-cream-100/20 h-8 w-px" />;
}
