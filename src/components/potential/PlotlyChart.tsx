import { forwardRef, useEffect, useRef, useImperativeHandle, useState, Component, ReactNode } from 'react';

// @ts-ignore - plotly.js types
import Plotly from 'plotly.js-dist-min';

// Error Boundary for Plotly
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class PlotlyErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PlotlyChart error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Erro ao renderizar gráfico
        </div>
      );
    }
    return this.props.children;
  }
}

interface PlotlyChartProps {
  data: any[];
  layout: any;
  config?: any;
  className?: string;
}

const PlotlyChartInner = forwardRef<HTMLDivElement, PlotlyChartProps>(
  ({ data, layout, config, className }, ref) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    useImperativeHandle(ref, () => chartRef.current as HTMLDivElement);

    useEffect(() => {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      if (!chartRef.current || !isReady || !data || data.length === 0) return;

      // Validate data before plotting
      const hasValidData = data.every(trace => {
        if (trace.type === 'surface' || trace.type === 'contour') {
          return trace.z && Array.isArray(trace.z) && trace.z.length > 0;
        }
        if (trace.type === 'scatter') {
          return trace.x && trace.y && trace.x.length > 0;
        }
        if (trace.type === 'histogram') {
          return trace.x && trace.x.length > 0;
        }
        if (trace.type === 'pie') {
          return trace.values && trace.values.length > 0;
        }
        return true;
      });

      if (!hasValidData) {
        console.warn('Invalid data for Plotly chart');
        return;
      }

      try {
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
      } catch (err) {
        console.error('Plotly.react error:', err);
      }
    }, [data, layout, config, isReady]);

    useEffect(() => {
      const handleResize = () => {
        if (chartRef.current) {
          try {
            Plotly.Plots.resize(chartRef.current);
          } catch (err) {
            // Ignore resize errors
          }
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <div ref={chartRef} className={className} style={{ width: '100%', height: '100%' }} />;
  }
);

PlotlyChartInner.displayName = 'PlotlyChartInner';

export const PlotlyChart = forwardRef<HTMLDivElement, PlotlyChartProps>(
  (props, ref) => {
    return (
      <PlotlyErrorBoundary>
        <PlotlyChartInner {...props} ref={ref} />
      </PlotlyErrorBoundary>
    );
  }
);

PlotlyChart.displayName = 'PlotlyChart';
