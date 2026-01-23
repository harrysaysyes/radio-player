import { ReactNode } from "react";
import RetroGrid from "@/components/ui/retro-grid";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";
import { useAudioAnalyser } from "@/hooks/useAudioAnalyser";

interface BackgroundWrapperProps {
  children: ReactNode;
}

export const BackgroundWrapper = ({ children }: BackgroundWrapperProps) => {
  const { analyserNode, currentTheme } = usePlayer();
  const audioEnergy = useAudioAnalyser(analyserNode);

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
