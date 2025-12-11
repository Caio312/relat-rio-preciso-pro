import { FileText, AlertTriangle, CheckCircle, Info, XCircle, TrendingUp, MessageSquare, MapPin, Calendar, User, Camera } from 'lucide-react';
import { Statistics, UncertainPoint, GradientPoint, Recommendation, Parameters, InspectionInfo, AttachedPhoto, PotentialData } from '@/types/potential';
import { formatNumber, getASTMInterpretation } from '@/utils/calculations';
import { PlotlyChart } from './PlotlyChart';
import { useMemo } from 'react';

interface PDFPreviewProps {
  stats: Statistics;
  uncertainPoints: UncertainPoint[];
  gradients: GradientPoint[];
  recommendations: Recommendation[];
  params: Parameters;
  comments: string;
  inspectionInfo: InspectionInfo;
  photos: AttachedPhoto[];
  data: PotentialData;
}

export function PDFPreview({ 
  stats, 
  uncertainPoints, 
  gradients, 
  recommendations, 
  params, 
  comments, 
  inspectionInfo, 
  photos,
  data 
}: PDFPreviewProps) {
  const interpretation = getASTMInterpretation(stats, params.electrode);
  
  const maxGrad = gradients.length ? Math.max(...gradients.map(g => g.gradient)) : 0;
  const avgGrad = gradients.length ? gradients.reduce((a, b) => a + b.gradient, 0) / gradients.length : 0;
  const criticalCount = gradients.filter(g => g.gradient > 100).length;

  const formattedDate = inspectionInfo.date 
    ? new Date(inspectionInfo.date + 'T00:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');

  // Prepare chart data
  const hasValidData = data && data.matrix && data.matrix.length > 0 && data.xVals && data.xVals.length > 0;
  
  const reversedZ = useMemo(() => {
    if (!hasValidData) return [[0]];
    return [...data.matrix].reverse();
  }, [data.matrix, hasValidData]);

  const reversedY = useMemo(() => {
    if (!hasValidData) return [0];
    return [...data.yVals].reverse();
  }, [data.yVals, hasValidData]);

  const flatValues = useMemo(() => {
    if (!hasValidData) return [0];
    return data.matrix.flat().map((v) => v * 1000);
  }, [data.matrix, hasValidData]);

  const contourData = useMemo(() => {
    if (!hasValidData) return [];
    return [{
      z: reversedZ,
      x: data.xVals,
      y: reversedY,
      type: 'contour' as const,
      colorscale: params.colorscale,
      ncontours: 25,
      contours: { 
        coloring: 'heatmap', 
        showlabels: true, 
        labelfont: { color: 'white', size: 8 },
      },
      line: { color: '#334155', width: 0.8, smoothing: 1.3 },
      colorbar: { title: 'V', tickformat: '.3f' },
    }];
  }, [hasValidData, reversedZ, data.xVals, reversedY, params.colorscale]);

  const surfaceData = useMemo(() => {
    if (!hasValidData) return [];
    return [{
      z: reversedZ,
      x: data.xVals,
      y: reversedY,
      type: 'surface' as const,
      colorscale: params.colorscale,
      colorbar: { title: 'V' },
    }];
  }, [hasValidData, reversedZ, data.xVals, reversedY, params.colorscale]);

  const gradientData = useMemo(() => {
    if (gradients.length === 0) return [];
    return [{
      x: gradients.map((g) => g.x),
      y: gradients.map((g) => g.y),
      mode: 'markers' as const,
      type: 'scatter' as const,
      marker: {
        color: gradients.map((g) => g.gradient),
        size: 10,
        colorscale: 'Hot',
        symbol: 'square',
        colorbar: { title: 'mV/m' },
      },
    }];
  }, [gradients]);

  const histogramData = useMemo(() => {
    if (!hasValidData) return [];
    return [{
      x: flatValues,
      type: 'histogram' as const,
      marker: { color: 'hsl(220, 70%, 50%)' },
      nbinsx: 15,
    }];
  }, [hasValidData, flatValues]);

  const pieData = useMemo(() => {
    return [{
      values: [stats.severe.count, stats.uncertain.count, stats.low.count],
      labels: ['Alto Risco', 'Incerto', 'Baixo Risco'],
      type: 'pie' as const,
      marker: { colors: ['hsl(0, 70%, 50%)', 'hsl(45, 90%, 50%)', 'hsl(145, 60%, 45%)'] },
      textinfo: 'label+percent',
      textfont: { color: 'white' },
      hole: 0.4,
    }];
  }, [stats]);

  const previewLayout = {
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    font: { color: '#1e293b', family: 'IBM Plex Sans', size: 10 },
    margin: { t: 20, b: 40, l: 50, r: 20 },
  };
  
  const getRecIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Pré-visualização do Relatório</h3>
      </div>

      {/* Preview Container */}
      <div className="bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden max-h-[75vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-slate-800 text-white p-4">
          <h1 className="text-lg font-bold">RELATÓRIO DE MAPEAMENTO DE POTENCIAL</h1>
          <p className="text-sm text-slate-300">Avaliação de Corrosão em Armaduras - ASTM C876</p>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Data: {formattedDate}
            </span>
            {inspectionInfo.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {inspectionInfo.location}
              </span>
            )}
            <span>Ref: {params.electrode}</span>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Inspection Info */}
          {(inspectionInfo.responsibleName || inspectionInfo.crea || inspectionInfo.art) && (
            <section className="bg-slate-50 p-3 rounded border">
              <h3 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                <User className="w-3 h-3" />
                Responsável Técnico
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {inspectionInfo.responsibleName && (
                  <p><span className="font-medium">Nome:</span> {inspectionInfo.responsibleName}</p>
                )}
                {inspectionInfo.responsibleRole && (
                  <p><span className="font-medium">Função:</span> {inspectionInfo.responsibleRole}</p>
                )}
                {inspectionInfo.crea && (
                  <p><span className="font-medium">CREA:</span> {inspectionInfo.crea}</p>
                )}
                {inspectionInfo.art && (
                  <p><span className="font-medium">ART:</span> {inspectionInfo.art}</p>
                )}
              </div>
            </section>
          )}

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
          </section>

          {/* Charts - Distribution and Pie */}
          <section>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-48 border rounded">
                {histogramData.length > 0 && (
                  <PlotlyChart
                    data={histogramData}
                    layout={{
                      ...previewLayout,
                      title: { text: 'Distribuição (mV)', font: { size: 11 } },
                      xaxis: { title: 'Potencial (mV)' },
                      yaxis: { title: 'Frequência' },
                    }}
                  />
                )}
              </div>
              <div className="h-48 border rounded">
                <PlotlyChart
                  data={pieData}
                  layout={{
                    ...previewLayout,
                    showlegend: false,
                  }}
                />
              </div>
            </div>
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
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. 2D Map */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">4. MAPA DE POTENCIAIS (2D)</h2>
            <div className="mt-3 h-56 border rounded">
              {contourData.length > 0 && (
                <PlotlyChart
                  data={contourData}
                  layout={{
                    ...previewLayout,
                    xaxis: { title: 'Largura (m)' },
                    yaxis: { title: 'Altura (m)', scaleanchor: 'x' },
                  }}
                />
              )}
            </div>
          </section>

          {/* 5. 3D Surface */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">5. TOPOGRAFIA 3D (VISTA ISOMÉTRICA)</h2>
            <div className="mt-3 h-56 border rounded">
              {surfaceData.length > 0 && (
                <PlotlyChart
                  data={surfaceData}
                  layout={{
                    ...previewLayout,
                    margin: { t: 10, b: 10, l: 10, r: 10 },
                    scene: {
                      xaxis: { title: 'X (m)' },
                      yaxis: { title: 'Y (m)' },
                      zaxis: { title: 'V' },
                      aspectmode: 'manual',
                      aspectratio: { x: 1, y: 1.5, z: 0.5 },
                    },
                  }}
                />
              )}
            </div>
          </section>

          {/* 6. Gradients */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">6. MAPA DE GRADIENTES DE POTENCIAL</h2>
            <div className="mt-3 h-48 border rounded">
              {gradientData.length > 0 && (
                <PlotlyChart
                  data={gradientData}
                  layout={{
                    ...previewLayout,
                    xaxis: { title: 'Largura (m)' },
                    yaxis: { title: 'Altura (m)', scaleanchor: 'x' },
                  }}
                />
              )}
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
          </section>

          {/* Gradient Points Table */}
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
            </section>
          )}

          {/* 8. Comments */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              8. OBSERVAÇÕES E COMENTÁRIOS
            </h2>
            <div className="mt-3 border rounded p-3 min-h-[60px] bg-gray-50">
              {comments.trim() ? (
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{comments}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">Espaço reservado para observações do inspetor.</p>
              )}
            </div>
          </section>

          {/* 9. Photos */}
          {photos.length > 0 && (
            <section>
              <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded flex items-center gap-2">
                <Camera className="w-4 h-4" />
                ANEXO: REGISTRO FOTOGRÁFICO
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-4">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="border rounded overflow-hidden">
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 bg-gray-50">
                      <p className="text-[10px] font-medium">Foto {i + 1}</p>
                      {photo.description && (
                        <p className="text-[9px] text-gray-600">{photo.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 9/10. Signature */}
          <section>
            <h2 className="bg-slate-700 text-white px-3 py-2 text-sm font-bold rounded">
              {photos.length > 0 ? '10' : '9'}. RESPONSÁVEL TÉCNICO
            </h2>
            <div className="mt-4 flex justify-between px-8">
              <div className="text-center">
                <div className="border-b border-gray-400 w-48 mb-1"></div>
                <p className="text-[10px] text-gray-500">Assinatura do Responsável</p>
                {inspectionInfo.responsibleName && (
                  <p className="text-[9px] text-gray-700 mt-1">{inspectionInfo.responsibleName}</p>
                )}
                {inspectionInfo.crea && (
                  <p className="text-[9px] text-gray-500">{inspectionInfo.crea}</p>
                )}
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
