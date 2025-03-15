import { createContext, useContext, type ReactNode, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface MousePosition {
    x: number;
    y: number;
}

interface MouseContextType {
    mousePos: MousePosition | null;
    isTracking: boolean;
    startTracking: () => void;
    stopTracking: () => void;
}

const MouseContext = createContext<MouseContextType | undefined>(undefined);

export function MouseProvider({ children }: { children: ReactNode }) {
    const [mousePos, setMousePos] = useState<MousePosition | null>(null);
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        let interval: number | undefined;

        if (isTracking) {
            const updateMousePosition = async () => {
                try {
                    const pos = await invoke<MousePosition>("get_mouse_position");
                    setMousePos(pos);
                } catch (e) {
                    console.error("Failed to get mouse position:", e);
                }
            };

            // Initial position
            updateMousePosition();

            // Update mouse position regularly
            interval = setInterval(updateMousePosition, 100) as unknown as number;
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isTracking]);

    const startTracking = () => {
        setIsTracking(true);
    };

    const stopTracking = () => {
        setIsTracking(false);
    };

    return (
        <MouseContext.Provider
            value={{
                mousePos,
                isTracking,
                startTracking,
                stopTracking
            }}
        >
            {children}
        </MouseContext.Provider>
    );
}

export function useMouse() {
    const context = useContext(MouseContext);
    if (context === undefined) {
        throw new Error("useMouse must be used within a MouseProvider");
    }
    return context;
} 