import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import {
  PotentialData,
  Statistics,
  UncertainPoint,
  GradientPoint,
  Recommendation,
  Parameters,
} from '@/types/potential';
import { formatNumber, getASTMInterpretation } from './calculations';
import { GRADIENT_EXPLANATION } from './pdfGenerator';

// @ts-ignore
import Plotly from 'plotly.js-dist-min';

export interface WordData {
  data: PotentialData;
  stats: Statistics;
  uncertainPoints: UncertainPoint[];
  gradients: GradientPoint[];
  recommendations: Recommendation[];
  params: Parameters;
  comments?: string;
}

async function captureChartAsBase64(element: HTMLElement | null): Promise<string | null> {
  if (!element) return null;

  try {
    const plotlyDiv = element.querySelector('.js-plotly-plot') as HTMLElement;
    if (plotlyDiv) {
      const imgData = await Plotly.toImage(plotlyDiv, {
        format: 'png',
        width: 700,
        height: 400,
        scale: 2,
      });
      // Remove the data:image/png;base64, prefix
      return imgData.replace(/^data:image\/png;base64,/, '');
    }
  } catch (error) {
    console.error('Error capturing chart:', error);
  }
  return null;
}

function createSectionTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        color: '2C3E50',
      }),
    ],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 200 },
    shading: {
      type: ShadingType.SOLID,
      color: 'ECF0F1',
    },
  });
}

function createRiskTable(stats: Statistics, params: Parameters): Table {
  const rows = [
    { label: 'Alto Risco (>90% prob. corrosão)', range: `< ${params.severeThreshold} mV`, count: stats.severe.count, pct: stats.severe.percentage },
    { label: 'Incerto (Zona de transição)', range: `${params.severeThreshold} a ${params.lowThreshold} mV`, count: stats.uncertain.count, pct: stats.uncertain.percentage },
    { label: 'Baixo Risco (>90% prob. passiva)', range: `> ${params.lowThreshold} mV`, count: stats.low.count, pct: stats.low.percentage },
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Classificação', bold: true, color: 'FFFFFF' })] })],
            shading: { type: ShadingType.SOLID, color: '34495E' },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Faixa', bold: true, color: 'FFFFFF' })] })],
            shading: { type: ShadingType.SOLID, color: '34495E' },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Pontos', bold: true, color: 'FFFFFF' })] })],
            shading: { type: ShadingType.SOLID, color: '34495E' },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: 'Percentual', bold: true, color: 'FFFFFF' })] })],
            shading: { type: ShadingType.SOLID, color: '34495E' },
          }),
        ],
      }),
      ...rows.map((row, i) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: row.label })] })],
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'FFFFFF' : 'F9F9F9' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: row.range })] })],
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'FFFFFF' : 'F9F9F9' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: row.count.toString() })] })],
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'FFFFFF' : 'F9F9F9' },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: `${row.pct.toFixed(1)}%`, bold: true })] })],
              shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? 'FFFFFF' : 'F9F9F9' },
            }),
          ],
        })
      ),
    ],
  });
}

