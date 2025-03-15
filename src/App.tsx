import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface MousePosition {
  x: number;
  y: number;
}

interface ScreenCapture {
  data: string;
  width: number;
  height: number;
}

interface CaptureInfo {
  blobUrl: string;
  width: number;
  height: number;
}

function App() {
  const [mousePos, setMousePos] = useState<MousePosition | null>(null);
  const [captureInfo, setCaptureInfo] = useState<CaptureInfo | null>(null);
  const [autoCapture, setAutoCapture] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Use ref to keep track of the previous blob URL to revoke it
  const prevBlobUrlRef = useRef<string | null>(null);

  // Set up logging when component mounts
  useEffect(() => {
    console.log("App component mounted");
    return () => {
      console.log("App component unmounted");
    };
  }, []);

  useEffect(() => {
    const updateMousePosition = async () => {
      try {
        const pos = await invoke<MousePosition>("get_mouse_position");
        setMousePos(pos);
      } catch (e) {
        console.error("Failed to get mouse position:", e);
      }
    };

    console.log("Setting up mouse position interval");
    // Update mouse position every 1ms
    const interval = setInterval(updateMousePosition, 1);

    return () => {
      console.log("Clearing mouse position interval");
      clearInterval(interval);
    };
  }, []);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (prevBlobUrlRef.current) {
        console.log("Revoking previous blob URL on unmount");
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
    };
  }, []);

  const captureScreen = useCallback(async () => {
    console.log("Starting screen capture");
    try {
      setLoading(true);
      console.log("Invoking capture_screen");
      const capture = await invoke<ScreenCapture>("capture_screen");
      console.log("Screen capture received", {
        width: capture.width,
        height: capture.height,
        dataLength: capture.data.length
      });
      
      // Convert the base64 data to a Blob
      console.log("Converting base64 to blob");
      const base64Data = capture.data.replace(/^data:image\/png;base64,/, "");
      console.log("Base64 data length (after stripping prefix):", base64Data.length);
      
      const byteCharacters = atob(base64Data);
      console.log("Decoded base64 length:", byteCharacters.length);
      
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
      
      console.log("Created byte arrays:", byteArrays.length);
      
      const blob = new Blob(byteArrays, { type: "image/png" });
      console.log("Created blob, size:", blob.size);
      
      const blobUrl = URL.createObjectURL(blob);
      console.log("Created blob URL:", blobUrl);
      
      // Revoke the old blob URL to prevent memory leaks
      if (prevBlobUrlRef.current) {
        console.log("Revoking previous blob URL:", prevBlobUrlRef.current);
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
      
      prevBlobUrlRef.current = blobUrl;
      
      console.log("Setting capture info");
      setCaptureInfo({
        blobUrl,
        width: capture.width,
        height: capture.height
      });
    } catch (e) {
      console.error("Failed to capture screen:", e);
      console.error("Error details:", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    } finally {
      console.log("Finished capture screen process");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    
    if (autoCapture) {
      console.log("Auto capture enabled, setting up interval");
      // Initial capture
      captureScreen();
      
      // Set up interval (every 5 seconds)
      interval = setInterval(captureScreen, 5000) as unknown as number;
      console.log("Auto capture interval set");
    } else {
      console.log("Auto capture disabled");
    }
    
    return () => {
      if (interval) {
        console.log("Clearing auto capture interval");
        clearInterval(interval);
      }
    };
  }, [autoCapture, captureScreen]);

  const toggleAutoCapture = () => {
    console.log("Toggling auto capture from", autoCapture, "to", !autoCapture);
    setAutoCapture(!autoCapture);
  };

  return (
    <main className="m-0 pt-[10vh] flex flex-col justify-center items-center text-center font-sans">
      <h1 className="text-2xl font-semibold mb-6">Wheel Away</h1>
      
      <div className="mx-auto my-8 p-4 bg-white/10 dark:bg-white/5 rounded-lg max-w-xs">
        <h2 className="m-0 mb-4 text-lg font-medium text-indigo-500">Mouse Position</h2>
        {mousePos ? (
          <p className="m-0 font-mono text-base">X: {mousePos.x}, Y: {mousePos.y}</p>
        ) : (
          <p className="m-0 font-mono text-base">Loading mouse position...</p>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 my-8 mx-auto w-4/5">
        <button 
          type="button"
          onClick={captureScreen} 
          disabled={loading || autoCapture}
          className="min-w-[200px] bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg shadow transition"
        >
          {loading ? "Capturing..." : "Capture Screen"}
        </button>
        
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoCapture}
            onChange={toggleAutoCapture}
            className="rounded text-indigo-500 focus:ring-indigo-500"
          />
          Auto-capture every 5 seconds
        </label>
      </div>

      <div className="my-8 mx-auto max-w-[90%] text-center">
        {captureInfo ? (
          <div>
            <h2 className="text-xl font-medium mb-4">Screen Capture</h2>
            <img 
              src={captureInfo.blobUrl} 
              alt="Screen Capture" 
              className="max-w-full max-h-[70vh] rounded-lg shadow-lg dark:shadow-xl my-4"
              onError={(e) => {
                console.error("Image failed to load:", e);
              }}
              onLoad={() => {
                console.log("Image loaded successfully");
              }}
            />
            <p className="font-mono text-opacity-70 my-2">
              Resolution: {captureInfo.width} x {captureInfo.height}
            </p>
          </div>
        ) : (
          <div className="p-8 bg-black/5 dark:bg-white/5 rounded-lg my-8 mx-auto max-w-md">
            <p className="my-2 opacity-70 font-bold">No screen capture available</p>
            <p className="my-2 opacity-70">Click the capture button to take a screenshot</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
