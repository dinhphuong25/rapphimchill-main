export default function RootLoading() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-8 lg:px-12 xl:px-16 pt-20 sm:pt-24 pb-20 animate-in fade-in duration-200">
      {/* Top subtle filter placeholder */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-36 rounded-xl bg-white/[0.05] animate-pulse" />
        <div className="h-6 w-24 rounded-xl bg-white/[0.03] animate-pulse hidden sm:block" />
      </div>

      {/* Movie Grid Skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-[2/3] w-full rounded-2xl bg-white/[0.04] border border-white/5 animate-pulse" />
            <div className="h-4 w-3/4 rounded-lg bg-white/[0.04] animate-pulse" />
            <div className="h-3 w-1/2 rounded-lg bg-white/[0.03] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}