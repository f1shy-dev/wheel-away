import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useSerial } from "@/hooks/useSerial";
import { RefreshCcw } from "lucide-react";

interface ConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  showWelcomeMessage?: boolean;
}

export function ConfigDialog({ open, onOpenChange, onComplete, showWelcomeMessage = false }: ConfigDialogProps) {
  const {
    serialPorts,
    selectedPort,
    setSelectedPort,
    isConnected,
    response,
    connect,
    fetchSerialPorts,
    isLoading: isSerialLoading
  } = useSerial();


  const [refreshingPorts, setRefreshingPorts] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle refreshing ports
  const handleRefreshPorts = async () => {
    setRefreshingPorts(true);
    await fetchSerialPorts();
    if (selectedPort) {
      await connect();
    }
    setRefreshingPorts(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="tracking-tight text-left">
            {showWelcomeMessage ? "Welcome to Wheel Away" : "Configuration"}
          </DialogTitle>
          {showWelcomeMessage && (
            <DialogDescription className="text-left">
              Configure your device settings to get started with Wheel Away.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="grid gap-6 pb-4">
          <div className="flex flex-col items-start gap-2 w-full">
            <Label className="text-right" htmlFor="device">Device</Label>
            <div className="flex gap-2 w-full">
              <Select
                value={selectedPort}
                onValueChange={async (value) => {
                  setSelectedPort(value);
                  setIsConnecting(true);
                  await connect();
                  setIsConnecting(false);
                }}
                disabled={isSerialLoading || refreshingPorts || isConnecting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {serialPorts.map((port) => (
                    <SelectItem key={port.port_name} value={port.port_name}>
                      {port.port_name} - {port.port_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefreshPorts}
                disabled={refreshingPorts}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            {isConnecting ? (
              <p className="text-sm text-muted-foreground">
                Connecting...
              </p>
            ) : (
              <div className="flex gap-2 flex-col">
                <p className="text-sm text-muted-foreground ">
                  {isConnected ? "Connected" : "Disconnected"}
                </p>
                <span className="text-xs text-muted-foreground font-mono">
                  {response}
                </span>
              </div>
            )}

          </div>

        </div>

        <DialogFooter>
          <Button onClick={onComplete}>
            {showWelcomeMessage ? "Start" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

