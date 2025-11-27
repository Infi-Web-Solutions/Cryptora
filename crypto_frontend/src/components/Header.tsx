import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bitcoin } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { disconnectWallet } = useWallet();
  const { toast } = useToast();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      disconnectWallet();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      navigate('/connect-wallet');
    } catch (error) {
      console.error('Logout error:', error);
      // Still disconnect and navigate even if API fails
      disconnectWallet();
      navigate('/connect-wallet');
    }
  };
  
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <Bitcoin className="w-6 h-6 text-primary" />
            <span>CryptoDashboard</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className={`hover:text-primary transition-colors ${isActive('/dashboard') ? 'text-primary' : 'text-foreground'}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/portfolio" 
              className={`hover:text-primary transition-colors ${isActive('/portfolio') ? 'text-primary' : 'text-foreground'}`}
            >
              Portfolio
            </Link>
            <Link 
              to="/transactions" 
              className={`hover:text-primary transition-colors ${isActive('/transactions') ? 'text-primary' : 'text-foreground'}`}
            >
              Transactions
            </Link>
            <button
              onClick={handleLogout}
              className="text-foreground hover:text-primary transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
