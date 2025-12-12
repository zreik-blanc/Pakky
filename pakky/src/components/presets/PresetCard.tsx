import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Preset } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';
import { slideInFromBottom, hoverScale, tapScale } from '@/lib/animations';

interface PresetCardProps {
    preset: Preset;
    config: {
        icon: LucideIcon;
        gradient: string;
        accent: string;
        ring: string;
    };
    isHovered: boolean;
    packagePreview: string[];
    onLoad: () => void;
    onHover: () => void;
    onLeave: () => void;
}

export function PresetCard({
    preset,
    config,
    isHovered,
    packagePreview,
    onLoad,
    onHover,
    onLeave
}: PresetCardProps) {
    const Icon = config.icon;
    const formulaeCount = (preset.packages?.formulae || preset.macos?.homebrew?.formulae || []).length;
    const casksCount = (preset.packages?.casks || preset.macos?.homebrew?.casks || []).length;
    const scriptsCount = (preset.scripts || []).length;

    return (
        <Card
            className={cn(
                "group relative overflow-hidden bg-card/50 border-border/50 transition-all duration-300",
                "hover:bg-card/80 hover:border-border hover:shadow-md",
                isHovered && "ring-1 ring-primary/20"
            )}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
        >
            {/* Gradient overlay */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                config.gradient
            )} />

            <CardHeader className="relative flex flex-row items-start gap-4 pb-3">
                <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ring-1",
                    "bg-muted/50 group-hover:bg-background/80",
                    config.ring
                )}>
                    <Icon className={cn("w-5 h-5 transition-colors", config.accent)} />
                </div>
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{preset.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1 text-xs leading-relaxed">
                        {preset.description}
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="relative pb-3">
                <div className="flex gap-2">
                    <Badge variant="secondary" className="text-[10px] bg-muted/50">
                        {formulaeCount} CLI
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] bg-muted/50">
                        {casksCount} Apps
                    </Badge>
                    {scriptsCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] bg-muted/50">
                            {scriptsCount} Scripts
                        </Badge>
                    )}
                </div>

                {/* Package preview on hover */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            className="mt-3 flex flex-wrap gap-1"
                            variants={slideInFromBottom}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {packagePreview.slice(0, 4).map((pkg) => (
                                <span
                                    key={pkg}
                                    className="px-1.5 py-0.5 bg-background/60 rounded text-[10px] text-muted-foreground font-mono"
                                >
                                    {pkg}
                                </span>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>

            <CardFooter className="relative pt-0">
                <motion.div
                    className="w-full"
                    whileHover={hoverScale}
                    whileTap={tapScale}
                >
                    <Button
                        onClick={onLoad}
                        className="w-full gap-2 transition-all duration-200"
                        variant="outline"
                        size="sm"
                    >
                        <span>Load</span>
                        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </Button>
                </motion.div>
            </CardFooter>
        </Card>
    );
}
