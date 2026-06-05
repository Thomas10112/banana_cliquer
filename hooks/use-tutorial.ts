import { useState } from 'react';

export function useTutorial() {
  const [step, setStep] = useState(-1);
  return {
    step,
    isActive: step >= 0,
    start:    () => setStep(0),
    next:     () => setStep(s => s + 1),
    end:      () => setStep(-1),
  };
}
