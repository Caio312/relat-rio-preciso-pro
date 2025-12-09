import { UncertainPoint } from '@/types/potential';
import { formatNumber } from '@/utils/calculations';
import { AlertTriangle } from 'lucide-react';

interface UncertainPointsTableProps {
  points: UncertainPoint[];
}

export function UncertainPointsTable({ points }: UncertainPointsTableProps) {
  return (
    <div className="section-box">
      <h4 className="flex items-center gap-2 text-sm font-semibold mb-4">
        <AlertTriangle className="w-4 h-4 text-risk-uncertain" />
        Pontos de Atenção (Zona Incerta)
      </h4>
      
      <div className="max-h-64 overflow-y-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-secondary">
            <tr>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Coord X</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Coord Y</th>
              <th className="py-2 px-3 text-left font-medium text-muted-foreground">Valor (mV)</th>
            </tr>
          </thead>
          <tbody>
            {points.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  Nenhum ponto incerto detectado
                </td>
              </tr>
            ) : (
              points.map((pt, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-2 px-3 font-mono">{formatNumber(pt.x)}</td>
                  <td className="py-2 px-3 font-mono">{formatNumber(pt.y)}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-risk-uncertain">
                    {pt.value.toFixed(0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
