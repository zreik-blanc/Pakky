import { Package, Sparkles, BarChart3, Code2, Terminal } from 'lucide-react';

// Map icons and colors based on preset ID or keywords
export const getPresetConfig = (id: string, index: number) => {
    const configs = [
        { icon: Sparkles, gradient: 'from-violet-500/20 via-purple-500/10 to-fuchsia-500/20', accent: 'text-violet-400', ring: 'ring-violet-500/20' },
        { icon: Code2, gradient: 'from-emerald-500/20 via-green-500/10 to-teal-500/20', accent: 'text-emerald-400', ring: 'ring-emerald-500/20' },
        { icon: BarChart3, gradient: 'from-blue-500/20 via-cyan-500/10 to-sky-500/20', accent: 'text-blue-400', ring: 'ring-blue-500/20' },
        { icon: Terminal, gradient: 'from-orange-500/20 via-amber-500/10 to-yellow-500/20', accent: 'text-orange-400', ring: 'ring-orange-500/20' },
        { icon: Package, gradient: 'from-rose-500/20 via-pink-500/10 to-red-500/20', accent: 'text-rose-400', ring: 'ring-rose-500/20' },
    ];

    if (id.includes('web')) return { ...configs[0], icon: Sparkles };
    if (id.includes('data')) return { ...configs[2], icon: BarChart3 };
    if (id.includes('minimal')) return { ...configs[4], icon: Package };
    if (id.includes('dev')) return { ...configs[1], icon: Code2 };

    return configs[index % configs.length];
};

export { PresetSkeleton } from './PresetSkeleton';
export { HeroPreset } from './HeroPreset';
export { PresetCard } from './PresetCard';
