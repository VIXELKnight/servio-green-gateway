const Footer = () => {
  return (
    <footer className="py-8 gradient-hero">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="text-2xl font-bold text-primary-foreground">
            Servio
          </div>

          {/* Copyright */}
          <p className="text-primary-foreground/80 text-sm">
            ©2025 Servio. All rights reserved.
          </p>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a href="#services" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Services
            </a>
            <a href="#pricing" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Pricing
            </a>
            <a href="#contact" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
