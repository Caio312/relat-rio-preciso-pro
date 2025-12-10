import { MessageSquare } from 'lucide-react';

interface CommentsSectionProps {
  comments: string;
  onChange: (value: string) => void;
}

export function CommentsSection({ comments, onChange }: CommentsSectionProps) {
  return (
    <div className="section-box">
      <h4 className="flex items-center gap-2 text-sm font-semibold mb-4">
        <MessageSquare className="w-4 h-4 text-primary" />
        Observações e Comentários
      </h4>
      
      <textarea
        className="w-full h-32 p-3 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="Adicione observações, notas de inspeção ou comentários que serão incluídos no relatório..."
        value={comments}
        onChange={(e) => onChange(e.target.value)}
      />
      
      <p className="text-xs text-muted-foreground mt-2">
        Estas observações serão incluídas na seção de comentários do relatório PDF/Word.
      </p>
    </div>
  );
}
