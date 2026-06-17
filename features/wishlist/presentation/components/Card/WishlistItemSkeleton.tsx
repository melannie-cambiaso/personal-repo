export function WishlistItemSkeleton() {
  return (
    <div className="bg-cream-50 rounded-2xl overflow-hidden shadow-card flex flex-col animate-pulse">
      <div className="bg-cream-300 h-[220px]" />
      <div className="flex flex-1 flex-col px-5 pt-[18px] pb-5 gap-3">
        <div className="bg-cream-300 h-3 w-1/3 rounded" />
        <div className="bg-cream-300 h-4 w-3/4 rounded" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="bg-cream-300 h-3 w-full rounded" />
          <div className="bg-cream-300 h-3 w-5/6 rounded" />
          <div className="bg-cream-300 h-3 w-2/3 rounded" />
        </div>
        <div className="flex justify-between items-end mt-2">
          <div className="bg-cream-300 h-5 w-1/4 rounded" />
          <div className="bg-cream-300 h-8 w-1/3 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
