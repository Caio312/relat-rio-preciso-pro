import { Statistics } from '@/types/potential';
import { BarChart3 } from 'lucide-react';

interface StatsSummaryProps {
  stats: Statistics;
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  return (
    <div className="section-box">
      <h4 className="flex items-center gap-2 text-sm font-semibold mb-4">
        <BarChart3 className="w-4 h-4 text-primary" />
        Resumo Numérico
      </h4>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Média Global</span>
          <span className="font-mono font-semibold">{stats.mean.toFixed(0)} mV</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Desvio Padrão</span>
          <span className="font-mono font-semibold">{stats.stdDev.toFixed(0)} mV</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Mínimo</span>
          <span className="font-mono font-semibold text-risk-high">{stats.min.toFixed(0)} mV</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">Máximo</span>
          <span className="font-mono font-semibold text-risk-low">{stats.max.toFixed(0)} mV</span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">Total de Pontos</span>
          <span className="font-mono font-semibold">{stats.total}</span>
        </div>
      </div>
    </div>
  );
}
