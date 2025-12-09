import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';

// @ts-ignore - plotly.js types
import Plotly from 'plotly.js-dist-min';

interface PlotlyChartProps {
  data: any[];
  layout: any;
  config?: any;
  className?: string;
}

export const PlotlyChart = forwardRef<HTMLDivElement, PlotlyChartProps>(
  ({ data, layout, config, className }, ref) => {
    const chartRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => chartRef.current as HTMLDivElement);

    useEffect(() => {
      if (chartRef.current) {
        Plotly.react(
          chartRef.current,
          data,
          {
            ...layout,
            autosize: true,
          },
          {
            responsive: true,
            displayModeBar: false,
            ...config,
          }
        );
      }
    }, [data, layout, config]);

    useEffect(() => {
      const handleResize = () => {
        if (chartRef.current) {
          Plotly.Plots.resize(chartRef.current);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <div ref={chartRef} className={className} style={{ width: '100%', height: '100%' }} />;
  }
);

PlotlyChart.displayName = 'PlotlyChart';
