import {
  PotentialData,
  Statistics,
  UncertainPoint,
  GradientPoint,
  Recommendation,
  Parameters,
} from '@/types/potential';

export function formatNumber(n: number | undefined | null, decimals = 2): string {
  if (n === undefined || n === null) return '';
  return n.toFixed(decimals).replace('.', ',');
}

export function parseNumber(s: string): number {
  return parseFloat(s.toString().replace(',', '.')) || 0;
}

export function parseArray(s: string): number[] {
  return s
    .split(/[;,]/)
    .map((v) => parseNumber(v.trim()))
    .filter((n) => !isNaN(n));
}

export function calculateStatistics(
  data: PotentialData,
  severeThreshold: number,
  lowThreshold: number
): Statistics {
  const flat = data.matrix.flat();
  const severeV = severeThreshold / 1000;
  const lowV = lowThreshold / 1000;

  let severe = 0;
  let uncertain = 0;
  let low = 0;

  flat.forEach((v) => {
    if (v < severeV) severe++;
    else if (v > lowV) low++;
    else uncertain++;
  });

  const total = flat.length || 1;
  const mean = flat.reduce((a, b) => a + b, 0) / total;
  const stdDev = Math.sqrt(flat.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / total);

  return {
    severe: { count: severe, percentage: (severe / total) * 100 },
    uncertain: { count: uncertain, percentage: (uncertain / total) * 100 },
    low: { count: low, percentage: (low / total) * 100 },
    mean: mean * 1000,
    stdDev: stdDev * 1000,
    min: Math.min(...flat) * 1000,
    max: Math.max(...flat) * 1000,
    total,
  };
}

export function getUncertainPoints(
  data: PotentialData,
  severeThreshold: number,
  lowThreshold: number
): UncertainPoint[] {
  const severeV = severeThreshold / 1000;
  const lowV = lowThreshold / 1000;
  const points: UncertainPoint[] = [];

  data.matrix.forEach((row, r) => {
    row.forEach((v, c) => {
      if (v >= severeV && v <= lowV) {
        points.push({
          x: data.xVals[c],
          y: data.yVals[r],
          value: v * 1000,
        });
      }
    });
  });

  return points;
}

export function calculateGradients(data: PotentialData): GradientPoint[] {
  const grads: GradientPoint[] = [];
  const dx = Math.abs(data.xVals[1] - data.xVals[0]) || 1;
  const dy = Math.abs(data.yVals[1] - data.yVals[0]) || 1;

  for (let r = 0; r < data.matrix.length - 1; r++) {
    for (let c = 0; c < data.matrix[r].length - 1; c++) {
      const gradX = Math.abs(data.matrix[r][c + 1] - data.matrix[r][c]) / dx;
      const gradY = Math.abs(data.matrix[r + 1][c] - data.matrix[r][c]) / dy;
      const g = Math.max(gradX, gradY) * 1000;
      grads.push({ x: data.xVals[c], y: data.yVals[r], gradient: g });
    }
  }

  return grads;
}

export interface GradientMatrix {
  xVals: number[];
  yVals: number[];
  matrix: number[][];
}

export function calculateGradientMatrix(data: PotentialData): GradientMatrix {
  const dx = Math.abs(data.xVals[1] - data.xVals[0]) || 1;
  const dy = Math.abs(data.yVals[1] - data.yVals[0]) || 1;
  
  const matrix: number[][] = [];
  
  for (let r = 0; r < data.matrix.length - 1; r++) {
    const row: number[] = [];
    for (let c = 0; c < data.matrix[r].length - 1; c++) {
      const gradX = Math.abs(data.matrix[r][c + 1] - data.matrix[r][c]) / dx;
      const gradY = Math.abs(data.matrix[r + 1][c] - data.matrix[r][c]) / dy;
      const g = Math.max(gradX, gradY) * 1000;
      row.push(g);
    }
    matrix.push(row);
  }
  
  // Use the first N-1 x and y values
  const xVals = data.xVals.slice(0, -1);
  const yVals = data.yVals.slice(0, -1);
  
  return { xVals, yVals, matrix };
}

