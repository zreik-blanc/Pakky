import { Package, Sparkles, BarChart3, Code2, Terminal, Server } from 'lucide-react';

// Map icons and colors based on preset ID or keywords
// Using consistent green/gray theme
export const getPresetConfig = (id: string, index: number) => {
    const configs = [
        { icon: Code2, gradient: 'from-emerald-500/10 via-green-500/5 to-transparent', accent: 'text-emerald-400', ring: 'ring-emerald-500/20' },
        { icon: Terminal, gradient: 'from-green-500/10 via-emerald-500/5 to-transparent', accent: 'text-green-400', ring: 'ring-green-500/20' },
        { icon: Server, gradient: 'from-muted/30 via-muted/10 to-transparent', accent: 'text-muted-foreground', ring: 'ring-border' },
        { icon: Package, gradient: 'from-emerald-500/10 via-muted/10 to-transparent', accent: 'text-emerald-500', ring: 'ring-emerald-500/20' },
        { icon: Sparkles, gradient: 'from-primary/10 via-primary/5 to-transparent', accent: 'text-primary', ring: 'ring-primary/20' },
    ];

    // Match based on preset ID keywords
    if (id.includes('devops') || id.includes('infra')) return { ...configs[2], icon: Server };
    if (id.includes('web') || id.includes('frontend')) return { ...configs[0], icon: Code2 };
    if (id.includes('data') || id.includes('science')) return { ...configs[1], icon: BarChart3 };
    if (id.includes('minimal') || id.includes('basic')) return { ...configs[3], icon: Package };
    if (id.includes('dev')) return { ...configs[0], icon: Code2 };

    return configs[index % configs.length];
};

export { PresetSkeleton } from './PresetSkeleton';
export { HeroPreset } from './HeroPreset';
export { PresetCard } from './PresetCard';
