import type { ReactNode } from "react";
import { AppStateProvider } from "./AppStateProvider";
import { SerialProvider } from "./SerialProvider";
import { CaptureProvider } from "./CaptureProvider";
import { MouseProvider } from "./MouseProvider";
import { AIProvider } from "./AIProvider";

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <AppStateProvider>
            <SerialProvider>
                <AIProvider>
                    <CaptureProvider>
                        <MouseProvider>
                            {children}
                        </MouseProvider>
                    </CaptureProvider>
                </AIProvider>
            </SerialProvider>
        </AppStateProvider>
    );
} 