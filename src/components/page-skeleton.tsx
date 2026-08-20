// Shown the instant you tap a menu item, while the real page is fetched on the server.
// Next.js swaps this in immediately via each section's loading.tsx, so the app never
// looks frozen on the page you just left.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Bar className="h-7 w-56" />
        <Bar className="h-4 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border bg-card/40 p-5">
            <Bar className="h-4 w-2/3" />
            <Bar className="h-3 w-1/3" />
            <Bar className="h-2 w-full" />
            <div className="flex gap-2 pt-1">
              <Bar className="h-3 w-16" />
              <Bar className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
