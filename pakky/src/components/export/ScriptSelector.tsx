/**
 * ScriptSelector Component
 * Select post-install scripts from available templates
 */

import { Label } from '@/components/ui/label';
import type { ScriptTemplate } from '@/lib/scriptTemplates';

interface ScriptSelectorProps {
    templates: ScriptTemplate[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    title?: string;
    description?: string;
}

export function ScriptSelector({
    templates,
    selectedIds,
    onChange,
    title = "Post-Install Scripts",
    description = "Select scripts to run after installation",
}: ScriptSelectorProps) {
    if (templates.length === 0) return null;

    const toggleTemplate = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(t => t !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    return (
        <div className="space-y-2">
            <Label className="text-sm">{title}</Label>
            <p className="text-xs text-muted-foreground mb-2">
                {description}
            </p>
            <div className="space-y-1">
                {templates.map(template => {
                    const isSelected = selectedIds.includes(template.id);
                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => toggleTemplate(template.id)}
                            className={`
                                w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all
                                ${isSelected
                                    ? 'bg-primary/10 ring-1 ring-primary/30'
                                    : 'hover:bg-muted/50'
                                }
                            `}
                        >
                            <div
                                className={`
                                    mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors
                                    ${isSelected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-muted-foreground/30'
                                    }
                                `}
                            >
                                {isSelected && (
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                                    {template.name}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {template.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
