import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import payvelLogo from "@/assets/payvel-logo.png";
import onboarding1 from "@/assets/onboarding-1.png";
import onboarding2 from "@/assets/onboarding-2.png";
import onboarding3 from "@/assets/onboarding-3.png";

interface OnboardingScreen {
  id: number;
  title: string;
  highlight: string;
  image: string;
}

const screens: OnboardingScreen[] = [
  {
    id: 1,
    title: "All-in-One Solution for",
    highlight: "Modern Money Management",
    image: onboarding1,
  },
  {
    id: 2,
    title: "Banking Just Got",
    highlight: "Easier",
    image: onboarding2,
  },
  {
    id: 3,
    title: "Embrace Global",
    highlight: "Currencies with Ease",
    image: onboarding3,
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src={payvelLogo} alt="Payvel" className="w-48 h-48 animate-pulse" />
      </div>
    );
  }

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    setCurrentScreen(screens.length - 1);
  };

  const progress = ((currentScreen + 1) / screens.length) * 100;
  const screen = screens[currentScreen];
  const isLastScreen = currentScreen === screens.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Logo */}
      <div className="pt-8 px-6">
        <img src={payvelLogo} alt="Payvel" className="h-12" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Hero Image */}
        <div className="w-full max-w-md mb-12">
          <img
            src={screen.image}
            alt={screen.title}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {screen.title}
            <br />
            <span className="text-primary">{screen.highlight}</span>
          </h1>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full" />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="px-6 pb-12 space-y-6">
        {/* Buttons */}
        <div className="flex gap-4">
          {!isLastScreen && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleSkip}
              className="flex-1 h-14 text-base border-2"
            >
              Skip
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleNext}
            className="flex-1 h-14 text-base bg-primary hover:bg-primary/90"
          >
            {isLastScreen ? "Get Started" : "Continue"}
          </Button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-center gap-2">
            {screens.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentScreen ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
