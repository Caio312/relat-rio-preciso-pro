import { Recommendation } from '@/types/potential';
import { AlertOctagon, AlertTriangle, Info, CheckCircle, ClipboardList } from 'lucide-react';

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

const iconMap = {
  urgent: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const styleMap = {
  urgent: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-500',
    icon: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-500',
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-300',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-500',
    icon: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-500',
    icon: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    title: 'text-green-800 dark:text-green-300',
  },
};

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="section-box border-l-4 border-primary">
        <h4 className="flex items-center gap-2 text-sm font-semibold mb-3">
          <ClipboardList className="w-4 h-4 text-primary" />
          Recomendações Técnicas
        </h4>
        <p className="text-sm text-muted-foreground">
          Insira dados para gerar recomendações baseadas na norma ASTM C876.
        </p>
      </div>
    );
  }

  return (
    <div className="section-box border-l-4 border-primary">
      <h4 className="flex items-center gap-2 text-sm font-semibold mb-4">
        <ClipboardList className="w-4 h-4 text-primary" />
        Recomendações Técnicas (ASTM C876)
      </h4>
      
      <div className="space-y-4">
        {recommendations.map((rec, i) => {
          const Icon = iconMap[rec.type];
          const styles = styleMap[rec.type];
          
          return (
            <div
              key={i}
              className={`p-4 rounded-lg border-l-4 ${styles.bg} ${styles.border} animate-fade-in`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.icon}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className={`font-semibold text-sm mb-1 ${styles.title}`}>
                    {rec.title}
                  </h5>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {rec.description}
                  </p>
                  {rec.astmRef && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Referência: {rec.astmRef}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
