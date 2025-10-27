import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Zap, Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import heroImage from "@/assets/hero-bg.jpg";

const Index = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="relative overflow-hidden">
        {/* Hero Background */}
        <div 
          className="absolute inset-0 z-0 opacity-30"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        
        <div className="relative z-10 container mx-auto px-4 py-20">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
            <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-sm font-medium gradient-text">Powered by Web3Auth & Biconomy</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Your Wallet,
              <br />
              <span className="gradient-text">Simplified</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sign in with Google and enjoy gasless transactions. No seed phrases, no complexity—just secure, easy crypto payments.
            </p>

            <Button
              onClick={login}
              disabled={isLoading}
              size="lg"
              className="h-14 px-8 text-lg glow-effect"
            >
              {isLoading ? "Loading..." : "Continue with Google"}
            </Button>

            <p className="text-sm text-muted-foreground">
              Your Google account = your wallet recovery
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="p-6 glass-effect border-primary/10 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                <Key className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Seed Phrases</h3>
              <p className="text-muted-foreground">
                Use your Google account for seamless access and recovery
              </p>
            </Card>

            <Card className="p-6 glass-effect border-primary/10 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gasless Transactions</h3>
              <p className="text-muted-foreground">
                We cover gas fees within approved limits—you just send
              </p>
            </Card>

            <Card className="p-6 glass-effect border-primary/10 hover:border-primary/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Account Security</h3>
              <p className="text-muted-foreground">
                Built on Biconomy's battle-tested smart account infrastructure
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
