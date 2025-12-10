import { InspectionInfo } from '@/types/potential';
import { MapPin, Calendar, User, FileText } from 'lucide-react';

interface InspectionInfoFormProps {
  info: InspectionInfo;
  onChange: (info: InspectionInfo) => void;
}

export function InspectionInfoForm({ info, onChange }: InspectionInfoFormProps) {
  const handleChange = (field: keyof InspectionInfo, value: string) => {
    onChange({ ...info, [field]: value });
  };

  return (
    <div className="section-box">
      <h4 className="flex items-center gap-2 text-sm font-semibold mb-4">
        <FileText className="w-4 h-4 text-primary" />
        Informações do Ensaio
      </h4>
      
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
            <Calendar className="w-3 h-3" />
            Data do Ensaio
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={info.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>
        
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
            <MapPin className="w-3 h-3" />
            Local do Ensaio
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Ex: Edifício Central, São Paulo - SP"
            value={info.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <h5 className="flex items-center gap-2 text-xs font-semibold mb-3">
          <User className="w-3 h-3 text-primary" />
          Responsável Técnico
        </h5>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Nome Completo
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Nome do responsável técnico"
              value={info.responsibleName}
              onChange={(e) => handleChange('responsibleName', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Função/Cargo
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: Engenheiro Civil"
              value={info.responsibleRole}
              onChange={(e) => handleChange('responsibleRole', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              CREA
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Ex: CREA-SP 123456"
              value={info.crea}
              onChange={(e) => handleChange('crea', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              ART (Anotação de Responsabilidade Técnica)
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Número da ART"
              value={info.art}
              onChange={(e) => handleChange('art', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
