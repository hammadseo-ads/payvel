import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface AuthMethodSelectorProps {
  onGetStarted: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const AuthMethodSelector = ({ 
  onGetStarted,
  isLoading = false,
  error = null,
  onRetry
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription className="mt-2">
              {error}
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="mt-3 w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

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

        {isLoading && (
          <div className="text-center space-y-3 p-4 bg-secondary/30 rounded-lg border border-secondary">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm font-medium text-foreground">
                Authenticating...
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Complete the authentication in the popup window
              </p>
              <p className="text-xs text-muted-foreground/70">
                Choose Google, Email (OTP), or SMS to sign in
              </p>
              <p className="text-xs text-muted-foreground/70">
                If you don't see a popup, check if it was blocked by your browser
              </p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};
