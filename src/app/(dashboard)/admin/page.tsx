export default function AdminDashboardPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
            <p className="text-sm text-ink-muted mt-0.5">Placement activity overview</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        <p className="text-sm text-ink-muted">
          Dashboard widgets coming in a later module.
        </p>
      </div>
    </div>
  );
}
