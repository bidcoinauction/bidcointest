import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getApiStatus, updateApiKey, testApiConnection } from '@/lib/unleashApi';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const { toast } = useToast();

  // Initialize with current API key, but mask it
  useEffect(() => {
    if (isOpen) {
      const currentApiKey = getApiStatus().apiKey;
      if (currentApiKey) {
        const firstFour = currentApiKey.substring(0, 4);
        const lastFour = currentApiKey.substring(currentApiKey.length - 4);
        const masked = `${firstFour}${'*'.repeat(Math.max(0, currentApiKey.length - 8))}${lastFour}`;
        setApiKey('');
      } else {
        setApiKey('');
      }
      setTestResult(null);
    }
  }, [isOpen]);

  const handleUpdateApiKey = async () => {
    try {
      if (!apiKey.trim()) {
        toast({
          title: "Error",
          description: "API key cannot be empty",
          variant: "destructive"
        });
        return;
      }

      updateApiKey(apiKey.trim());
      
      toast({
        title: "API Key Updated",
        description: "Your UnleashNFTs API key has been updated. Testing connection...",
      });
      
      // Test the connection with the new key
      await testConnection();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update API key",
        variant: "destructive"
      });
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      const result = await testApiConnection();
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to the UnleashNFTs API.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      });
      
      toast({
        title: "Test Failed",
        description: "Could not test API connection",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#1a1f2c] rounded-lg w-full max-w-md overflow-hidden border border-[#374151]">
        <div className="flex justify-between items-center p-4 border-b border-[#374151]">
          <h2 className="text-xl font-semibold text-white">UnleashNFTs API Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-4">
              To access NFT data, you need a valid UnleashNFTs API key. Enter your API key below to connect to the service.
            </p>
            
            <div className="mb-4">
              <Label htmlFor="apiKey" className="text-white mb-2 block">
                API Key
              </Label>
              <Input
                id="apiKey"
                type="text"
                placeholder="Enter your UnleashNFTs API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-[#111827] border-[#374151] text-white"
              />
              <p className="text-gray-500 text-xs mt-1">
                Don't have an API key? <a href="https://unleashnfts.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Sign up at unleashnfts.com</a>
              </p>
            </div>

            {testResult && (
              <div className={`p-3 mb-4 rounded text-sm ${testResult.success ? 'bg-green-900/20 border border-green-900/50 text-green-400' : 'bg-red-900/20 border border-red-900/50 text-red-400'}`}>
                {testResult.message}
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 justify-end">
            <Button
              onClick={testConnection}
              disabled={isTestingConnection || !apiKey.trim()}
              variant="outline"
              className="text-indigo-400 border-indigo-600"
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              onClick={handleUpdateApiKey}
              disabled={isTestingConnection || !apiKey.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Update API Key
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}