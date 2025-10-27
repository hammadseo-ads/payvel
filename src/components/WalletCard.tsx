import { Copy, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/biconomy";
import { toast } from "sonner";

interface WalletCardProps {
  address: string;
  balance?: string;
}

export function WalletCard({ address, balance = "0.00" }: WalletCardProps) {
  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const openExplorer = () => {
    window.open(`https://sepolia.basescan.org/address/${address}`, "_blank");
  };

  return (
    <Card className="p-6 glass-effect">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Your Wallet</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
            Base Sepolia
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold">{balance} ETH</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{shortenAddress(address)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAddress}
              className="h-6 w-6 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openExplorer}
              className="h-6 w-6 p-0"
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
