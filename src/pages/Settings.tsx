import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { toast } from "sonner";

const Settings = () => {
  const { smartAccountAddress, userEmail } = useAuth();
  const navigate = useNavigate();

  const copyAddress = () => {
    if (smartAccountAddress) {
      navigator.clipboard.writeText(smartAccountAddress);
      toast.success("Address copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <div>
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>

          <Card className="p-6 glass-effect space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Google Account</h3>
              <p className="text-lg">{userEmail || "Not connected"}</p>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Smart Account Address</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 rounded-lg bg-background/50 font-mono text-sm break-all">
                  {smartAccountAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Network</h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <span>Base Sepolia Testnet</span>
                <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                  Active
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-effect">
            <h3 className="text-lg font-semibold mb-2">Account Recovery</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your wallet is secured by your Google account. If you lose access to this device, simply sign in with the same Google account on another device to recover your wallet.
            </p>
            <p className="text-sm text-destructive">
              ⚠️ Losing access to your Google account means losing access to your wallet. Make sure your Google account is secure with 2FA enabled.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
