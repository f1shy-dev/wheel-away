import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSerial } from "@/hooks/useSerial";
import { useCapture } from "@/hooks/useCapture";
import { useMouse } from "@/hooks/useMouse";
import { formatDuration } from "@/lib/utils";

interface DebugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebugDialog({ open, onOpenChange }: DebugDialogProps) {
  const [activeTab, setActiveTab] = useState("serial");

  const {
    selectedPort,
    isConnected,
    response,
    connect,
    disconnect,
    sendCommand
  } = useSerial();

  const {
    captureInfo,
    isLoading: isCaptureLoading,
    captureAndAnalyzeScreen,
    elapsedTime
  } = useCapture();

  const { mousePos, startTracking, stopTracking, isTracking } = useMouse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>Debug Controls</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="serial">Serial</TabsTrigger>
            <TabsTrigger value="capture">Screen Capture</TabsTrigger>
            <TabsTrigger value="mouse">Mouse</TabsTrigger>
          </TabsList>

          <TabsContent value="serial" className="mt-0">
            <div className="pb-2">
              <h3 className="text-lg font-semibold">Serial Connection</h3>
              <p className="text-sm text-muted-foreground">
                {selectedPort ? `Port: ${selectedPort}` : "No port selected"}
              </p>
            </div>
            <div className="space-y-4 overflow-y-scroll max-h-56">
              <div className="flex gap-2">
                {!isConnected ? (
                  <Button
                    onClick={connect}
                    disabled={!selectedPort}
                    variant="default"
                  >
                    Connect
                  </Button>
                ) : (
                  <Button
                    onClick={disconnect}
                    variant="destructive"
                  >
                    Disconnect
                  </Button>
                )}
              </div>

              {isConnected && (
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => sendCommand("ON")} variant="outline">
                    LED ON
                  </Button>
                  <Button onClick={() => sendCommand("OFF")} variant="outline">
                    LED OFF
                  </Button>
                  <Button onClick={() => sendCommand("BLINK")} variant="outline">
                    BLINK
                  </Button>
                </div>
              )}

              <div className="p-3 bg-secondary rounded-md h-20 overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {response || "No response"}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="capture" className="mt-0">
            <div className="pb-2">
              <h3 className="text-lg font-semibold">Screen Capture</h3>
              <p className="text-sm text-muted-foreground">
                {captureInfo
                  ? `Resolution: ${captureInfo.width}x${captureInfo.height}`
                  : "No capture available"}
              </p>
            </div>
            <div className="space-y-4 overflow-y-scroll max-h-56">
              <div className="flex gap-2">
                <Button
                  onClick={captureAndAnalyzeScreen}
                  disabled={isCaptureLoading}
                  variant="default"
                >
                  {isCaptureLoading ? "Capturing..." : "Capture Now"}
                </Button>
              </div>

              <div className="p-2 bg-secondary rounded-md">
                <p className="text-sm mb-1">Session time: {formatDuration(elapsedTime)}</p>
              </div>

              {captureInfo && (
                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-2">
                    <img
                      src={captureInfo.blobUrl}
                      alt="Screen capture"
                      className="w-full object-contain"
                    />
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mouse" className="mt-0">
            <div className="pb-2">
              <h3 className="text-lg font-semibold">Mouse Position</h3>
              <p className="text-sm text-muted-foreground">
                Track mouse movements
              </p>
            </div>
            <div className="space-y-4 overflow-y-scroll max-h-56">
              <div className="flex gap-2">
                {!isTracking ? (
                  <Button
                    onClick={startTracking}
                    variant="default"
                  >
                    Start Tracking
                  </Button>
                ) : (
                  <Button
                    onClick={stopTracking}
                    variant="destructive"
                  >
                    Stop Tracking
                  </Button>
                )}
              </div>

              <div className="p-4 bg-secondary rounded-md text-center">
                {mousePos ? (
                  <p className="font-mono">X: {mousePos.x}, Y: {mousePos.y}</p>
                ) : (
                  <p className="text-muted-foreground">Not tracking</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 