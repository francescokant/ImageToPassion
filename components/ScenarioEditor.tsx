import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { BackIcon, LoadingSpinner, SparklesIcon } from './IconComponents';

interface ScenarioEditorProps {
  initialScenario: string;
  onConfirm: (scenario: string) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ initialScenario, onConfirm, onBack, isLoading }) => {
  const [scenario, setScenario] = useState(initialScenario);

  useEffect(() => {
    setScenario(initialScenario);
  }, [initialScenario]);

  const handleConfirm = () => {
    onConfirm(scenario);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-text-primary">Rivedi il tuo Scenario</h2>
        <p className="text-text-secondary mt-2 max-w-md mx-auto">
          L'IA ha creato uno scenario. Sentiti libero di perfezionarlo per rispecchiare perfettamente la tua visione.
        </p>
      </div>
      <div>
        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          className="w-full h-36 bg-white/5 border border-border-glass rounded-2xl shadow-inner-soft p-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-border-focus resize-none transition-all"
          placeholder="Descrivi lo scenario..."
          disabled={isLoading}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button onClick={onBack} disabled={isLoading} variant="secondary">
          <BackIcon className="w-5 h-5" />
          Indietro
        </Button>
        <Button onClick={handleConfirm} disabled={isLoading || scenario.trim() === ''} variant="primary">
          {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
          {isLoading ? "Generando l'immagine..." : 'Genera Ritratto'}
        </Button>
      </div>
    </div>
  );
};