export function generateRecommendations(
  stats: Statistics,
  gradients: GradientPoint[],
  params: Parameters
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const severeRatio = stats.severe.percentage / 100;
  const uncertainRatio = stats.uncertain.percentage / 100;
  const lowRatio = stats.low.percentage / 100;
  const maxGradient = gradients.length ? Math.max(...gradients.map((g) => g.gradient)) : 0;
  const criticalGradients = gradients.filter((g) => g.gradient > 100).length;

  // ASTM C876 based recommendations

  // High risk area analysis
  if (severeRatio > 0.5) {
    recommendations.push({
      type: 'urgent',
      title: 'CORROSÃO ATIVA GENERALIZADA',
      description: `Mais de 50% da área (${stats.severe.percentage.toFixed(1)}%) apresenta potenciais indicativos de corrosão ativa. Segundo a ASTM C876, há mais de 90% de probabilidade de corrosão nestas regiões. Recomenda-se investigação imediata com técnicas complementares (resistividade, taxa de corrosão) e avaliação estrutural urgente.`,
      astmRef: 'ASTM C876-15, Seção 6.2',
    });
  } else if (severeRatio > 0.2) {
    recommendations.push({
      type: 'urgent',
      title: 'CORROSÃO LOCALIZADA SIGNIFICATIVA',
      description: `${stats.severe.percentage.toFixed(1)}% da área apresenta alto risco de corrosão. Ação corretiva necessária nas zonas afetadas. Recomenda-se mapeamento detalhado das áreas críticas e verificação da integridade das armaduras.`,
      astmRef: 'ASTM C876-15, Seção 6.2',
    });
  } else if (severeRatio > 0.05) {
    recommendations.push({
      type: 'warning',
      title: 'Pontos de Corrosão Localizados',
      description: `Detectados ${stats.severe.count} pontos (${stats.severe.percentage.toFixed(1)}%) com indicação de corrosão ativa. Monitorar evolução e considerar intervenção preventiva nos pontos identificados.`,
      astmRef: 'ASTM C876-15, Seção 6.2',
    });
  }

  // Uncertain zone analysis
  if (uncertainRatio > 0.5) {
    recommendations.push({
      type: 'warning',
      title: 'GRANDE ÁREA EM ZONA DE TRANSIÇÃO',
      description: `${stats.uncertain.percentage.toFixed(1)}% dos pontos estão na zona de incerteza. Conforme ASTM C876, esta faixa não permite conclusão definitiva sobre a atividade de corrosão. Recomenda-se: (1) verificar condições de umidade do concreto, (2) realizar medições adicionais com o concreto em diferentes estados de saturação, (3) considerar técnicas complementares como resistividade de polarização linear.`,
      astmRef: 'ASTM C876-15, Seção 6.3',
    });
  } else if (uncertainRatio > 0.3) {
    recommendations.push({
      type: 'info',
      title: 'Zona de Incerteza Moderada',
      description: `${stats.uncertain.percentage.toFixed(1)}% da área está na zona de transição. Recomenda-se monitoramento periódico para detectar possível evolução para corrosão ativa.`,
      astmRef: 'ASTM C876-15, Seção 6.3',
    });
  }

  // Gradient analysis
  if (maxGradient > 150) {
    recommendations.push({
      type: 'urgent',
      title: 'GRADIENTES DE POTENCIAL ELEVADOS',
      description: `Detectado gradiente máximo de ${maxGradient.toFixed(0)} mV/m. Gradientes superiores a 150 mV/m indicam formação de macrocélulas de corrosão ativas. ${criticalGradients} pontos apresentam gradientes críticos (>100 mV/m). Investigação imediata necessária nestas regiões.`,
      astmRef: 'ASTM C876-15, Anexo X1',
    });
  } else if (maxGradient > 100) {
    recommendations.push({
      type: 'warning',
      title: 'Gradientes de Potencial Significativos',
      description: `Gradiente máximo de ${maxGradient.toFixed(0)} mV/m detectado. ${criticalGradients} pontos com gradientes acima de 100 mV/m. Monitorar estas áreas para evolução de macrocélulas.`,
      astmRef: 'ASTM C876-15, Anexo X1',
    });
  }

  // Cover depth considerations
  if (params.coverDepth > 75) {
    recommendations.push({
      type: 'info',
      title: 'Cobrimento Elevado',
      description: `Cobrimento de ${params.coverDepth}mm pode causar atenuação das leituras. A ASTM C876 indica que cobrimentos superiores a 75mm podem resultar em potenciais mais positivos que os reais. Considerar esta influência na interpretação.`,
      astmRef: 'ASTM C876-15, Seção 5.4',
    });
  } else if (params.coverDepth < 20) {
    recommendations.push({
      type: 'info',
      title: 'Cobrimento Reduzido',
      description: `Cobrimento de ${params.coverDepth}mm é inferior ao mínimo normativo para proteção adequada das armaduras. Este fator pode contribuir para corrosão acelerada, independente dos potenciais medidos.`,
    });
  }

  // Resistivity considerations
  if (params.resistivity !== null) {
    if (params.resistivity > 50) {
      recommendations.push({
        type: 'info',
        title: 'Alta Resistividade do Concreto',
        description: `Resistividade de ${params.resistivity} kΩ·cm indica concreto seco ou de baixa porosidade. Valores acima de 50 kΩ·cm podem mascarar a detecção de corrosão pelo método de potencial. Recomenda-se medição com concreto úmido.`,
        astmRef: 'ASTM C876-15, Seção 5.2',
      });
    } else if (params.resistivity < 10) {
      recommendations.push({
        type: 'warning',
        title: 'Baixa Resistividade',
        description: `Resistividade de ${params.resistivity} kΩ·cm indica alta condutividade, possivelmente por contaminação por cloretos ou carbonatação. Taxa de corrosão pode ser elevada nas áreas com potencial ativo.`,
      });
    }
  }

  // Positive conclusion
  if (lowRatio > 0.9 && severeRatio === 0) {
    recommendations.push({
      type: 'success',
      title: 'CONDIÇÃO PASSIVA CONFIRMADA',
      description: `${stats.low.percentage.toFixed(1)}% da área apresenta potenciais indicativos de armadura em estado passivo. Segundo ASTM C876, há mais de 90% de probabilidade de não haver corrosão ativa. Estrutura em bom estado de conservação.`,
      astmRef: 'ASTM C876-15, Seção 6.1',
    });
  } else if (lowRatio > 0.8) {
    recommendations.push({
      type: 'success',
      title: 'Predominância de Condição Passiva',
      description: `${stats.low.percentage.toFixed(1)}% da área apresenta baixo risco de corrosão. Recomenda-se monitoramento periódico para manutenção desta condição.`,
      astmRef: 'ASTM C876-15, Seção 6.1',
    });
  }

  // Standard deviation analysis
  if (stats.stdDev > 50) {
    recommendations.push({
      type: 'info',
      title: 'Alta Variabilidade nos Potenciais',
      description: `Desvio padrão de ${stats.stdDev.toFixed(0)} mV indica heterogeneidade significativa nas condições eletroquímicas. Pode indicar: (1) variação na qualidade do concreto, (2) diferentes graus de carbonatação, (3) contaminação localizada por cloretos.`,
    });
  }

  return recommendations;
}

export function getASTMInterpretation(stats: Statistics, electrode: string): string {
  const severeRatio = stats.severe.percentage / 100;
  const lowRatio = stats.low.percentage / 100;

  let interpretation = '';

  if (severeRatio > 0.5) {
    interpretation = `CONDIÇÃO CRÍTICA: A análise indica corrosão ativa generalizada na estrutura inspecionada.`;
  } else if (severeRatio > 0.2) {
    interpretation = `ATENÇÃO REQUERIDA: Corrosão localizada significativa detectada. Intervenção recomendada.`;
  } else if (lowRatio > 0.8) {
    interpretation = `CONDIÇÃO SATISFATÓRIA: Estrutura predominantemente em estado passivo.`;
  } else {
    interpretation = `CONDIÇÃO INTERMEDIÁRIA: Monitoramento continuado recomendado.`;
  }

  return interpretation;
}
