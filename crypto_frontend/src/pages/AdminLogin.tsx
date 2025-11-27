import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/lib/api";

const AdminLogin = () => {
  const [wallet, setWallet] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<{ text: string; type: 'success' | 'error' }[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessages([]);

    try {
      const response = await userApi.adminLogin(wallet, password);
      if (response.success) {
        setMessages([{ text: "Admin logged in successfully.", type: 'success' }]);
        toast({
          title: "Admin Login Successful",
          description: "Redirecting to admin panel...",
        });
        setTimeout(() => {
          navigate("/admin/borrow-requests");
        }, 1500);
      } else {
        setMessages([{ text: response.error || "Login failed.", type: 'error' }]);
      }
    } catch (error: any) {
      setMessages([{ text: error.message || "Login failed.", type: 'error' }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 bg-card border-border">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="wallet">Wallet Address</Label>
            <Input
              id="wallet"
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Enter wallet address"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="mt-1"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
        
        {messages.length > 0 && (
          <div className="mt-6 space-y-2">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded ${
                  msg.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminLogin;
