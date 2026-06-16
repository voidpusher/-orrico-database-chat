import { useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  Briefcase,
  LogOut,
  MapPin,
  Store,
  Workflow,
} from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { safeJsonParse, safeStorageGet } from "../lib/storage";

interface ShopSetupPageProps {
  onComplete: (profile: Record<string, string>) => void;
  onLogout?: () => void;
}

interface ShopSetupForm {
  shopName: string;
  businessType: string;
  city: string;
  primaryGoal: string;
}

const businessTypes = [
  "General Store",
  "Electronics",
  "Fashion",
  "Grocery",
  "Pharmacy",
  "Wholesale",
];

const primaryGoals = [
  "Track sales and margins",
  "Monitor stock movement",
  "Understand customer buying patterns",
  "Prepare for CSV and database import",
];

export function ShopSetupPage({
  onComplete,
  onLogout,
}: ShopSetupPageProps) {
  const currentUser = safeJsonParse<Record<string, unknown>>(
    safeStorageGet("orrico_current_user"),
    {},
  );
  const defaultShopName = useMemo(() => {
    const businessName = String(currentUser.businessName || "").trim();

    return businessName || "My Shop";
  }, [currentUser.businessName]);

  const form = useForm<ShopSetupForm>({
    defaultValues: {
      shopName: defaultShopName,
      businessType: "General Store",
      city: "",
      primaryGoal: "Track sales and margins",
    },
  });

  const handleSubmit = (values: ShopSetupForm) => {
    onComplete({
      shopName: values.shopName.trim(),
      businessType: values.businessType,
      city: values.city.trim(),
      primaryGoal: values.primaryGoal,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          {onLogout && (
            <Button variant="ghost" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Store className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight">
                  Set up your new shop workspace
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Real accounts start clean. Add the basic shop profile now and then
                  connect your own data source in the next step.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/70 bg-card/88">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Fresh workspace</h3>
                      <p className="text-sm text-muted-foreground">
                        No demo catalog, orders, or customer records are shared into
                        this account.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/88">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Workflow className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Structured onboarding</h3>
                      <p className="text-sm text-muted-foreground">
                        Shop profile first, data connection second, then chat and
                        reporting.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/88">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-medium">Business-ready defaults</h3>
                      <p className="text-sm text-muted-foreground">
                        This helps tailor the workspace before you bring in live shop
                        data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-border/70 bg-card/92 shadow-[0_30px_80px_-36px_rgba(15,23,42,0.4)]">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl">Shop profile</CardTitle>
              <CardDescription>
                This information sets the context for your new workspace before data
                import.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="shopName">Shop name</Label>
                  <Input
                    id="shopName"
                    placeholder="Sharma Retail Store"
                    {...form.register("shopName", {
                      required: "Shop name is required",
                    })}
                  />
                  {form.formState.errors.shopName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.shopName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Business type</Label>
                  <Select
                    defaultValue={form.getValues("businessType")}
                    onValueChange={(value) =>
                      form.setValue("businessType", value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((businessType) => (
                        <SelectItem key={businessType} value={businessType}>
                          {businessType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Jaipur"
                    {...form.register("city", {
                      required: "City is required",
                    })}
                  />
                  {form.formState.errors.city && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.city.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Primary goal</Label>
                  <Select
                    defaultValue={form.getValues("primaryGoal")}
                    onValueChange={(value) =>
                      form.setValue("primaryGoal", value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose primary goal" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryGoals.map((goal) => (
                        <SelectItem key={goal} value={goal}>
                          {goal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full gap-2">
                  Continue to Data Setup
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
