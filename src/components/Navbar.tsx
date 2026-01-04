import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LogOut, Shield, MessageSquare, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { isAdmin } from "@/lib/supabaseRoles";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const admin = await isAdmin(supabase, user.id);
        setIsUserAdmin(admin);
      } else {
        setIsUserAdmin(false);
      }
    }
    checkAdmin();
  }, [user]);

  const navLinks = [
    { href: "#services", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
    { href: "/widget-demo", label: "Demo", isRoute: true },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className={`flex items-center gap-2 transition-colors ${
              isScrolled ? "text-primary" : "text-primary-foreground"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg ${isScrolled ? 'bg-primary/10' : 'bg-primary-foreground/10'} flex items-center justify-center`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold">Servio</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:opacity-80 ${
                    isScrolled ? "text-foreground" : "text-primary-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:opacity-80 ${
                    isScrolled ? "text-foreground" : "text-primary-foreground"
                  }`}
                >
                  {link.label}
                </a>
              )
            ))}
            
            {user ? (
              <div className="flex items-center gap-3">
                {isUserAdmin && (
                  <Link to="/admin">
                    <Button variant={isScrolled ? "outline" : "heroOutline"} size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard">
                  <Button variant={isScrolled ? "default" : "hero"} size="sm">
                    Dashboard
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Button
                  variant={isScrolled ? "ghost" : "heroOutline"}
                  size="icon"
                  onClick={signOut}
                  className="w-9 h-9"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth">
                  <Button variant={isScrolled ? "ghost" : "heroOutline"} size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant={isScrolled ? "default" : "hero"} size="sm">
                    Get Started
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-primary-foreground/10 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={isScrolled ? "text-foreground" : "text-primary-foreground"} />
            ) : (
              <Menu className={isScrolled ? "text-foreground" : "text-primary-foreground"} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 bg-background border-t border-border rounded-b-xl shadow-xl animate-fade-up">
            <div className="flex flex-col gap-2 px-2">
              {navLinks.map((link) => (
                link.isRoute ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-foreground font-medium py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-foreground font-medium py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                )
              ))}
              
              <div className="border-t border-border my-2" />
              
              {user ? (
                <>
                  {isUserAdmin && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-start">
                      Dashboard
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </Link>
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">{user.email}</span>
                    <Button variant="ghost" size="sm" onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">
                    Get Started Free
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
