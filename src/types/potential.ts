export interface PotentialData {
  xVals: number[];
  yVals: number[];
  matrix: number[][];
}

export interface ElectrodeReference {
  name: string;
  label: string;
  severeThreshold: number;
  lowThreshold: number;
}

export interface Statistics {
  severe: { count: number; percentage: number };
  uncertain: { count: number; percentage: number };
  low: { count: number; percentage: number };
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  total: number;
}

export interface UncertainPoint {
  x: number;
  y: number;
  value: number;
}

export interface GradientPoint {
  x: number;
  y: number;
  gradient: number;
}

export interface Recommendation {
  type: 'urgent' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  astmRef?: string;
}

export interface Parameters {
  electrode: string;
  coverDepth: number;
  resistivity: number | null;
  severeThreshold: number;
  lowThreshold: number;
  colorscale: string;
}

export const ELECTRODE_REFERENCES: Record<string, ElectrodeReference> = {
  CSE: {
    name: 'CSE',
    label: 'Cu/CuSO₄ (CSE)',
    severeThreshold: -350,
    lowThreshold: -200,
  },
  SCE: {
    name: 'SCE',
    label: 'Calomelano Saturado (SCE)',
    severeThreshold: -260,
    lowThreshold: -110,
  },
  AgAgCl: {
    name: 'AgAgCl',
    label: 'Ag/AgCl (3M KCl)',
    severeThreshold: -305,
    lowThreshold: -155,
  },
};

export const COLORSCALES = [
  { value: 'Jet', label: 'Jet (Arco-íris)' },
  { value: 'Viridis', label: 'Viridis' },
  { value: 'Hot', label: 'Hot' },
  { value: 'Portland', label: 'Portland' },
  { value: 'RdYlGn', label: 'Vermelho-Verde' },
];

export const DEFAULT_DATA: number[][] = [
  [-0.19, -0.17, -0.19],
  [-0.18, -0.22, -0.17],
  [-0.15, -0.21, -0.14],
  [-0.15, -0.23, -0.13],
  [-0.21, -0.24, -0.15],
  [-0.20, -0.20, -0.11],
  [-0.17, -0.25, -0.20],
  [-0.18, -0.21, -0.19],
  [-0.19, -0.22, -0.18],
  [-0.12, -0.17, -0.20],
  [-0.17, -0.20, -0.23],
  [-0.20, -0.14, -0.22],
  [-0.18, -0.20, -0.23],
  [-0.21, -0.20, -0.18],
  [-0.18, -0.21, -0.22],
];

export const DEFAULT_X = [0, 0.15, 0.30];
export const DEFAULT_Y = [1.94, 1.84, 1.74, 1.64, 1.54, 1.44, 1.34, 1.24, 1.14, 1.04, 0.94, 0.84, 0.74, 0.64, 0.54];
