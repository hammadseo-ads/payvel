import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const Receive = () => {
  const { smartAccountAddress } = useAuth();
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
            <h1 className="text-3xl font-bold mb-2">Receive</h1>
            <p className="text-muted-foreground">Share your address to receive funds</p>
          </div>

          <Card className="p-8 glass-effect text-center space-y-6">
            <div className="inline-block p-4 bg-white rounded-2xl">
              <QRCodeSVG
                value={smartAccountAddress || ""}
                size={256}
                level="H"
                includeMargin
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Your Wallet Address</Label>
              <div className="flex items-center gap-2 p-4 rounded-lg bg-background/50 font-mono text-sm break-all">
                {smartAccountAddress}
              </div>
              <Button
                onClick={copyAddress}
                variant="outline"
                className="w-full gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Address
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Only send Base Sepolia testnet ETH to this address
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Receive;

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
