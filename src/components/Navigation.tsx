import { NavLink } from "@/components/NavLink";
import { Facebook } from "lucide-react";
import logo from "@/assets/logo.png";

const Navigation = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Piedmont Connect Logo" className="h-10 w-10" />
            <span className="text-xl font-semibold text-primary">Piedmont Connect</span>
          </NavLink>
          
          <div className="hidden md:flex items-center gap-8">
            <NavLink 
              to="/" 
              end
              className="text-foreground hover:text-secondary transition-colors"
              activeClassName="text-secondary font-semibold"
            >
              Home
            </NavLink>
            <NavLink 
              to="/about" 
              className="text-foreground hover:text-secondary transition-colors"
              activeClassName="text-secondary font-semibold"
            >
              About
            </NavLink>
            <NavLink 
              to="/staff" 
              className="text-foreground hover:text-secondary transition-colors"
              activeClassName="text-secondary font-semibold"
            >
              Staff
            </NavLink>
            <NavLink 
              to="/churches" 
              className="text-foreground hover:text-secondary transition-colors"
              activeClassName="text-secondary font-semibold"
            >
              Churches
            </NavLink>
            <NavLink 
              to="/events" 
              className="text-foreground hover:text-secondary transition-colors"
              activeClassName="text-secondary font-semibold"
            >
              Events
            </NavLink>
            <NavLink 
              to="/contact" 
              className="text-foreground hover:text-secondary transition-colors"
              activeClassName="text-secondary font-semibold"
            >
              Contact
            </NavLink>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 transition-colors"
              aria-label="Visit our Facebook page"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
