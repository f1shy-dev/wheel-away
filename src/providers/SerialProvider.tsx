import { createContext, useContext, type ReactNode, useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface SerialPortDetails {
    port_name: string;
    port_type: string;
}

interface SerialContextType {
    serialPorts: SerialPortDetails[];
    selectedPort: string;
    setSelectedPort: (port: string) => void;
    isConnected: boolean;
    response: string;
    isLoading: boolean;
    isConnecting: boolean;
    fetchSerialPorts: () => Promise<void>;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    sendCommand: (command: string) => Promise<void>;
}

const SerialContext = createContext<SerialContextType | undefined>(undefined);

export function SerialProvider({ children }: { children: ReactNode }) {
    const [serialPorts, setSerialPorts] = useState<SerialPortDetails[]>([]);
    const [selectedPort, setSelectedPort] = useState<string>("");
    const [isConnected, setIsConnected] = useState(false);
    const [response, setResponse] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const fetchSerialPorts = useCallback(async () => {
        try {
            setIsLoading(true);
            const ports = await invoke<SerialPortDetails[]>("list_serial_ports");
            setSerialPorts(ports);
            console.log("Available serial ports:", ports);
        } catch (error) {
            console.error("Failed to list serial ports:", error);
            setResponse(`Failed to list serial ports: ${error}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const connect = async () => {
        if (!selectedPort) {
            setResponse("No port selected");
            return;
        }

        try {
            setIsConnecting(true);
            const result = await invoke<string>("connect_to_arduino", { portName: selectedPort });
            console.log("Connection result:", result);
            setIsConnected(true);
            setResponse("Connected to Arduino");
        } catch (error) {
            console.error("Failed to connect to Arduino:", error);
            setResponse(`Connection failed: ${error}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = async () => {
        try {
            const result = await invoke<string>("disconnect_arduino");
            console.log("Disconnect result:", result);
            setIsConnected(false);
            setResponse("Disconnected from Arduino");
        } catch (error) {
            console.error("Failed to disconnect from Arduino:", error);
            setResponse(`Disconnect failed: ${error}`);
        }
    };

    const sendCommand = async (command: string) => {
        try {
            const response = await invoke<string>("send_arduino_command", { command });
            console.log("Command response:", response);
            setResponse(response);
        } catch (error) {
            console.error(`Failed to send command ${command}:`, error);
            setResponse(`Command failed: ${error}`);
        }
    };

    // Load serial ports when provider mounts
    useEffect(() => {
        fetchSerialPorts();
    }, [fetchSerialPorts]);

    return (
        <SerialContext.Provider
            value={{
                serialPorts,
                selectedPort,
                setSelectedPort,
                isConnected,
                response,
                isLoading,
                isConnecting,
                fetchSerialPorts,
                connect,
                disconnect,
                sendCommand
            }}
        >
            {children}
        </SerialContext.Provider>
    );
}

export function useSerial() {
    const context = useContext(SerialContext);
    if (context === undefined) {
        throw new Error("useSerial must be used within a SerialProvider");
    }
    return context;
} 