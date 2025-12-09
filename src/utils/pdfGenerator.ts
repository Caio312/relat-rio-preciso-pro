import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  PotentialData,
  Statistics,
  UncertainPoint,
  GradientPoint,
  Recommendation,
  Parameters,
} from '@/types/potential';
import { formatNumber, getASTMInterpretation } from './calculations';

// @ts-ignore
import Plotly from 'plotly.js-dist-min';

export interface PDFData {
  data: PotentialData;
  stats: Statistics;
  uncertainPoints: UncertainPoint[];
  gradients: GradientPoint[];
  recommendations: Recommendation[];
  params: Parameters;
}

async function captureChartImage(element: HTMLElement | null): Promise<string | null> {
  if (!element) return null;
  
  try {
    // Try to use Plotly's toImage if the element has a plotly graph
    const plotlyDiv = element.querySelector('.js-plotly-plot') as HTMLElement;
    if (plotlyDiv) {
      try {
        const imgData = await Plotly.toImage(plotlyDiv, {
          format: 'png',
          width: 800,
          height: 400,
          scale: 2,
        });
        return imgData;
      } catch (e) {
        console.warn('Plotly toImage failed, falling back to html2canvas');
      }
    }
    
    // Fallback to html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: true,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
}

export async function generatePDF(
  pdfData: PDFData,
  chartRefs: {
    plot2d: HTMLElement | null;
    plot3d: HTMLElement | null;
    plotHist: HTMLElement | null;
    plotPie: HTMLElement | null;
    plotGradient: HTMLElement | null;
  }
): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  const date = new Date().toLocaleDateString('pt-BR');
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Helper functions
  const addHeader = () => {
    pdf.setFillColor(44, 62, 80);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RELATÓRIO DE MAPEAMENTO DE POTENCIAL', margin, 12);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Avaliação de Corrosão em Armaduras - ASTM C876', margin, 19);
    
    pdf.setTextColor(200, 200, 200);
    pdf.setFontSize(9);
    pdf.text(`Data: ${date} às ${time}`, pageWidth - margin - 35, 12);
    pdf.text(`Ref: ${pdfData.params.electrode}`, pageWidth - margin - 35, 19);
    yPos = 35;
  };

  const addSectionTitle = (title: string) => {
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      addHeader();
    }
    pdf.setFillColor(52, 73, 94);
    pdf.rect(margin, yPos, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin + 3, yPos + 5.5);
    pdf.setTextColor(0, 0, 0);
    yPos += 12;
  };

  const addText = (text: string, fontSize = 10, isBold = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(51, 51, 51);
    const lines = pdf.splitTextToSize(text, contentWidth);
    if (yPos + lines.length * 5 > pageHeight - margin) {
      pdf.addPage();
      addHeader();
    }
    pdf.text(lines, margin, yPos);
    yPos += lines.length * 5 + 2;
  };

  // Start PDF generation
  addHeader();

  // 1. Executive Summary
  addSectionTitle('1. RESUMO EXECUTIVO');
  
  // Parameters box
  pdf.setFillColor(249, 249, 249);
  pdf.rect(margin, yPos, contentWidth / 2 - 3, 30, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margin, yPos, contentWidth / 2 - 3, 30, 'S');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(51, 51, 51);
  pdf.text('Parâmetros de Ensaio', margin + 3, yPos + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Eletrodo: ${pdfData.params.electrode}`, margin + 3, yPos + 12);
  pdf.text(`Cobrimento: ${pdfData.params.coverDepth} mm`, margin + 3, yPos + 18);
  pdf.text(`Resistividade: ${pdfData.params.resistivity || '-'} kΩ·cm`, margin + 3, yPos + 24);

  // Statistics box
  const statsX = margin + contentWidth / 2 + 3;
  pdf.setFillColor(249, 249, 249);
  pdf.rect(statsX, yPos, contentWidth / 2 - 3, 30, 'F');
  pdf.rect(statsX, yPos, contentWidth / 2 - 3, 30, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Estatísticas Globais', statsX + 3, yPos + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Média: ${pdfData.stats.mean.toFixed(0)} mV`, statsX + 3, yPos + 12);
  pdf.text(`Desvio Padrão: ${pdfData.stats.stdDev.toFixed(0)} mV`, statsX + 3, yPos + 18);
  pdf.text(`Faixa: ${pdfData.stats.min.toFixed(0)} a ${pdfData.stats.max.toFixed(0)} mV`, statsX + 3, yPos + 24);
  
  yPos += 35;

  // Interpretation
  const interpretation = getASTMInterpretation(pdfData.stats, pdfData.params.electrode);
  pdf.setFillColor(240, 248, 255);
  pdf.rect(margin, yPos, contentWidth, 12, 'F');
  pdf.setDrawColor(52, 152, 219);
  pdf.rect(margin, yPos, contentWidth, 12, 'S');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(44, 62, 80);
  pdf.text(interpretation, margin + 3, yPos + 7);
  yPos += 18;

  // 2. Risk Analysis
  addSectionTitle('2. ANÁLISE DE RISCO CONFORME ASTM C876');
  
  // Risk table
  const colWidths = [contentWidth * 0.4, contentWidth * 0.2, contentWidth * 0.2, contentWidth * 0.2];
  
  // Table header
  pdf.setFillColor(52, 73, 94);
  pdf.rect(margin, yPos, contentWidth, 7, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Classificação ASTM', margin + 3, yPos + 5);
  pdf.text('Faixa (mV)', margin + colWidths[0] + 3, yPos + 5);
  pdf.text('Pontos', margin + colWidths[0] + colWidths[1] + 3, yPos + 5);
  pdf.text('Percentual', margin + colWidths[0] + colWidths[1] + colWidths[2] + 3, yPos + 5);
  yPos += 7;

  // Table rows
  const rows = [
    { label: 'Alto Risco (>90% prob. corrosão)', range: `< ${pdfData.params.severeThreshold}`, count: pdfData.stats.severe.count, pct: pdfData.stats.severe.percentage, color: [231, 76, 60] },
    { label: 'Incerto (Zona de transição)', range: `${pdfData.params.severeThreshold} a ${pdfData.params.lowThreshold}`, count: pdfData.stats.uncertain.count, pct: pdfData.stats.uncertain.percentage, color: [241, 196, 15] },
    { label: 'Baixo Risco (>90% prob. passiva)', range: `> ${pdfData.params.lowThreshold}`, count: pdfData.stats.low.count, pct: pdfData.stats.low.percentage, color: [46, 204, 113] },
  ];

  rows.forEach((row, i) => {
    const bgColor = i % 2 === 0 ? [255, 255, 255] : [249, 249, 249];
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.rect(margin, yPos, contentWidth, 7, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, yPos, contentWidth, 7, 'S');
    
    pdf.setFillColor(row.color[0], row.color[1], row.color[2]);
    pdf.rect(margin + 1, yPos + 1.5, 4, 4, 'F');
    
    pdf.setTextColor(51, 51, 51);
    pdf.setFont('helvetica', 'normal');
    pdf.text(row.label, margin + 8, yPos + 5);
    pdf.text(row.range, margin + colWidths[0] + 3, yPos + 5);
    pdf.text(row.count.toString(), margin + colWidths[0] + colWidths[1] + 3, yPos + 5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${row.pct.toFixed(1)}%`, margin + colWidths[0] + colWidths[1] + colWidths[2] + 3, yPos + 5);
    yPos += 7;
  });
  
  yPos += 5;

  // Reference text
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 100, 100);
  pdf.text('* Limites baseados na ASTM C876-15 para eletrodo de referência ' + pdfData.params.electrode, margin, yPos);
  yPos += 10;

  // Capture charts
  const [pieImg, histImg] = await Promise.all([
    captureChartImage(chartRefs.plotPie),
    captureChartImage(chartRefs.plotHist),
  ]);

  if (pieImg || histImg) {
    if (yPos + 50 > pageHeight - margin) {
      pdf.addPage();
      addHeader();
    }
    const chartWidth = (contentWidth - 6) / 2;
    if (histImg) {
      pdf.addImage(histImg, 'PNG', margin, yPos, chartWidth, 45);
    }
    if (pieImg) {
      pdf.addImage(pieImg, 'PNG', margin + chartWidth + 6, yPos, chartWidth, 45);
    }
    yPos += 50;
  }

  // 3. Recommendations
  addSectionTitle('3. RECOMENDAÇÕES TÉCNICAS');
  
  pdfData.recommendations.forEach((rec) => {
    if (yPos + 20 > pageHeight - margin) {
      pdf.addPage();
      addHeader();
    }

    const colors: Record<string, number[]> = {
      urgent: [231, 76, 60],
      warning: [241, 196, 15],
      info: [52, 152, 219],
      success: [46, 204, 113],
    };

    const color = colors[rec.type] || colors.info;
    
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(margin, yPos, 4, 15, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);
    pdf.text(rec.title, margin + 7, yPos + 5);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(rec.description, contentWidth - 10);
    pdf.text(descLines, margin + 7, yPos + 11);
    
    if (rec.astmRef) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Referência: ${rec.astmRef}`, margin + 7, yPos + 11 + descLines.length * 4);
    }
    
    yPos += 15 + descLines.length * 4 + 3;
  });

  // New page for maps
  pdf.addPage();
  addHeader();

  // 4. 2D Potential Map
  addSectionTitle('4. MAPA DE POTENCIAIS (2D)');
  
  const map2dImg = await captureChartImage(chartRefs.plot2d);
  if (map2dImg) {
    const imgHeight = 70;
    pdf.addImage(map2dImg, 'PNG', margin, yPos, contentWidth, imgHeight);
    yPos += imgHeight + 5;
  }

  // 5. 3D Surface
  addSectionTitle('5. TOPOGRAFIA (3D)');
  
  const map3dImg = await captureChartImage(chartRefs.plot3d);
  if (map3dImg) {
    const imgHeight = 65;
    pdf.addImage(map3dImg, 'PNG', margin, yPos, contentWidth, imgHeight);
    yPos += imgHeight + 5;
  }

  // 6. Gradient Map
  addSectionTitle('6. MAPA DE GRADIENTES');
  
  const gradImg = await captureChartImage(chartRefs.plotGradient);
  if (gradImg) {
    const imgHeight = 50;
    pdf.addImage(gradImg, 'PNG', margin, yPos, contentWidth, imgHeight);
    yPos += imgHeight + 5;
  }

  // Gradient analysis
  const maxGrad = pdfData.gradients.length ? Math.max(...pdfData.gradients.map(g => g.gradient)) : 0;
  const criticalCount = pdfData.gradients.filter(g => g.gradient > 100).length;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(51, 51, 51);
  pdf.text(`Gradiente máximo: ${maxGrad.toFixed(0)} mV/m | Pontos críticos (>100 mV/m): ${criticalCount}`, margin, yPos);
  yPos += 8;

  // New page for uncertain points
  if (pdfData.uncertainPoints.length > 0) {
    pdf.addPage();
    addHeader();

    addSectionTitle('7. PONTOS EM ZONA DE INCERTEZA');
    
    addText('Lista de pontos medidos na zona de transição (entre limites alto e baixo risco). Estes pontos requerem atenção especial e possivelmente medições complementares.', 9);
    yPos += 3;

    // Uncertain points table
    const tableColWidths = [contentWidth / 3, contentWidth / 3, contentWidth / 3];
    
    pdf.setFillColor(52, 73, 94);
    pdf.rect(margin, yPos, contentWidth, 6, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Coordenada X (m)', margin + 3, yPos + 4);
    pdf.text('Coordenada Y (m)', margin + tableColWidths[0] + 3, yPos + 4);
    pdf.text('Potencial (mV)', margin + tableColWidths[0] + tableColWidths[1] + 3, yPos + 4);
    yPos += 6;

    pdfData.uncertainPoints.slice(0, 40).forEach((pt, i) => {
      if (yPos + 6 > pageHeight - margin) {
        pdf.addPage();
        addHeader();
        yPos = 35;
      }

      const bgColor = i % 2 === 0 ? [255, 255, 255] : [249, 249, 249];
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      pdf.rect(margin, yPos, contentWidth, 5, 'F');
      pdf.setDrawColor(230, 230, 230);
      pdf.rect(margin, yPos, contentWidth, 5, 'S');
      
      pdf.setTextColor(51, 51, 51);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(formatNumber(pt.x), margin + 3, yPos + 3.5);
      pdf.text(formatNumber(pt.y), margin + tableColWidths[0] + 3, yPos + 3.5);
      pdf.setTextColor(241, 196, 15);
      pdf.setFont('helvetica', 'bold');
      pdf.text(pt.value.toFixed(0), margin + tableColWidths[0] + tableColWidths[1] + 3, yPos + 3.5);
      yPos += 5;
    });

    if (pdfData.uncertainPoints.length > 40) {
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.text(`... e mais ${pdfData.uncertainPoints.length - 40} pontos não listados`, margin, yPos + 5);
    }
  }

  // Footer on last page
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    'Relatório gerado automaticamente conforme ASTM C876-15: Standard Test Method for Corrosion Potentials of Uncoated Reinforcing Steel in Concrete',
    margin,
    pageHeight - 8
  );

  // Save the PDF
  pdf.save(`Relatorio_ASTM_C876_${date.replace(/\//g, '-')}.pdf`);
}
