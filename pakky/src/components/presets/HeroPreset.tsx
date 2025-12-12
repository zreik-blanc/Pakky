import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Terminal, ArrowRight, Star, Zap, ScrollText } from 'lucide-react';
import type { Preset } from '@/lib/types';

interface HeroPresetProps {
    preset: Preset;
    packagePreview: string[];
    onLoad: () => void;
    onHover: () => void;
    onLeave: () => void;
}

export function HeroPreset({ preset, packagePreview, onLoad, onHover, onLeave }: HeroPresetProps) {
    const formulaeCount = (preset.packages?.formulae || preset.macos?.homebrew?.formulae || []).length;
    const casksCount = (preset.packages?.casks || preset.macos?.homebrew?.casks || []).length;
    const scriptsCount = (preset.scripts || []).length;
    const totalPackages = formulaeCount + casksCount + scriptsCount;

    return (
        <div
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card/80 to-card/60 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:from-primary/15 transition-all duration-500" />

            <div className="relative flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-0">
                            <Star className="w-3 h-3" />
                            Featured
                        </Badge>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-2">{preset.name}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {preset.description}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-border/50">
                            <Terminal className="w-3 h-3 mr-1" />
                            {formulaeCount} CLI tools
                        </Badge>
                        <Badge variant="outline" className="border-border/50">
                            <Package className="w-3 h-3 mr-1" />
                            {casksCount} Apps
                        </Badge>
                        {scriptsCount > 0 && (
                            <Badge variant="outline" className="border-border/50">
                                <ScrollText className="w-3 h-3 mr-1" />
                                {scriptsCount} Scripts
                            </Badge>
                        )}
                    </div>

                    {/* Package preview */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                        {packagePreview.map((pkg) => (
                            <span
                                key={pkg}
                                className="px-2 py-0.5 bg-muted/50 rounded text-xs text-muted-foreground font-mono"
                            >
                                {pkg}
                            </span>
                        ))}
                        {totalPackages > 6 && (
                            <span className="px-2 py-0.5 text-xs text-muted-foreground">
                                +{totalPackages - 6} more
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex md:flex-col items-center justify-center gap-4 md:pl-6 md:border-l border-border/30">
                    <motion.div
                        className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center ring-1 ring-primary/20"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Zap className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={onLoad}
                            className="gap-2 group/btn shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            Load Preset
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
