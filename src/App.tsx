import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { MainView } from "@/components/MainView";
import { WelcomeView } from "@/components/WelcomeView";
import { ConfigDialog } from "@/components/ConfigDialog";
import { DebugDialog } from "@/components/DebugDialog";
import { useAppState } from "@/hooks/useAppState";
import "./App.css";

function App() {
  const {
    currentView,
    configOpen,
    debugOpen,
    closeConfig,
    closeDebug
  } = useAppState();

  // Log component mount for debugging
  useEffect(() => {
    console.log("App component mounted");
    return () => {
      console.log("App component unmounted");
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {currentView === "main" && <Navbar />}

      <main className="flex-1">
        {currentView === "welcome" ? (
          <WelcomeView />
        ) : (
          <MainView />
        )}
      </main>

      {/* Dialogs */}
      <ConfigDialog
        open={configOpen}
        onOpenChange={closeConfig}
        onComplete={closeConfig}
      />

      <DebugDialog
        open={debugOpen}
        onOpenChange={closeDebug}
      />
    </div>
  );
}

export default App;
