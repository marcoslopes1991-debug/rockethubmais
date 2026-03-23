import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSoundEnabled, setSoundEnabled } from "@/lib/sounds";

const SoundToggle = () => {
  const [enabled, setEnabled] = useState(isSoundEnabled);

  const toggle = () => {
    const next = !enabled;
    setSoundEnabled(next);
    setEnabled(next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title={enabled ? "Desativar sons" : "Ativar sons"}>
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </Button>
  );
};

export default SoundToggle;
