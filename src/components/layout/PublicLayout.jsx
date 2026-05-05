import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wide">ALS Professional Network</span>
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Operations Hub</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 text-[11px] text-muted-foreground flex justify-between">
          <span>&copy; ALS Professional Network</span>
          <span>Questions? <a href="mailto:hello@alsprofessional.com" className="text-primary hover:underline">hello@alsprofessional.com</a></span>
        </div>
      </footer>
    </div>
  );
}
