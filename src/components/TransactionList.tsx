import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { shortenAddress } from "@/lib/biconomy";

interface Transaction {
  id: string;
  to_address: string;
  amount?: string;
  status: string;
  tx_hash?: string;
  created_at: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card className="p-8 glass-effect text-center">
        <p className="text-muted-foreground">No transactions yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 glass-effect">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">To: {shortenAddress(tx.to_address)}</span>
                {tx.tx_hash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              {tx.amount && (
                <p className="text-sm text-muted-foreground">{tx.amount} ETH</p>
              )}
            </div>
            <Badge
              variant={tx.status === "submitted" ? "default" : "secondary"}
              className="ml-2"
            >
              {tx.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
