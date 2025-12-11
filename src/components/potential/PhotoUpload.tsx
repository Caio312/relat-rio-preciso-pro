import { useCallback, useRef } from 'react';
import { AttachedPhoto } from '@/types/potential';
import { Camera, X, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoUploadProps {
  photos: AttachedPhoto[];
  onChange: (photos: AttachedPhoto[]) => void;
}

export function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Filter valid files
    const validFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é uma imagem válida`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name} excede o tamanho máximo de 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Process all files with Promise.all
    const processFile = (file: File): Promise<AttachedPhoto> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          resolve({
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            dataUrl,
            description: '',
          });
        };
        reader.onerror = () => reject(new Error(`Erro ao ler ${file.name}`));
        reader.readAsDataURL(file);
      });
    };

    try {
      const newPhotos = await Promise.all(validFiles.map(processFile));
      onChange([...photos, ...newPhotos]);
      toast.success(`${newPhotos.length} foto(s) adicionada(s)`);
    } catch (error) {
      toast.error('Erro ao processar algumas fotos');
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [photos, onChange]);

  const handleRemove = useCallback((id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  }, [photos, onChange]);

  const handleDescriptionChange = useCallback((id: string, description: string) => {
    onChange(photos.map((p) => p.id === id ? { ...p, description } : p));
  }, [photos, onChange]);

  return (
    <div className="section-box">
      <h4 className="flex items-center gap-2 text-sm font-semibold mb-4">
        <Camera className="w-4 h-4 text-primary" />
        Fotos Anexas
      </h4>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="w-full p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors flex flex-col items-center gap-2"
      >
        <Upload className="w-8 h-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Clique para adicionar fotos ou arraste arquivos aqui
        </span>
        <span className="text-xs text-muted-foreground">
          Formatos aceitos: JPG, PNG, WEBP (máx. 5MB cada)
        </span>
      </button>

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <button
                onClick={() => handleRemove(photo.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>

              <input
                type="text"
                className="mt-2 w-full p-1.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Descrição da foto"
                value={photo.description}
                onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {photos.length} foto(s) anexada(s). Estas fotos serão incluídas como anexo ao final do relatório.
        </p>
      )}
    </div>
  );
}
