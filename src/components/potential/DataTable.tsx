import { PotentialData } from '@/types/potential';
import { formatNumber, parseNumber } from '@/utils/calculations';

interface DataTableProps {
  data: PotentialData;
  onCellChange: (row: number, col: number, value: number) => void;
}

export function DataTable({ data, onCellChange }: DataTableProps) {
  const handleInputChange = (row: number, col: number, inputValue: string) => {
    const value = parseNumber(inputValue);
    onCellChange(row, col, value);
  };

  return (
    <div className="section-box overflow-x-auto">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        Entrada de Dados (V)
      </h3>
      
      <table className="data-table min-w-full">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-secondary/50 text-xs">Y \ X</th>
            {data.xVals.map((x, i) => (
              <th key={i} className="text-xs font-mono">
                {formatNumber(x)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.yVals.map((y, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/50 transition-colors">
              <td className="sticky left-0 z-10 bg-card font-semibold text-xs font-mono border-r">
                {formatNumber(y)}
              </td>
              {data.xVals.map((_, colIndex) => (
                <td key={colIndex} className="p-0">
                  <input
                    type="text"
                    className="w-full h-full py-1.5 px-2 text-center font-mono text-sm bg-transparent hover:bg-muted/30 focus:bg-primary/10 focus:outline-none transition-colors"
                    value={formatNumber(data.matrix[rowIndex]?.[colIndex] ?? 0)}
                    onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
