import { useState } from 'react';
import {
  Upload,
  Download,
  FileText,
  Settings,
  Palette,
  Ruler,
  Moon,
  Sun,
  Map,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Parameters, ELECTRODE_REFERENCES, COLORSCALES } from '@/types/potential';

interface SidebarProps {
  params: Parameters;
  xInput: string;
  yInput: string;
  onXInputChange: (value: string) => void;
  onYInputChange: (value: string) => void;
  onGenerateGrid: () => void;
  onElectrodeChange: (value: string) => void;
  onParamsChange: (updates: Partial<Parameters>) => void;
  onImportCSV: (content: string) => void;
  onExportCSV: () => void;
  onGeneratePDF: () => void;
  onGenerateWord: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isGeneratingPDF: boolean;
  isGeneratingWord: boolean;
}

export function Sidebar({
  params,
  xInput,
  yInput,
  onXInputChange,
  onYInputChange,
  onGenerateGrid,
  onElectrodeChange,
  onParamsChange,
  onImportCSV,
  onExportCSV,
  onGeneratePDF,
  onGenerateWord,
  isDarkMode,
  onToggleDarkMode,
  isGeneratingPDF,
  isGeneratingWord,
}: SidebarProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        onImportCSV(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-y-auto">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <Map className="w-5 h-5 text-sidebar-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Potencial</h1>
              <p className="text-xs text-sidebar-foreground/60">ASTM C876</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleDarkMode}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        {/* Files Section */}
        <div className="sidebar-section">
          <h3 className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground/70 mb-4">
            <Upload className="w-4 h-4" />
            Arquivos
          </h3>
          
          <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-md cursor-pointer font-medium text-sm transition-colors mb-3">
            <Upload className="w-4 h-4" />
            Importar CSV
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <Button
            variant="secondary"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mb-3"
            onClick={onExportCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Dados (.csv)
          </Button>

          <Button
            variant="secondary"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white mb-3"
            onClick={onGeneratePDF}
            disabled={isGeneratingPDF}
          >
            <FileText className="w-4 h-4 mr-2" />
            {isGeneratingPDF ? 'Gerando...' : 'Relatório PDF'}
          </Button>

          <Button
            variant="secondary"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onGenerateWord}
            disabled={isGeneratingWord}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {isGeneratingWord ? 'Gerando...' : 'Relatório Word'}
          </Button>
        </div>

        {/* Dimensions Section */}
        <div className="sidebar-section">
          <h3 className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground/70 mb-4">
            <Ruler className="w-4 h-4" />
            Dimensões
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-sidebar-foreground/60">Eixo X (Largura em metros)</Label>
              <Input
                value={xInput}
                onChange={(e) => onXInputChange(e.target.value)}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground mt-1"
                placeholder="0,00; 0,15; 0,30"
              />
            </div>
            
            <div>
              <Label className="text-xs text-sidebar-foreground/60">Eixo Y (Altura em metros)</Label>
              <Input
                value={yInput}
                onChange={(e) => onYInputChange(e.target.value)}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground mt-1"
                placeholder="1,94; 1,84; 1,74..."
              />
            </div>

            <Button
              variant="secondary"
              className="w-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground"
              onClick={onGenerateGrid}
            >
              Redefinir Tabela
            </Button>
          </div>
        </div>

        {/* Parameters Section */}
        <div className="sidebar-section">
          <h3 className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground/70 mb-4">
            <Settings className="w-4 h-4" />
            Parâmetros
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-sidebar-foreground/60">Eletrodo de Referência</Label>
              <Select value={params.electrode} onValueChange={onElectrodeChange}>
                <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ELECTRODE_REFERENCES).map((ref) => (
                    <SelectItem key={ref.name} value={ref.name}>
                      {ref.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-sidebar-foreground/60">Cobrimento (mm)</Label>
              <Input
                type="number"
                value={params.coverDepth}
                onChange={(e) => onParamsChange({ coverDepth: parseInt(e.target.value) || 30 })}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground mt-1"
                min={10}
                max={150}
              />
            </div>

            <div>
              <Label className="text-xs text-sidebar-foreground/60">Resistividade (kΩ·cm)</Label>
              <Input
                type="number"
                value={params.resistivity || ''}
                onChange={(e) => onParamsChange({ resistivity: e.target.value ? parseInt(e.target.value) : null })}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground mt-1"
                placeholder="Ex: 20"
                min={1}
                max={1000}
              />
            </div>
          </div>
        </div>

        {/* Color/Limits Section */}
        <div className="sidebar-section">
          <h3 className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground/70 mb-4">
            <Palette className="w-4 h-4" />
            Limites (ASTM)
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-sidebar-foreground/60">Esquema de Cores</Label>
              <Select
                value={params.colorscale}
                onValueChange={(value) => onParamsChange({ colorscale: value })}
              >
                <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLORSCALES.map((cs) => (
                    <SelectItem key={cs.value} value={cs.value}>
                      {cs.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-sidebar-foreground/60">Alto Risco (&lt; mV)</Label>
              <Input
                type="number"
                value={params.severeThreshold}
                onChange={(e) => onParamsChange({ severeThreshold: parseInt(e.target.value) || -350 })}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground mt-1"
                step={10}
              />
            </div>

            <div>
              <Label className="text-xs text-sidebar-foreground/60">Baixo Risco (&gt; mV)</Label>
              <Input
                type="number"
                value={params.lowThreshold}
                onChange={(e) => onParamsChange({ lowThreshold: parseInt(e.target.value) || -200 })}
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground mt-1"
                step={10}
              />
            </div>
          </div>
        </div>

        {/* Warnings */}
        {(params.coverDepth > 75 || (params.resistivity && params.resistivity > 50)) && (
          <div className="space-y-2">
            {params.coverDepth > 75 && (
              <div className="warning-box text-amber-800 dark:text-amber-200">
                ⚠️ Cobrimento &gt; 75mm pode atenuar leituras
              </div>
            )}
            {params.resistivity && params.resistivity > 50 && (
              <div className="warning-box text-amber-800 dark:text-amber-200">
                ⚠️ Alta resistividade (&gt; 50 kΩ·cm)
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
