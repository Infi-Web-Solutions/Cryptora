import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";

const AdminBorrowRequests = () => {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPendingRequests();
      if (response.success) {
        setPendingRequests(response.pendingRequests || []);
      } else {
        setError(response.error || "Failed to fetch requests");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (walletAddress: string) => {
    try {
      const response = await adminApi.approveRequest(walletAddress);
      if (response.success) {
        toast({
          title: "Approved",
          description: response.message || "Request approved successfully",
        });
        fetchRequests(); // Refresh list
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to approve",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to approve",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (walletAddress: string) => {
    try {
      const response = await adminApi.rejectRequest(walletAddress);
      if (response.success) {
        toast({
          title: "Rejected",
          description: response.message || "Request rejected successfully",
        });
        fetchRequests(); // Refresh list
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to reject",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reject",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Pending Borrow Requests</h1>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && pendingRequests.length === 0 && (
          <Card className="p-4 bg-gray-100 border-gray-300">
            <p className="text-gray-600">No pending requests found.</p>
          </Card>
        )}

        {!loading && !error && pendingRequests.length > 0 && (
          <div className="space-y-4">
            {pendingRequests.map((request, index) => (
              <Card key={index} className="p-4 border">
                <div className="flex justify-between items-center">
                  <div>
                    <p><strong>Wallet:</strong> {request.walletAddress}</p>
                    <p><strong>Amount:</strong> {request.amount || 'N/A'}</p>
                    <p><strong>Date Joined:</strong> {request.dateJoined ? new Date(request.dateJoined).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="space-x-2">
                    <Button onClick={() => handleApprove(request.walletAddress)} variant="default">
                      Approve
                    </Button>
                    <Button onClick={() => handleReject(request.walletAddress)} variant="destructive">
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBorrowRequests;
