import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AuthMethodSelectorProps {
  onGetStarted: () => void;
  isLoading?: boolean;
}

export const AuthMethodSelector = ({ 
  onGetStarted,
  isLoading = false
}: AuthMethodSelectorProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Welcome to Payvel
          </h1>
          <p className="text-lg text-muted-foreground">
            Your smart wallet for seamless transactions
          </p>
          <p className="text-sm text-muted-foreground/80">
            Sign in to get started with Google, Email, or SMS
          </p>
        </div>

        <Button 
          size="lg" 
          onClick={onGetStarted}
          disabled={isLoading}
          className="w-full h-16 text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            "Get Started"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
