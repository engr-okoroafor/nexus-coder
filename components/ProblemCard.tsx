import React from 'react';
import type { Problem } from '../types';
import { WarningIcon } from './Icons';

interface ProblemCardProps {
  problem: Problem;
  isFixing: boolean;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem, isFixing }) => {
  return (
    <div className={`bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-3 transition-all duration-300 ${isFixing ? 'animate-pulse ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/20' : ''}`}>
        <WarningIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
            <p className="text-sm font-semibold text-yellow-300">{problem.file}</p>
            <p className="text-xs text-gray-300">{problem.description}</p>
        </div>
    </div>
  );
};