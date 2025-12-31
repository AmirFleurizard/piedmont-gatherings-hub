import { NavLink } from "@/components/NavLink";
import { Facebook, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home", end: true },
    { to: "/about", label: "About" },
    { to: "/staff", label: "Staff" },
    { to: "/churches", label: "Churches" },
    { to: "/events", label: "Events" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Piedmont Connect Logo" className="h-10 w-10" />
            <span className="text-xl font-semibold text-primary">Piedmont Connect</span>
          </NavLink>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink 
                key={link.to}
                to={link.to} 
                end={link.end}
                className="text-foreground hover:text-secondary transition-colors"
                activeClassName="text-secondary font-semibold"
              >
                {link.label}
              </NavLink>
            ))}
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

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background">
                <div className="flex flex-col gap-6 mt-8">
                  {navLinks.map((link) => (
                    <NavLink 
                      key={link.to}
                      to={link.to} 
                      end={link.end}
                      className="text-lg text-foreground hover:text-secondary transition-colors"
                      activeClassName="text-secondary font-semibold"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                  <a 
                    href="https://facebook.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-lg text-accent hover:text-accent/80 transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                    Facebook
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
