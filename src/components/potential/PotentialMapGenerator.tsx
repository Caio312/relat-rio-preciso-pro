import { useState, useRef, useCallback, useMemo } from 'react';
import { Table, Box, AreaChart, PieChart, Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { DataTable } from './DataTable';
import { PlotlyChart } from './PlotlyChart';
import { RiskCards } from './RiskCards';
import { StatsSummary } from './StatsSummary';
import { UncertainPointsTable } from './UncertainPointsTable';
import { RecommendationsList } from './RecommendationsList';
import { usePotentialData } from '@/hooks/usePotentialData';
import { generatePDF } from '@/utils/pdfGenerator';
import { generateWord } from '@/utils/wordGenerator';
import { toast } from 'sonner';

type TabType = 'editor' | '3d' | 'gradient' | 'stats';

export function PotentialMapGenerator() {
  const [activeTab, setActiveTab] = useState<TabType>('editor');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [comments, setComments] = useState('');
  const [xInput, setXInput] = useState('0,00; 0,15; 0,30');
  const [yInput, setYInput] = useState(
    '1,94; 1,84; 1,74; 1,64; 1,54; 1,44; 1,34; 1,24; 1,14; 1,04; 0,94; 0,84; 0,74; 0,64; 0,54'
  );

  const plot2dRef = useRef<HTMLDivElement>(null);
  const plot3dRef = useRef<HTMLDivElement>(null);
  const plotHistRef = useRef<HTMLDivElement>(null);
  const plotPieRef = useRef<HTMLDivElement>(null);
  const plotGradientRef = useRef<HTMLDivElement>(null);

  const {
    data,
    params,
    stats,
    uncertainPoints,
    gradients,
    recommendations,
    updateCell,
    updateGrid,
    updateElectrode,
    updateParams,
    importCSV,
    exportCSV,
  } = usePotentialData();

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  }, []);

  const handleGenerateGrid = useCallback(() => {
    updateGrid(xInput, yInput);
    toast.success('Tabela redefinida com sucesso');
  }, [updateGrid, xInput, yInput]);

  const handleImportCSV = useCallback(
    (content: string) => {
      try {
        importCSV(content);
        toast.success('Dados importados com sucesso!');
      } catch (error) {
        toast.error('Erro ao importar CSV. Verifique o formato do arquivo.');
      }
    },
    [importCSV]
  );

  const handleExportCSV = useCallback(() => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dados_potencial.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo CSV baixado');
  }, [exportCSV]);

  const handleGeneratePDF = useCallback(async () => {
    setIsGeneratingPDF(true);
    toast.info('Gerando relatório PDF...');

    try {
      await generatePDF(
        {
          data,
          stats,
          uncertainPoints,
          gradients,
          recommendations,
          params,
          comments,
        },
        {
          plot2d: plot2dRef.current,
          plot3d: plot3dRef.current,
          plotHist: plotHistRef.current,
          plotPie: plotPieRef.current,
          plotGradient: plotGradientRef.current,
        }
      );
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [data, stats, uncertainPoints, gradients, recommendations, params, comments]);

  const handleGenerateWord = useCallback(async () => {
    setIsGeneratingWord(true);
    toast.info('Gerando relatório Word...');

    try {
      await generateWord(
        {
          data,
          stats,
          uncertainPoints,
          gradients,
          recommendations,
          params,
          comments,
        },
        {
          plot2d: plot2dRef.current,
          plot3d: plot3dRef.current,
          plotHist: plotHistRef.current,
          plotPie: plotPieRef.current,
          plotGradient: plotGradientRef.current,
        }
      );
      toast.success('Relatório Word gerado com sucesso!');
    } catch (error) {
      console.error('Error generating Word:', error);
      toast.error('Erro ao gerar Word. Tente novamente.');
    } finally {
      setIsGeneratingWord(false);
    }
  }, [data, stats, uncertainPoints, gradients, recommendations, params, comments]);


  const theme = useMemo(
    () => ({
      bg: isDarkMode ? '#1e293b' : '#ffffff',
      txt: isDarkMode ? '#e2e8f0' : '#1e293b',
      grid: isDarkMode ? '#334155' : '#e2e8f0',
    }),
    [isDarkMode]
  );

  const plotLayout = useMemo(
    () => ({
      paper_bgcolor: theme.bg,
      plot_bgcolor: theme.bg,
      font: { color: theme.txt, family: 'IBM Plex Sans' },
      margin: { t: 30, b: 50, l: 60, r: 30 },
    }),
    [theme]
  );

  // Ensure data is valid before computing derived values
  const hasValidData = useMemo(() => {
    return data && 
           data.matrix && 
           data.matrix.length > 0 && 
           data.xVals && 
           data.xVals.length > 0 && 
           data.yVals && 
           data.yVals.length > 0;
  }, [data]);

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

  const maxGradient = useMemo(
    () => (gradients.length ? Math.max(...gradients.map((g) => g.gradient)) : 0),
    [gradients]
  );
  
  const criticalGradients = useMemo(
    () => gradients.filter((g) => g.gradient > 100).length,
    [gradients]
  );

  const tabs = [
    { id: 'editor' as const, label: 'Tabela & Mapa 2D', icon: Table },
    { id: '3d' as const, label: 'Superfície 3D', icon: Box },
    { id: 'gradient' as const, label: 'Gradientes', icon: AreaChart },
    { id: 'stats' as const, label: 'Relatório', icon: PieChart },
  ];

  // 2D contour plot data
  const contourData = useMemo(() => {
    if (!hasValidData) return [];
    return [{
      z: reversedZ,
      x: data.xVals,
      y: reversedY,
      type: 'contour' as const,
      colorscale: params.colorscale,
      contours: {
        coloring: 'heatmap',
        showlabels: true,
        labelfont: { color: 'white', size: 10 },
      },
      line: { color: isDarkMode ? '#64748b' : '#334155', width: 0.5 },
      colorbar: { title: 'V', tickformat: '.2f' },
    }];
  }, [hasValidData, reversedZ, data.xVals, reversedY, params.colorscale, isDarkMode]);

  // 3D surface plot data
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

  // Gradient scatter data
  const gradientData = useMemo(() => {
    if (gradients.length === 0) return [];
    return [{
      x: gradients.map((g) => g.x),
      y: gradients.map((g) => g.y),
      mode: 'markers' as const,
      type: 'scatter' as const,
      marker: {
        color: gradients.map((g) => g.gradient),
        size: 14,
        colorscale: 'Hot',
        symbol: 'square',
        colorbar: { title: 'mV/m' },
      },
    }];
  }, [gradients]);

  // Histogram data
  const histogramData = useMemo(() => {
    if (!hasValidData) return [];
    return [{
      x: flatValues,
      type: 'histogram' as const,
      marker: { color: 'hsl(220, 70%, 50%)' },
      nbinsx: 15,
    }];
  }, [hasValidData, flatValues]);

  // Pie chart data
  const pieData = useMemo(() => {
    return [{
      values: [stats.severe.count, stats.uncertain.count, stats.low.count],
      labels: ['Alto Risco', 'Incerto', 'Baixo Risco'],
      type: 'pie' as const,
      marker: {
        colors: [
          'hsl(0, 70%, 50%)',
          'hsl(45, 90%, 50%)',
          'hsl(145, 60%, 45%)',
        ],
      },
      textinfo: 'label+percent',
      textfont: { color: 'white' },
      hole: 0.4,
    }];
  }, [stats]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        params={params}
        xInput={xInput}
        yInput={yInput}
        onXInputChange={setXInput}
        onYInputChange={setYInput}
        onGenerateGrid={handleGenerateGrid}
        onElectrodeChange={updateElectrode}
        onParamsChange={updateParams}
        onImportCSV={handleImportCSV}
        onExportCSV={handleExportCSV}
        onGeneratePDF={handleGeneratePDF}
        onGenerateWord={handleGenerateWord}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isGeneratingPDF={isGeneratingPDF}
        isGeneratingWord={isGeneratingWord}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs Header */}
        <div className="flex bg-card border-b border-border px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button flex items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Editor Tab */}
          {activeTab === 'editor' && (
            <div className="grid lg:grid-cols-2 gap-6 h-full animate-fade-in">
              <div className="overflow-auto">
                <DataTable data={data} onCellChange={updateCell} />
              </div>
              <div className="plot-container min-h-[500px]">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  Mapa de Potenciais 2D
                </h3>
                <div className="h-[calc(100%-2rem)]" ref={plot2dRef}>
                  {hasValidData && contourData.length > 0 && (
                    <PlotlyChart
                      data={contourData}
                      layout={{
                        ...plotLayout,
                        xaxis: { title: 'Largura (m)', gridcolor: theme.grid },
                        yaxis: { title: 'Altura (m)', scaleanchor: 'x', gridcolor: theme.grid },
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3D Tab */}
          {activeTab === '3d' && (
            <div className="plot-container h-[600px] animate-fade-in">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Topografia 3D
              </h3>
              <div className="h-[calc(100%-2rem)]" ref={plot3dRef}>
                {hasValidData && surfaceData.length > 0 && (
                  <PlotlyChart
                    data={surfaceData}
                    layout={{
                      ...plotLayout,
                      margin: { t: 10, b: 10, l: 10, r: 10 },
                      scene: {
                        xaxis: { title: 'X (m)', gridcolor: theme.grid },
                        yaxis: { title: 'Y (m)', gridcolor: theme.grid },
                        zaxis: { title: 'V', gridcolor: theme.grid },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Gradient Tab */}
          {activeTab === 'gradient' && (
            <div className="space-y-6 animate-fade-in">
              <div className="plot-container h-[400px]">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  Mapa de Gradientes
                </h3>
                <div className="h-[calc(100%-2rem)]" ref={plotGradientRef}>
                  {gradientData.length > 0 && (
                    <PlotlyChart
                      data={gradientData}
                      layout={{
                        ...plotLayout,
                        xaxis: { title: 'Largura (m)', gridcolor: theme.grid },
                        yaxis: { title: 'Altura (m)', scaleanchor: 'x', gridcolor: theme.grid },
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="section-box">
                <h4 className="text-sm font-semibold mb-3">Análise de Gradientes</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Gradiente Máximo</p>
                    <p className="text-2xl font-bold font-mono">{maxGradient.toFixed(0)} mV/m</p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Pontos Críticos (&gt;100)</p>
                    <p className="text-2xl font-bold font-mono">{criticalGradients}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Análise Estatística (ASTM C876)
                </h3>
                <RiskCards stats={stats} />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="plot-container h-[350px]">
                  <div className="h-full" ref={plotHistRef}>
                    {histogramData.length > 0 && (
                      <PlotlyChart
                        data={histogramData}
                        layout={{
                          ...plotLayout,
                          title: { text: 'Distribuição (mV)', font: { size: 14 } },
                          xaxis: { title: 'Potencial (mV)', gridcolor: theme.grid },
                          yaxis: { title: 'Frequência', gridcolor: theme.grid },
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="plot-container h-[350px]">
                  <div className="h-full" ref={plotPieRef}>
                    <PlotlyChart
                      data={pieData}
                      layout={{
                        ...plotLayout,
                        showlegend: false,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <StatsSummary stats={stats} />
                <UncertainPointsTable points={uncertainPoints} />
              </div>

              <RecommendationsList recommendations={recommendations} />
            </div>
          )}
        </div>
      </main>

      {/* PDF Loading Overlay */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-xl flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="font-medium">Gerando relatório PDF...</span>
          </div>
        </div>
      )}
    </div>
  );
}
