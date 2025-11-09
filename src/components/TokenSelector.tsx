import { SUPPORTED_TOKENS, Token } from "@/config/tokens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TokenSelectorProps {
  selectedToken: string;
  onTokenChange: (tokenSymbol: string) => void;
}

export function TokenSelector({ selectedToken, onTokenChange }: TokenSelectorProps) {
  return (
    <Select value={selectedToken} onValueChange={onTokenChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select token" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(SUPPORTED_TOKENS).map((token) => (
          <SelectItem key={token.symbol} value={token.symbol}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{token.symbol}</span>
              <span className="text-sm text-muted-foreground">{token.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
