import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface CryptoCardProps {
  image: string;
  symbol: string;
  pair: string;
  price: string;
  change: string;
  volume: string;
}

const CryptoCard = ({ image, symbol, pair, price, change, volume }: CryptoCardProps) => {
  const navigate = useNavigate();
  const isPositive = !change.startsWith('-');

  const handleClick = () => {
    navigate(`/buy-coin/${symbol.toLowerCase()}`);
  };

  return (
    <Card
      className="p-4 bg-secondary border-border hover:bg-muted transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            <img src={image} alt={symbol} className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h3 className="font-bold">{symbol.toUpperCase()}</h3>
            <p className="text-xs text-muted-foreground">{pair}</p>
          </div>
        </div>
        <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold mb-1">{price}</p>
      <p className="text-xs text-muted-foreground">24h Volume: {volume}</p>
    </Card>
  );
};

export default CryptoCard;
