import { GradientPoint } from '@/types/potential';
import { formatNumber } from '@/utils/calculations';
import { TrendingUp } from 'lucide-react';

interface GradientPointsTableProps {
  points: GradientPoint[];
}

export function GradientPointsTable({ points }: GradientPointsTableProps) {
  const sortedPoints = [...points].sort((a, b) => b.gradient - a.gradient);
  
  return (
    <div className="section-box">
      <h4 className="flex items-center gap-2 text-sm font-semibold mb-4">
        <TrendingUp className="w-4 h-4 text-primary" />
        Pontos de Gradiente
      </h4>
      
      <div className="max-h-64 overflow-y-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary">
            <tr>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Coord X</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Coord Y</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Gradiente (mV/m)</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedPoints.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  Nenhum ponto de gradiente calculado
                </td>
              </tr>
            ) : (
              sortedPoints.map((pt, i) => {
                const isCritical = pt.gradient > 100;
                const isWarning = pt.gradient > 50 && pt.gradient <= 100;
                
                return (
                  <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-2 px-3 font-mono">{formatNumber(pt.x)}</td>
                    <td className="py-2 px-3 font-mono">{formatNumber(pt.y)}</td>
                    <td className={`py-2 px-3 font-mono font-semibold ${
                      isCritical ? 'text-risk-severe' : isWarning ? 'text-risk-uncertain' : 'text-risk-low'
                    }`}>
                      {pt.gradient.toFixed(1)}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isCritical 
                          ? 'bg-risk-severe/10 text-risk-severe' 
                          : isWarning 
                            ? 'bg-risk-uncertain/10 text-risk-uncertain' 
                            : 'bg-risk-low/10 text-risk-low'
                      }`}>
                        {isCritical ? 'Crítico' : isWarning ? 'Atenção' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
