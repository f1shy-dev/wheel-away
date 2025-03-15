import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCapture } from "@/hooks/useCapture";
import { formatDuration } from "@/lib/utils";
import { ProductivityCard } from "@/components/ProductivityCard";

export function MainView() {
  const {
    captureInfo,
    isLoading,
    isActive,
    elapsedTime,
    startSensing,
    stopSensing,
    captureAndAnalyzeScreen
  } = useCapture();


  return (
    <div className="container px-3 py-4 grid gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productivity Monitor</h1>
          <p className="text-muted-foreground">
            Monitor your screen activity and track your productivity
          </p>
        </div>

        <Badge variant={isActive ? "default" : "outline"} className="px-3 py-1">
          {isActive ? "Monitoring" : "Idle"}
        </Badge>
      </div>

      {isActive && (
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xl font-semibold mb-1">
                Monitoring Active
              </p>
              <p className="text-3xl font-bold">
                {formatDuration(elapsedTime)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Screen Preview</CardTitle>
            <CardDescription>
              Latest screen capture
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-2">
            {captureInfo ? (
              <img
                src={captureInfo.blobUrl}
                alt="Screen Preview"
                className="max-w-full max-h-[400px] rounded-md object-contain shadow-sm"
              />
            ) : (
              <div className="flex items-center justify-center h-40 rounded-md bg-secondary">
                <p className="text-muted-foreground">No screen capture available</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="outline"
              onClick={captureAndAnalyzeScreen}
              disabled={isLoading}
            >
              {isLoading ? "Capturing..." : "Analyze Now"}
            </Button>
          </CardFooter>
        </Card>

        <ProductivityCard />
      </div>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Productivity Sensing</CardTitle>
          <CardDescription>
            Start or stop productivity monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              {isActive
                ? "Currently monitoring your productivity"
                : "Click the button below to start monitoring"
              }
            </p>
          </div>

          <Button
            size="lg"
            className={`w-48 h-16 text-lg ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            onClick={isActive ? stopSensing : startSensing}
          >
            {isActive ? "Stop Sensing" : "Start Sensing"}
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground text-center">
            {isActive
              ? "The application will monitor your productivity while active"
              : "Click start to begin monitoring your productivity"
            }
          </p>
        </CardFooter>
      </Card>

      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Recent productivity activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="border-b pb-2">
                <p className="font-semibold">Session started</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(Date.now() - elapsedTime).toLocaleString()}
                </p>
              </div>
              <div className="border-b pb-2">
                <p className="font-semibold">Current status</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <div>
                <p className="font-semibold">Duration</p>
                <p className="text-sm text-muted-foreground">{formatDuration(elapsedTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 