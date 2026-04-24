import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, BarChart3 } from 'lucide-react';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;

  const Tab = ({ to, icon: Icon, label }: { to: string; icon: typeof LogOut; label: string }) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
          active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow grid place-items-center">
            <span className="display-serif text-primary-foreground font-bold text-lg leading-none">T</span>
          </div>
          <span className="display-serif text-xl font-semibold tracking-tight">Trackora</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Tab to="/" icon={LayoutDashboard} label="Dashboard" />
          <Tab to="/analytics" icon={BarChart3} label="Analytics" />
          <Button variant="ghost" size="sm" onClick={signOut} className="ml-2 text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Sign out</span>
          </Button>
        </nav>
      </div>
    </header>
  );
};
