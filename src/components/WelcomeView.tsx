import { useState } from "react";
import { ConfigDialog } from "@/components/ConfigDialog";
import { useAppState } from "@/hooks/useAppState";

export function WelcomeView() {
  const { showMainView } = useAppState();
  const [configOpen, setConfigOpen] = useState(true);

  const handleComplete = () => {
    setConfigOpen(false);
    showMainView();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <ConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onComplete={handleComplete}
        showWelcomeMessage={true}
      />
    </div>
  );
} 