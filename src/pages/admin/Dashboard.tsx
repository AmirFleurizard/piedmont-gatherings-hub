import { useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Church, 
  Calendar, 
  Users, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const Dashboard = () => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { path: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { path: "/admin/events", label: "Events", icon: Calendar },
    { path: "/admin/registrations", label: "Registrations", icon: Users },
  ];

  if (role === "county_admin") {
    navItems.splice(2, 0, { path: "/admin/churches", label: "Churches", icon: Church });
  }

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-background border-b">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-8 w-8" />
          <span className="font-semibold text-primary">Admin</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 bg-background border-r
            transform transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b hidden lg:block">
              <Link to="/" className="flex items-center gap-3">
                <img src={logo} alt="Logo" className="h-10 w-10" />
                <div>
                  <span className="font-semibold text-primary block">Piedmont Connect</span>
                  <span className="text-xs text-muted-foreground">Admin Dashboard</span>
                </div>
              </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${
                      isActive(item.path, item.exact)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t">
              <div className="px-4 py-2 mb-2">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {role?.replace("_", " ") || "No role assigned"}
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
