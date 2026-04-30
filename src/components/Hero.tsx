import { Mic, Database, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./ImageWithFallback";

interface HeroProps {
  onGetStartedClick?: () => void;
}

export function Hero({ onGetStartedClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden py-18 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.1),transparent_22%)]" />
      <div className="container mx-auto px-4">
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-8">
            <Badge variant="secondary" className="w-fit rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Zap className="mr-1 h-4 w-4" />
              Conversational Retail Intelligence
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight lg:text-6xl">
                Ask Your Store Data
                <span className="block text-primary/80">
                  Anything, Anytime
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground lg:text-xl">
                Transform how you manage your retail business. Simply speak to
                get instant insights from your inventory, sales, and customer
                data.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="gap-2 px-6"
                onClick={() => {
                  toast.info("Voice demo: sign up to try it live.");
                  onGetStartedClick?.();
                }}
              >
                <Mic className="h-5 w-5" />
                Try Voice Demo
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 px-6"
                onClick={() => {
                  const featuresSection =
                    document.getElementById("features");
                  featuresSection?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                <Database className="h-5 w-5" />
                View Features
              </Button>
            </div>

            <div className="grid max-w-xl grid-cols-2 gap-4 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-8">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Works with any database</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Natural language queries</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-6 rounded-[2rem] bg-slate-950/6 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/50 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.45)]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1745340706418-489eb5cad9d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXRhaWwlMjBzdG9yZSUyMHNob3BrZWVwZXIlMjBzbWFsbCUyMGJ1c2luZXNzfGVufDF8fHx8MTc1ODcwODg3MHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Retail store owner managing inventory"
                className="h-[500px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent"></div>
            </div>

            <div className="absolute -right-3 top-6 rounded-2xl border border-border/70 bg-background/92 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mic className="h-4 w-4 text-primary" />
                <span>"Show me today's sales"</span>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 rounded-2xl border border-border/70 bg-background/92 p-4 shadow-xl backdrop-blur">
              <div className="text-sm">
                <div className="font-medium text-muted-foreground">Today's Revenue</div>
                <div className="text-2xl font-bold text-green-600">
                  Rs 69,000
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
