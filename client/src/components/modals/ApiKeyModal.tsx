import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (apiKey: string) => void;
}

export function ApiKeyModal({ open, onOpenChange, onSave }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API key.'
      });
      return;
    }

    setIsSubmitting(true);
    setTestResult(null);

    try {
      // In our updated architecture, we use an API endpoint to test connectivity
      const response = await fetch('/api/unleash/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey })
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'API connection successful! You can now access NFT data.'
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'API connection failed. Please check your key and try again.'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection error. Please try again later.'
      });
      console.error('API test error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(apiKey);
    }
    
    // Save to localStorage for persistence
    localStorage.setItem('unleash_api_key', apiKey);
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Key Configuration</DialogTitle>
          <DialogDescription>
            Enter your UnleashNFTs API key to access NFT data and valuations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              placeholder="Enter your API key"
              className="col-span-3"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          
          {testResult && (
            <Alert className={testResult.success ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}>
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertDescription>{testResult.message}</AlertDescription>
              </div>
            </Alert>
          )}
          
          <div className="flex justify-between items-center">
            <a 
              href="https://app.unleashnfts.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-3 w-3" />
              Get an API key
            </a>
            
            <Button 
              variant="outline" 
              onClick={handleTestApiKey}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={!testResult?.success}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}