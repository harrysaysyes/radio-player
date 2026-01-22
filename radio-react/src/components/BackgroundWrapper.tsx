import { ReactNode, useEffect, useState } from "react";
import RetroGrid from "@/components/ui/retro-grid";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";

interface BackgroundWrapperProps {
  children: ReactNode;
}

export const BackgroundWrapper = ({ children }: BackgroundWrapperProps) => {
  const { analyserNode, currentTheme } = usePlayer();
  const [audioEnergy, setAudioEnergy] = useState(0);

  useEffect(() => {
    if (!analyserNode) return;

    const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
    let animationFrameId: number;

    const updateEnergy = () => {
      analyserNode.getByteFrequencyData(frequencyData);

      // Average bass frequencies (bins 0-10 ≈ 0-200Hz)
      let bassSum = 0;
      for (let i = 0; i < 10; i++) {
        bassSum += frequencyData[i];
      }

      setAudioEnergy((bassSum / 10) / 255); // Normalize to 0-1
      animationFrameId = requestAnimationFrame(updateEnergy);
    };

    updateEnergy();
    return () => cancelAnimationFrame(animationFrameId);
  }, [analyserNode]);

  // Determine background gradient based on theme
  const getBackgroundStyle = () => {
    switch (currentTheme) {
      case 'classicfm':
        return 'linear-gradient(135deg, #0a0000 0%, #1a0000 30%, #2a0505 70%, #0a0000 100%)';
      case 'reprezent':
        return 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 30%, #0f0f0f 70%, #050505 100%)';
      default:
        return 'linear-gradient(135deg, #0f3460 0%, #1a1f3a 50%, #16213e 100%)';
    }
  };

  // Determine Retro Grid color based on theme
  const getGridColor = () => {
    switch (currentTheme) {
      case 'classicfm':
        return 'text-yellow-400';
      case 'reprezent':
        return 'text-white';
      default:
        return 'text-purple-500';
    }
  };

  return (
    <div
      className="relative min-h-screen transition-all duration-600"
      style={{ background: getBackgroundStyle() }}
    >
      <RetroGrid
        className={cn(
          "opacity-80",
          getGridColor()
        )}
        style={{
          // Audio-reactive scaling (subtle pulsing with bass)
          transform: `scale(${1 + audioEnergy * 0.05})`,
          transition: 'transform 0.1s ease-out'
        } as React.CSSProperties}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
