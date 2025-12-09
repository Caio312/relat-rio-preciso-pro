import { Statistics } from '@/types/potential';
import { AlertTriangle, HelpCircle, Shield } from 'lucide-react';

interface RiskCardsProps {
  stats: Statistics;
}

export function RiskCards({ stats }: RiskCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* High Risk Card */}
      <div className="risk-card-high">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Alto Risco</span>
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-risk-high" />
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground mb-1">
          {stats.severe.percentage.toFixed(1)}%
        </div>
        <p className="text-sm text-muted-foreground">
          {stats.severe.count} pontos
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2">
          &gt;90% probabilidade de corrosão
        </p>
      </div>

      {/* Uncertain Risk Card */}
      <div className="risk-card-uncertain">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Risco Incerto</span>
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-risk-uncertain" />
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground mb-1">
          {stats.uncertain.percentage.toFixed(1)}%
        </div>
        <p className="text-sm text-muted-foreground">
          {stats.uncertain.count} pontos
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2">
          Zona de transição
        </p>
      </div>

      {/* Low Risk Card */}
      <div className="risk-card-low">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Baixo Risco</span>
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-risk-low" />
          </div>
        </div>
        <div className="text-3xl font-bold text-foreground mb-1">
          {stats.low.percentage.toFixed(1)}%
        </div>
        <p className="text-sm text-muted-foreground">
          {stats.low.count} pontos
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2">
          &gt;90% probabilidade passiva
        </p>
      </div>
    </div>
  );
}
