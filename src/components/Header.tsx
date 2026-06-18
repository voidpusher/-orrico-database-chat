import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onSignInClick?: () => void;
  onGetStartedClick?: () => void;
  onSupportClick?: () => void;
}

export function Header({ onSignInClick, onGetStartedClick, onSupportClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-18 items-center justify-between px-4">
        <Logo />
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
            Demo
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <button
            onClick={onSupportClick}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Support
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button 
            variant="ghost" 
            className="hidden md:inline-flex text-muted-foreground"
            onClick={onSignInClick}
          >
            Sign In
          </Button>
          <Button onClick={onGetStartedClick} className="px-5">
            Get Started
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
