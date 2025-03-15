import { createContext, useContext, type ReactNode, useState } from "react";

type AppView = "welcome" | "main";

interface AppStateContextType {
  currentView: AppView;
  configOpen: boolean;
  debugOpen: boolean;
  showWelcomeView: () => void;
  showMainView: () => void;
  openConfig: () => void;
  closeConfig: () => void;
  openDebug: () => void;
  closeDebug: () => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<AppView>("welcome");
  const [configOpen, setConfigOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  
  const showWelcomeView = () => setCurrentView("welcome");
  const showMainView = () => setCurrentView("main");
  
  const openConfig = () => setConfigOpen(true);
  const closeConfig = () => setConfigOpen(false);
  
  const openDebug = () => setDebugOpen(true);
  const closeDebug = () => setDebugOpen(false);
  
  return (
    <AppStateContext.Provider
      value={{
        currentView,
        configOpen,
        debugOpen,
        showWelcomeView,
        showMainView,
        openConfig,
        closeConfig,
        openDebug,
        closeDebug
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
} 