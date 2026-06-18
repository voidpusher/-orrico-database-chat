import { Header } from "./Header";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { ChatDemo } from "./ChatDemo";
import { LandingPricing } from "./LandingPricing";
import { CTA } from "./CTA";
import { Footer } from "./Footer";

interface LandingPageProps {
  onNavigateToAuth?: () => void;
  onNavigateToSupport?: () => void;
}

export function LandingPage({ onNavigateToAuth, onNavigateToSupport }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header
        onSignInClick={onNavigateToAuth}
        onGetStartedClick={onNavigateToAuth}
        onSupportClick={onNavigateToSupport}
      />
      <main>
        <Hero onGetStartedClick={onNavigateToAuth} />
        <Features />
        <HowItWorks />
        <ChatDemo />
        <LandingPricing onGetStartedClick={onNavigateToAuth} />
        <CTA onGetStartedClick={onNavigateToAuth} />
      </main>
      <Footer onSupportClick={onNavigateToSupport} />
    </div>
  );
}