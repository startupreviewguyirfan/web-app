import { Link } from "wouter";
import { useTheme } from "./theme-provider";
import { Moon, Sun, Monitor, Menu, X, ArrowRight } from "lucide-react";
import logoPng from "@assets/startup-review-guy-logo_1784458264968.png";
import { useState } from "react";
import { Button } from "./ui/button";
import { SocialLinks } from "./social-links";

export function Layout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 md:gap-4 shrink-0 transition-opacity hover:opacity-80">
            <img src={logoPng} alt="Startup Review Guy" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-foreground" />
            <span className="font-display font-bold text-lg md:text-xl uppercase tracking-wider hidden sm:inline-block">Startup Review Guy</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 font-display font-medium uppercase tracking-widest text-sm">
              <Link href="/startups" className="hover:text-primary transition-colors">Startups</Link>
              <Link href="/partner" className="hover:text-primary transition-colors">Partner With Me</Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-none hover:bg-secondary w-10 h-10"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-border bg-background absolute w-full left-0 p-4 flex flex-col gap-4 shadow-xl">
            <Link href="/startups" onClick={() => setMobileMenuOpen(false)} className="font-display uppercase tracking-widest text-lg py-2 border-b border-border/50">Startups</Link>
            <Link href="/partner" onClick={() => setMobileMenuOpen(false)} className="font-display uppercase tracking-widest text-lg py-2 border-b border-border/50">Partner With Me</Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t-2 border-border bg-card">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-4 max-w-sm">
            <Link href="/" className="flex items-center gap-3">
              <img src={logoPng} alt="Startup Review Guy" className="w-8 h-8 rounded-full border-2 border-foreground" />
              <span className="font-display font-bold text-lg uppercase tracking-wider">SRG</span>
            </Link>
            <p className="text-muted-foreground font-medium text-sm leading-relaxed">
              No-fluff startup reviews. I test the latest tools, SaaS, and products so you don't have to waste your time.
            </p>
          </div>

          <div className="flex flex-col md:items-end gap-6">
            <SocialLinks className="flex items-center gap-5" iconClassName="w-5 h-5" />
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Startup Review Guy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}