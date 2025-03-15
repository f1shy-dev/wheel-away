import { createContext, useContext, type ReactNode, useState, useCallback, useRef } from "react";
import { useSerial } from "@/hooks/useSerial";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { type CoreMessage, generateObject } from 'ai';
import { z } from 'zod';
// Define the structure of the productivity analysis result
interface ProductivityAnalysis {
    isProductive: boolean;
    confidence: number;
    reason: string;
}

// Define the context type
interface AIContextType {
    analysis: ProductivityAnalysis | null;
    getAIAnalysis: (blob: Blob) => Promise<void>;
}

// Create Google Gemini instance
const google = createGoogleGenerativeAI({
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
});


// Create context
const AIContext = createContext<AIContextType | undefined>(undefined);

// Create provider
export function AIProvider({ children }: { children: ReactNode }) {
    // Get screen capture and serial port functionality
    const { sendCommand, isConnected } = useSerial();

    // State
    const [analysis, setAnalysis] = useState<ProductivityAnalysis | null>(null);
    const refIsAnalyzing = useRef<boolean>(false);


    const getAIAnalysis = useCallback(async (blob: Blob) => {
        if (refIsAnalyzing.current) return;
        console.log('Analyzing screenshot');

        try {
            refIsAnalyzing.current = true;

            const Schema = z.object({
                isProductive: z.boolean().describe("Whether the user is being productive based on screen contents"),
                confidence: z.number().describe("Confidence score between 0 and 1"),
                reason: z.string().describe("Brief explanation of the productivity assessment")
            });

            // Generate structured analysis
            const result = await generateObject({
                model: google("gemini-2.0-flash-lite-preview-02-05"),
                schema: Schema,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyze this screenshot and determine if the person is being productive. Productive activities include work applications, coding, document editing, educational content, etc. Non-productive activities include social media, entertainment, games, etc. This is for the app "Productivity Monitor" (Also known as wheel away) - do not mention it in your response, or count that as productive (it would be like saying "I am productive because I am using the productivity monitor - kind of silly").'
                        },
                        {
                            type: 'image',
                            image: await blob.arrayBuffer()
                        }
                    ]
                }] satisfies CoreMessage[]
            });

            // Type assertion to make TypeScript happy
            const typedResult = result.object;

            console.log('Productivity analysis:', typedResult);
            setAnalysis(typedResult);

            // If user is not being productive, send command to Arduino
            if (isConnected) {
                await sendCommand(typedResult.isProductive === true ? 'OFF' : 'ON');
            }

        } catch (error) {
            console.error('Failed to analyze screenshot:', error);
            setAnalysis({
                isProductive: false,
                confidence: 0,
                reason: 'Failed to analyze screenshot'
            });
        } finally {
            refIsAnalyzing.current = false;
        }
    }, [sendCommand, isConnected]);

    return (
        <AIContext.Provider
            value={{
                analysis,
                getAIAnalysis
            }}
        >
            {children}
        </AIContext.Provider>
    );
}

// Custom hook
export const useAI = () => {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}; 