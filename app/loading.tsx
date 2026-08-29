export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-white/5 bg-black/20 animate-pulse w-full" />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Featured Movie Skeleton */}
        <div className="w-full aspect-[21/9] bg-zinc-900 rounded-3xl animate-pulse mb-12" />
        
        {/* Row Skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-12">
            <div className="h-8 w-48 bg-zinc-800 rounded-lg mb-6 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="aspect-[2/3] bg-zinc-900 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}