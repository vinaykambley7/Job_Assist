import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="border-t border-border bg-muted/30 py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="KaizenJobs" className="h-6" />
        </div>
        <p className="text-sm text-muted-foreground">© 2026 KaizenJobs. All rights reserved.</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
