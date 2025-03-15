import { createContext, useContext, type ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAI } from "./AIProvider";

interface ScreenCapture {
    data: string;
    width: number;
    height: number;
}

export interface CaptureInfo {
    blob: Blob;
    blobUrl: string;
    width: number;
    height: number;
}

interface CaptureContextType {
    captureInfo: CaptureInfo | null;
    isLoading: boolean;
    isActive: boolean;
    elapsedTime: number;
    captureInterval: number;
    captureAndAnalyzeScreen: () => Promise<void>;
    startSensing: () => void;
    stopSensing: () => void;
    updateCaptureInterval: (interval: number) => void;
}

const CaptureContext = createContext<CaptureContextType | undefined>(undefined);

export function CaptureProvider({ children }: { children: ReactNode }) {
    const [captureInfo, setCaptureInfo] = useState<CaptureInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [captureInterval, setCaptureInterval] = useState(10000); // 10 seconds by default
    const [isActive, setIsActive] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number>(0);
    const { getAIAnalysis } = useAI();

    // Use ref to keep track of the previous blob URL to revoke it
    const prevBlobUrlRef = useRef<string | null>(null);

    // Clean up blob URLs when component unmounts
    useEffect(() => {
        return () => {
            if (prevBlobUrlRef.current) {
                console.log("Revoking previous blob URL on unmount");
                URL.revokeObjectURL(prevBlobUrlRef.current);
            }
        };
    }, []);

    const captureAndAnalyzeScreen = useCallback(async () => {
        console.log("Starting screen capture");
        try {
            setIsLoading(true);
            const capture = await invoke<ScreenCapture>("capture_screen");

            // Convert the base64 data to a Blob
            const base64Data = capture.data.replace(/^data:image\/jpeg;base64,/, "");
            const byteCharacters = atob(base64Data);
            const byteArrays = [];

            for (let i = 0; i < byteCharacters.length; i += 512) {
                const slice = byteCharacters.slice(i, i + 512);
                const byteNumbers = new Array(slice.length);

                for (let j = 0; j < slice.length; j++) {
                    byteNumbers[j] = slice.charCodeAt(j);
                }

                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            const blob = new Blob(byteArrays, { type: "image/jpeg" });
            const blobUrl = URL.createObjectURL(blob);

            if (prevBlobUrlRef.current) {
                URL.revokeObjectURL(prevBlobUrlRef.current);
            }

            prevBlobUrlRef.current = blobUrl;

            setCaptureInfo({
                blob,
                blobUrl,
                width: capture.width,
                height: capture.height
            });

            await getAIAnalysis(blob);

        } catch (e) {
            console.error("Failed to capture screen:", e);
        } finally {
            setIsLoading(false);
        }
    }, [getAIAnalysis]);


    // Track elapsed time
    useEffect(() => {
        let timerInterval: number | undefined;

        if (isActive && startTime) {
            timerInterval = setInterval(() => {
                const currentTime = Date.now();
                setElapsedTime(currentTime - startTime);
            }, 1000) as unknown as number;
        }

        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [isActive, startTime]);

    useEffect(() => {
        let timeout: NodeJS.Timeout | undefined;

        const wrap = () => {
            captureAndAnalyzeScreen();
            if (isActive) {
                console.log("Sensing contuning setTimeout - inside wrap function", captureInterval);
                timeout = setTimeout(wrap, captureInterval);
            }
        }

        if (isActive) {
            console.log("Sensing started setTimeout - outside wrap function", captureInterval);
            timeout = setTimeout(wrap, captureInterval);
        }

        return () => clearTimeout(timeout);
    }, [captureInterval, isActive])

    // Start productivity sensing
    const startSensing = useCallback(() => {
        setIsActive(true);
        setStartTime(Date.now());
        captureAndAnalyzeScreen();

    }, [captureAndAnalyzeScreen]);

    // Stop productivity sensing
    const stopSensing = useCallback(() => {
        setIsActive(false);
    }, []);

    // Update capture interval
    const updateCaptureInterval = useCallback((interval: number) => {
        setCaptureInterval(interval);
    }, []);

    return (
        <CaptureContext.Provider
            value={{
                captureInfo,
                isLoading,
                isActive,
                elapsedTime,
                captureInterval,
                captureAndAnalyzeScreen,
                startSensing,
                stopSensing,
                updateCaptureInterval
            }}
        >
            {children}
        </CaptureContext.Provider>
    );
}

export function useCapture() {
    const context = useContext(CaptureContext);
    if (context === undefined) {
        throw new Error("useCapture must be used within a CaptureProvider");
    }
    return context;
} 