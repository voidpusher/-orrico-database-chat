import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  Mic, 
  Database, 
  BarChart3, 
  Clock, 
  Shield, 
  Smartphone 
} from "lucide-react";

export function Features() {
  const features = [
    {
      icon: Mic,
      title: "Voice-First Interface",
      description: "Simply speak your questions in natural language. No complex queries or technical knowledge required.",
      color: "text-blue-600"
    },
    {
      icon: Database,
      title: "Universal Database Support",
      description: "Connect to any database system - MySQL, PostgreSQL, MongoDB, or even Excel spreadsheets.",
      color: "text-green-600"
    },
    {
      icon: BarChart3,
      title: "Instant Analytics",
      description: "Get real-time insights about sales, inventory, customer trends, and business performance.",
      color: "text-purple-600"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Access your business data anytime, anywhere. Perfect for busy retail owners on the go.",
      color: "text-orange-600"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data stays protected with enterprise-grade security and privacy controls.",
      color: "text-red-600"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Works seamlessly on any device - phone, tablet, or computer. Manage your store from anywhere.",
      color: "text-indigo-600"
    }
  ];

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="text-primary block">Grow Your Business</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed specifically for retail businesses. 
            Get insights that help you make better decisions faster.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/70 bg-card/88 transition-transform duration-200 hover:-translate-y-1">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    0{index + 1}
                  </span>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
