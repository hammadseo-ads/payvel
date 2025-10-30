import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="p-8 max-w-lg w-full glass-effect">
            <div className="flex flex-col items-center text-center space-y-4">
              <AlertTriangle className="w-16 h-16 text-destructive" />
              <h2 className="text-2xl font-bold">Something went wrong</h2>
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="w-full text-left">
                  <summary className="cursor-pointer text-sm font-medium">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-background/50 p-4 rounded overflow-auto max-h-64">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = "/"}
                >
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AuthErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="p-8 max-w-md glass-effect">
        <div className="flex flex-col items-center text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <h2 className="text-2xl font-bold">Authentication Error</h2>
          <p className="text-muted-foreground">
            We couldn't load your wallet. This might be due to browser privacy settings or localStorage restrictions.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Reload Page
          </Button>
        </div>
      </Card>
    </div>
  );
}
