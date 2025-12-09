import { useState, useCallback, useMemo } from 'react';
import {
  PotentialData,
  Parameters,
  Statistics,
  UncertainPoint,
  GradientPoint,
  Recommendation,
  ELECTRODE_REFERENCES,
  DEFAULT_DATA,
  DEFAULT_X,
  DEFAULT_Y,
} from '@/types/potential';
import {
  calculateStatistics,
  getUncertainPoints,
  calculateGradients,
  generateRecommendations,
  parseArray,
} from '@/utils/calculations';

export function usePotentialData() {
  const [data, setData] = useState<PotentialData>({
    xVals: DEFAULT_X,
    yVals: DEFAULT_Y,
    matrix: DEFAULT_DATA,
  });

  const [params, setParams] = useState<Parameters>({
    electrode: 'CSE',
    coverDepth: 30,
    resistivity: null,
    severeThreshold: -350,
    lowThreshold: -200,
    colorscale: 'Jet',
  });

  const stats = useMemo<Statistics>(() => {
    return calculateStatistics(data, params.severeThreshold, params.lowThreshold);
  }, [data, params.severeThreshold, params.lowThreshold]);

  const uncertainPoints = useMemo<UncertainPoint[]>(() => {
    return getUncertainPoints(data, params.severeThreshold, params.lowThreshold);
  }, [data, params.severeThreshold, params.lowThreshold]);

  const gradients = useMemo<GradientPoint[]>(() => {
    return calculateGradients(data);
  }, [data]);

  const recommendations = useMemo<Recommendation[]>(() => {
    return generateRecommendations(stats, gradients, params);
  }, [stats, gradients, params]);

  const updateCell = useCallback((row: number, col: number, value: number) => {
    setData((prev) => {
      const newMatrix = prev.matrix.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r
      );
      return { ...prev, matrix: newMatrix };
    });
  }, []);

  const updateGrid = useCallback((xInput: string, yInput: string) => {
    const xVals = parseArray(xInput).sort((a, b) => a - b);
    const yVals = parseArray(yInput).sort((a, b) => b - a);
    
    const matrix = yVals.map(() => xVals.map(() => 0));
    
    setData({ xVals, yVals, matrix });
  }, []);

  const updateElectrode = useCallback((electrode: string) => {
    const ref = ELECTRODE_REFERENCES[electrode];
    if (ref) {
      setParams((prev) => ({
        ...prev,
        electrode,
        severeThreshold: ref.severeThreshold,
        lowThreshold: ref.lowThreshold,
      }));
    }
  }, []);

  const updateParams = useCallback((updates: Partial<Parameters>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  }, []);

  const importCSV = useCallback((content: string) => {
    const lines = content.trim().split(/\r\n|\n/).filter((x) => !x.startsWith('#'));
    if (lines.length < 2) {
      throw new Error('CSV Inválido');
    }

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const header = parseArray(lines[0].split(delimiter).slice(1).join(';'));
    const yValues: number[] = [];
    const matrixData: number[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(delimiter);
      if (row.length > 1) {
        yValues.push(parseFloat(row[0].replace(',', '.')) || 0);
        matrixData.push(parseArray(row.slice(1).join(';')));
      }
    }

    setData({
      xVals: header.sort((a, b) => a - b),
      yVals: yValues.sort((a, b) => b - a),
      matrix: matrixData,
    });
  }, []);

  const exportCSV = useCallback((): string => {
    const fmt = (n: number) => n.toFixed(2).replace('.', ',');
    let csv = 'Y/X;' + data.xVals.map(fmt).join(';') + '\n';
    data.yVals.forEach((y, i) => {
      csv += fmt(y) + ';' + data.matrix[i].map(fmt).join(';') + '\n';
    });
    return csv;
  }, [data]);

  return {
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
    setData,
  };
}
