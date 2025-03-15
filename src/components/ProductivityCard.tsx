import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useAI } from "@/providers/AIProvider";
import { useCapture } from "@/hooks/useCapture";
import { formatDuration } from "@/lib/utils";

export function ProductivityCard() {
    const {
        analysis,
    } = useAI();

    const { isLoading, isActive, elapsedTime, updateCaptureInterval, captureInterval } = useCapture();

    // Function to determine badge color based on productivity
    const getBadgeVariant = () => {
        if (!analysis) return "outline";
        return analysis.isProductive ? "default" : "destructive";
    };

    // Function to format confidence as percentage
    const formatConfidence = (confidence: number) => {
        return `${Math.round(confidence * 100)}%`;
    };

    // Function to handle interval change
    const handleIntervalChange = (value: number[]) => {
        updateCaptureInterval(value[0] * 1000); // Convert to milliseconds
    };

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Productivity Analysis</CardTitle>
                    {analysis && (
                        <Badge variant={getBadgeVariant()} className="px-3 py-1">
                            {analysis.isProductive ? "Productive" : "Not Productive"}
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    AI-powered productivity monitoring
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
                {isActive ? (
                    <>
                        {isLoading && (
                            <div className="flex justify-center">
                                <p className="text-sm text-muted-foreground animate-pulse">
                                    Capturing and analyzing your screen...
                                </p>
                            </div>
                        )}

                        {analysis ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <p className="font-medium">Status:</p>
                                    <p className="font-semibold">
                                        {analysis.isProductive ? "Productive" : "Not Productive"}
                                    </p>
                                </div>

                                <div className="flex justify-between items-center border-b pb-2">
                                    <p className="font-medium">Confidence:</p>
                                    <p className="font-semibold">{formatConfidence(analysis.confidence)}</p>
                                </div>

                                <div className="pt-1">
                                    <p className="font-medium mb-1">Reason:</p>
                                    <p className="text-sm bg-muted p-2 rounded">{analysis.reason}</p>
                                </div>

                                <div className="pt-3">
                                    <p className="text-sm font-medium mb-2">Monitoring Interval: {captureInterval / 1000}s</p>
                                    <Slider
                                        defaultValue={[captureInterval / 1000]}
                                        min={5}
                                        max={30}
                                        step={5}
                                        onValueChange={handleIntervalChange}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-40">
                                <p className="text-muted-foreground">
                                    Waiting for first analysis...
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-muted-foreground">
                            Start sensing to analyze productivity
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-center">
                <p className="text-xs text-muted-foreground text-center">
                    {isActive ? `Monitoring for ${formatDuration(elapsedTime)}` : "Monitoring inactive"}
                </p>
            </CardFooter>
        </Card>
    );
} 