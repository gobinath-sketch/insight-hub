import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t section-padding py-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AI</span>
          </div>
          <span className="font-semibold">24hr Engine</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <a href="#" className="hover:text-foreground transition-colors">Docs</a>
          <a href="#" className="hover:text-foreground transition-colors">Blog</a>
          <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
        </div>
        <p className="text-sm text-muted-foreground">© Zenovate All rights reserved.</p>
      </div>
    </footer>
  );
}
