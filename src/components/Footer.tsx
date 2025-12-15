import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 gradient-hero">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="text-2xl font-bold text-primary-foreground mb-4">
              Servio
            </div>
            <p className="text-primary-foreground/70 text-sm max-w-md">
              Premium AI-powered customer service platform for modern brands. 
              Automate support, delight customers, and scale your business.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-primary-foreground font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <a href="#services" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Services
              </a>
              <a href="#how-it-works" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-primary-foreground font-semibold mb-4">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link to="/privacy-policy" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="/cookie-policy" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <p className="text-primary-foreground/60 text-sm text-center">
            © 2025 Servio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
