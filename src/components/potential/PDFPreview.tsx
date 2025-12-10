import { FileText, AlertTriangle, CheckCircle, Info, XCircle, TrendingUp, MessageSquare } from 'lucide-react';
import { Statistics, UncertainPoint, GradientPoint, Recommendation, Parameters } from '@/types/potential';
import { formatNumber, getASTMInterpretation } from '@/utils/calculations';

interface PDFPreviewProps {
  stats: Statistics;
  uncertainPoints: UncertainPoint[];
  gradients: GradientPoint[];
  recommendations: Recommendation[];
  params: Parameters;
  comments: string;
}

export function PDFPreview({ stats, uncertainPoints, gradients, recommendations, params, comments }: PDFPreviewProps) {
  const date = new Date().toLocaleDateString('pt-BR');
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const interpretation = getASTMInterpretation(stats, params.electrode);
  
  const maxGrad = gradients.length ? Math.max(...gradients.map(g => g.gradient)) : 0;
  const avgGrad = gradients.length ? gradients.reduce((a, b) => a + b.gradient, 0) / gradients.length : 0;
  const criticalCount = gradients.filter(g => g.gradient > 100).length;
  
  const getRecIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <XCircle className="w-4 h-4 text-risk-severe" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-risk-uncertain" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-risk-low" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Pré-visualização do Relatório</h3>
      </div>

      {/* Preview Container */}
      <div className="bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden max-h-[70vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-800 text-white p-4">
          <h1 className="text-lg font-bold">RELATÓRIO DE MAPEAMENTO DE POTENCIAL</h1>
          <p className="text-sm text-slate-300">Avaliação de Corrosão em Armaduras - ASTM C876</p>
          <p className="text-xs text-slate-400 mt-1">Data: {date} às {time} | Ref: {params.electrode}</p>
        </div>

        <div className="p-4 space-y-6">
          {/* 1. Executive Summary */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">1. RESUMO EXECUTIVO</h2>
            
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="bg-gray-100 p-3 rounded border">
                <p className="text-xs font-semibold text-gray-700 mb-2">Parâmetros de Ensaio</p>
                <p className="text-xs">Eletrodo: {params.electrode}</p>
                <p className="text-xs">Cobrimento: {params.coverDepth} mm</p>
                <p className="text-xs">Resistividade: {params.resistivity || '-'} kΩ·cm</p>
              </div>
              <div className="bg-gray-100 p-3 rounded border">
                <p className="text-xs font-semibold text-gray-700 mb-2">Estatísticas Globais</p>
                <p className="text-xs">Média: {stats.mean.toFixed(0)} mV</p>
                <p className="text-xs">Desvio Padrão: {stats.stdDev.toFixed(0)} mV</p>
                <p className="text-xs">Faixa: {stats.min.toFixed(0)} a {stats.max.toFixed(0)} mV</p>
              </div>
            </div>
            
            <div className="mt-3 bg-blue-50 border border-blue-200 p-2 rounded">
              <p className="text-xs font-semibold text-slate-700">{interpretation}</p>
            </div>
          </section>

          {/* 2. Risk Analysis */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">2. ANÁLISE DE RISCO CONFORME ASTM C876</h2>
            
            <table className="w-full mt-3 text-xs border-collapse">
              <thead>
                <tr className="bg-slate-700 text-white">
                  <th className="p-2 text-left">Classificação ASTM</th>
                  <th className="p-2 text-left">Faixa (mV)</th>
                  <th className="p-2 text-left">Pontos</th>
                  <th className="p-2 text-left">Percentual</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-500"></span>
                    Alto Risco (&gt;90% prob. corrosão)
                  </td>
                  <td className="p-2">&lt; {params.severeThreshold}</td>
                  <td className="p-2">{stats.severe.count}</td>
                  <td className="p-2 font-bold">{stats.severe.percentage.toFixed(1)}%</td>
                </tr>
                <tr className="border-b bg-gray-50">
                  <td className="p-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-yellow-500"></span>
                    Incerto (Zona de transição)
                  </td>
                  <td className="p-2">{params.severeThreshold} a {params.lowThreshold}</td>
                  <td className="p-2">{stats.uncertain.count}</td>
                  <td className="p-2 font-bold">{stats.uncertain.percentage.toFixed(1)}%</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-green-500"></span>
                    Baixo Risco (&gt;90% prob. passiva)
                  </td>
                  <td className="p-2">&gt; {params.lowThreshold}</td>
                  <td className="p-2">{stats.low.count}</td>
                  <td className="p-2 font-bold">{stats.low.percentage.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[10px] text-gray-500 mt-2 italic">
              * Limites baseados na ASTM C876-15 para eletrodo de referência {params.electrode}
            </p>
          </section>

          {/* 3. Recommendations */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">3. RECOMENDAÇÕES TÉCNICAS</h2>
            
            <div className="mt-3 space-y-2">
              {recommendations.map((rec, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded border-l-4 ${
                  rec.type === 'urgent' ? 'border-red-500 bg-red-50' :
                  rec.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  rec.type === 'success' ? 'border-green-500 bg-green-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  {getRecIcon(rec.type)}
                  <div>
                    <p className="text-xs font-bold">{rec.title}</p>
                    <p className="text-[10px] text-gray-600">{rec.description}</p>
                    {rec.astmRef && <p className="text-[10px] text-gray-400 italic mt-1">Ref: {rec.astmRef}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Charts placeholder */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">4. MAPA DE POTENCIAIS (2D)</h2>
            <div className="mt-3 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
              <p className="text-xs text-gray-500">[Gráfico 2D será incluído no PDF]</p>
            </div>
          </section>

          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">5. TOPOGRAFIA 3D (VISTA ISOMÉTRICA)</h2>
            <div className="mt-3 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
              <p className="text-xs text-gray-500">[Gráfico 3D será incluído no PDF]</p>
            </div>
          </section>

          {/* 6. Gradients */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">6. MAPA DE GRADIENTES DE POTENCIAL</h2>
            <div className="mt-3 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
              <p className="text-xs text-gray-500">[Mapa de gradientes será incluído no PDF]</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-gray-100 p-2 rounded border text-center">
                <p className="text-[10px] text-gray-500">Gradiente Máximo</p>
                <p className="text-sm font-bold">{maxGrad.toFixed(0)} mV/m</p>
              </div>
              <div className="bg-gray-100 p-2 rounded border text-center">
                <p className="text-[10px] text-gray-500">Gradiente Médio</p>
                <p className="text-sm font-bold">{avgGrad.toFixed(0)} mV/m</p>
              </div>
              <div className="bg-gray-100 p-2 rounded border text-center">
                <p className="text-[10px] text-gray-500">Pontos Críticos</p>
                <p className="text-sm font-bold">{criticalCount}</p>
              </div>
            </div>

            <div className="mt-3">
              <h3 className="bg-slate-600 text-white px-2 py-1 text-xs font-bold rounded">6.1 METODOLOGIA DE CÁLCULO</h3>
              <div className="mt-2 text-[10px] text-gray-700 bg-gray-50 p-2 rounded border">
                <p>O gradiente de potencial é calculado como a variação máxima do potencial entre pontos adjacentes, dividida pela distância entre eles.</p>
                <p className="mt-1 font-mono">Gradiente = max(|ΔVx|/Δx, |ΔVy|/Δy) × 1000 [mV/m]</p>
                <p className="mt-1">• Gradientes &gt;150 mV/m: Macrocélulas de corrosão ativas</p>
                <p>• Gradientes &gt;100 mV/m: Possível atividade localizada</p>
                <p>• Gradientes &lt;50 mV/m: Condições uniformes</p>
              </div>
            </div>
          </section>

          {/* 6.2 Gradient Points Table */}
          {gradients.length > 0 && (
            <section>
              <h3 className="bg-slate-600 text-white px-2 py-1 text-xs font-bold rounded flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                6.2 TABELA DE PONTOS DE GRADIENTE
              </h3>
              <table className="w-full mt-2 text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-600 text-white">
                    <th className="p-1.5 text-left">Coord X (m)</th>
                    <th className="p-1.5 text-left">Coord Y (m)</th>
                    <th className="p-1.5 text-left">Gradiente (mV/m)</th>
                    <th className="p-1.5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...gradients].sort((a, b) => b.gradient - a.gradient).slice(0, 10).map((pt, i) => {
                    const isCritical = pt.gradient > 100;
                    const isWarning = pt.gradient > 50 && pt.gradient <= 100;
                    return (
                      <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                        <td className="p-1.5 border-b font-mono">{formatNumber(pt.x)}</td>
                        <td className="p-1.5 border-b font-mono">{formatNumber(pt.y)}</td>
                        <td className={`p-1.5 border-b font-mono font-semibold ${
                          isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {pt.gradient.toFixed(1)}
                        </td>
                        <td className="p-1.5 border-b">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            isCritical ? 'bg-red-100 text-red-700' : 
                            isWarning ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-green-100 text-green-700'
                          }`}>
                            {isCritical ? 'Crítico' : isWarning ? 'Atenção' : 'Normal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {gradients.length > 10 && (
                <p className="text-[9px] text-gray-500 mt-1 italic">
                  ... e mais {gradients.length - 10} pontos não exibidos
                </p>
              )}
            </section>
          )}

          {/* 7. Uncertain Points */}
          {uncertainPoints.length > 0 && (
            <section>
              <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">7. PONTOS EM ZONA DE INCERTEZA</h2>
              <table className="w-full mt-3 text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-600 text-white">
                    <th className="p-1.5 text-left">Coordenada X (m)</th>
                    <th className="p-1.5 text-left">Coordenada Y (m)</th>
                    <th className="p-1.5 text-left">Potencial (mV)</th>
                  </tr>
                </thead>
                <tbody>
                  {uncertainPoints.slice(0, 10).map((pt, i) => (
                    <tr key={i} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                      <td className="p-1.5 border-b font-mono">{formatNumber(pt.x)}</td>
                      <td className="p-1.5 border-b font-mono">{formatNumber(pt.y)}</td>
                      <td className="p-1.5 border-b font-mono font-semibold text-yellow-600">{pt.value.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {uncertainPoints.length > 10 && (
                <p className="text-[9px] text-gray-500 mt-1 italic">
                  ... e mais {uncertainPoints.length - 10} pontos não listados
                </p>
              )}
            </section>
          )}

          {/* 8. Comments */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              8. OBSERVAÇÕES E COMENTÁRIOS
            </h2>
            <div className="mt-3 border rounded p-3 min-h-[80px] bg-gray-50">
              {comments.trim() ? (
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{comments}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">Espaço reservado para observações do inspetor.</p>
              )}
            </div>
          </section>

          {/* 9. Signature */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">9. RESPONSÁVEL TÉCNICO</h2>
            <div className="mt-4 flex justify-between px-8">
              <div className="text-center">
                <div className="border-b border-gray-400 w-48 mb-1"></div>
                <p className="text-[10px] text-gray-500">Assinatura do Responsável</p>
              </div>
              <div className="text-center">
                <div className="border-b border-gray-400 w-32 mb-1"></div>
                <p className="text-[10px] text-gray-500">Data</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-6 pt-3 border-t">
            <p className="text-[9px] text-gray-400 italic">
              Relatório gerado conforme ASTM C876-15: Standard Test Method for Corrosion Potentials of Uncoated Reinforcing Steel in Concrete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
