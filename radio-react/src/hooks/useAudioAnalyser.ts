import { useEffect, useState } from 'react';

/**
 * Hook to analyze audio frequencies and extract bass energy
 * Used for audio-reactive background animations
 *
 * Based on app.js lines 551-563 (getAudioEnergy function)
 */
export const useAudioAnalyser = (analyserNode: AnalyserNode | null): number => {
  const [audioEnergy, setAudioEnergy] = useState(0);

  useEffect(() => {
    if (!analyserNode) {
      setAudioEnergy(0);
      return;
    }

    const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
    let animationFrameId: number;

    const updateEnergy = () => {
      analyserNode.getByteFrequencyData(frequencyData);

      // Average bass frequencies (bins 0-10 ≈ 0-200Hz)
      // This captures the low-frequency content that creates the pulse effect
      let bassSum = 0;
      for (let i = 0; i < 10; i++) {
        bassSum += frequencyData[i];
      }

      // Normalize to 0-1 range
      const normalizedEnergy = (bassSum / 10) / 255;
      setAudioEnergy(normalizedEnergy);

      animationFrameId = requestAnimationFrame(updateEnergy);
    };

    updateEnergy();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [analyserNode]);

  return audioEnergy;
};