export async function generateWord(
  wordData: WordData,
  chartRefs: {
    plot2d: HTMLElement | null;
    plot3d: HTMLElement | null;
    plotHist: HTMLElement | null;
    plotPie: HTMLElement | null;
    plotGradient: HTMLElement | null;
  }
): Promise<void> {
  const date = new Date().toLocaleDateString('pt-BR');
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const interpretation = getASTMInterpretation(wordData.stats, wordData.params.electrode);

  // Capture charts
  const [img2d, img3d, imgGradient] = await Promise.all([
    captureChartAsBase64(chartRefs.plot2d),
    captureChartAsBase64(chartRefs.plot3d),
    captureChartAsBase64(chartRefs.plotGradient),
  ]);

  const maxGrad = wordData.gradients.length ? Math.max(...wordData.gradients.map(g => g.gradient)) : 0;
  const avgGrad = wordData.gradients.length ? wordData.gradients.reduce((a, b) => a + b.gradient, 0) / wordData.gradients.length : 0;
  const criticalCount = wordData.gradients.filter(g => g.gradient > 100).length;

  // Build document children array
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'RELATÓRIO DE MAPEAMENTO DE POTENCIAL',
          bold: true,
          size: 36,
          color: '2C3E50',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Avaliação de Corrosão em Armaduras - ASTM C876',
          size: 24,
          color: '7F8C8D',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Data: ${date} às ${time} | Eletrodo: ${wordData.params.electrode}`,
          size: 20,
          color: '95A5A6',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // 1. Executive Summary
  children.push(createSectionTitle('1. RESUMO EXECUTIVO'));

  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Parâmetros de Ensaio:', bold: true })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `• Eletrodo de Referência: ${wordData.params.electrode}` })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `• Cobrimento: ${wordData.params.coverDepth} mm` })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `• Resistividade: ${wordData.params.resistivity || '-'} kΩ·cm` })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Estatísticas Globais:', bold: true })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `• Média: ${wordData.stats.mean.toFixed(0)} mV | Desvio Padrão: ${wordData.stats.stdDev.toFixed(0)} mV` })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `• Faixa: ${wordData.stats.min.toFixed(0)} a ${wordData.stats.max.toFixed(0)} mV | Total: ${wordData.stats.total} pontos` })],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Interpretação: ', bold: true }),
        new TextRun({ text: interpretation }),
      ],
      spacing: { after: 400 },
      shading: { type: ShadingType.SOLID, color: 'E8F4FD' },
    })
  );

  // 2. Risk Analysis
  children.push(createSectionTitle('2. ANÁLISE DE RISCO CONFORME ASTM C876'));
  children.push(createRiskTable(wordData.stats, wordData.params));
  children.push(new Paragraph({ spacing: { after: 200 } }));

  // 3. Recommendations
  children.push(createSectionTitle('3. RECOMENDAÇÕES TÉCNICAS'));

  wordData.recommendations.forEach((rec) => {
    const typeColors: Record<string, string> = {
      urgent: 'E74C3C',
      warning: 'F1C40F',
      info: '3498DB',
      success: '2ECC71',
    };

    children.push(
      new Paragraph({
        children: [new TextRun({ text: rec.title, bold: true, color: typeColors[rec.type] || '3498DB' })],
        spacing: { before: 200, after: 50 },
      }),
      new Paragraph({
        children: [new TextRun({ text: rec.description, size: 22 })],
      })
    );

    if (rec.astmRef) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Referência: ${rec.astmRef}`, italics: true, size: 20, color: '7F8C8D' })],
          spacing: { after: 100 },
        })
      );
    }
  });

  // 4. 2D Map
  children.push(createSectionTitle('4. MAPA DE POTENCIAIS (2D)'));

  if (img2d) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: Buffer.from(img2d, 'base64'),
            transformation: { width: 550, height: 300 },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '[Imagem não disponível]', italics: true, color: '999999' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // 5. 3D Surface
  children.push(createSectionTitle('5. TOPOGRAFIA 3D (VISTA ISOMÉTRICA)'));

  if (img3d) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: Buffer.from(img3d, 'base64'),
            transformation: { width: 550, height: 300 },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Vista isométrica da superfície de potenciais. Valores mais negativos (vales) indicam maior probabilidade de corrosão.',
            italics: true,
            size: 20,
            color: '7F8C8D',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '[Imagem não disponível]', italics: true, color: '999999' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  // 6. Gradients
  children.push(createSectionTitle('6. MAPA DE GRADIENTES DE POTENCIAL'));

  if (imgGradient) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: Buffer.from(imgGradient, 'base64'),
            transformation: { width: 550, height: 280 },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '[Imagem não disponível]', italics: true, color: '999999' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Estatísticas de Gradientes:', bold: true })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `• Gradiente Máximo: ${maxGrad.toFixed(0)} mV/m` })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `• Gradiente Médio: ${avgGrad.toFixed(0)} mV/m` })],
    }),
    new Paragraph({
      children: [new TextRun({ text: `• Pontos Críticos (>100 mV/m): ${criticalCount}` })],
      spacing: { after: 300 },
    })
  );

  // Gradient explanation
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '6.1 METODOLOGIA DE CÁLCULO DOS GRADIENTES', bold: true })],
      spacing: { before: 200, after: 200 },
    })
  );

  GRADIENT_EXPLANATION.split('\n').forEach((line) => {
    if (line.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: 50 },
        })
      );
    }
  });

  // 7. Comments
  children.push(createSectionTitle('7. OBSERVAÇÕES E COMENTÁRIOS'));

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: wordData.comments?.trim() || 'Espaço reservado para observações do inspetor.',
          italics: !wordData.comments?.trim(),
          color: wordData.comments?.trim() ? '333333' : '999999',
        }),
      ],
      spacing: { after: 400 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
    })
  );

  // 8. Signature
  children.push(createSectionTitle('8. RESPONSÁVEL TÉCNICO'));

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '_'.repeat(40) }),
        new TextRun({ text: '          ' }),
        new TextRun({ text: '_'.repeat(20) }),
      ],
      spacing: { before: 400, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Assinatura do Responsável', size: 18, color: '7F8C8D' }),
        new TextRun({ text: '                                              ' }),
        new TextRun({ text: 'Data', size: 18, color: '7F8C8D' }),
      ],
    })
  );

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Relatório gerado conforme ASTM C876-15: Standard Test Method for Corrosion Potentials of Uncoated Reinforcing Steel in Concrete',
          size: 16,
          italics: true,
          color: '999999',
        }),
      ],
      spacing: { before: 800 },
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Relatorio_ASTM_C876_${date.replace(/\//g, '-')}.docx`);
}
