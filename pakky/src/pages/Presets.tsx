import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { PackageInstallItem, Preset } from '@/lib/types';
import { Package, Layers } from 'lucide-react';
import { presetsAPI } from '@/lib/electron';
import { PresetSkeleton, HeroPreset, PresetCard, getPresetConfig } from '@/components/presets';
import { parsePreset, getPackageNamesPreview } from '@/lib/configParser';
import { UI_STRINGS } from '@/lib/constants';
import { pageEnter, staggerContainer, cardItem } from '@/lib/animations';

interface PresetsPageProps {
    onLoadPreset: (packages: PackageInstallItem[]) => void;
}

export default function PresetsPage({ onLoadPreset }: PresetsPageProps) {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

    useEffect(() => {
        const loadPresets = async () => {
            try {
                const loadedPresets = await presetsAPI.getPresets();
                setPresets(loadedPresets);
            } catch (error) {
                console.error('Failed to load presets:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPresets();
    }, []);

    const handleLoadPreset = (preset: Preset) => {
        // Use centralized parser that handles rich schemas (descriptions, post_install, etc.)
        const packages = parsePreset(preset);
        onLoadPreset(packages);
    };

    const getPackagePreview = (preset: Preset) => {
        return getPackageNamesPreview(preset, 6);
    };

    // Hero preset is the first one
    const heroPreset = presets[0];
    const otherPresets = presets.slice(1);

    return (
        <motion.div
            className="max-w-4xl mx-auto space-y-8 h-full overflow-y-auto overflow-x-hidden pb-8"
            variants={pageEnter}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Layers className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{UI_STRINGS.PRESETS.TITLE}</h2>
                </div>
                <p className="text-muted-foreground">
                    {UI_STRINGS.PRESETS.DESCRIPTION}
                </p>
            </div>

            {loading ? (
                /* Skeleton Loading */
                <div className="space-y-6">
                    <PresetSkeleton />
                    <div className="grid gap-4 md:grid-cols-2">
                        <PresetSkeleton />
                        <PresetSkeleton />
                        <PresetSkeleton />
                    </div>
                </div>
            ) : (
                <>
                    {/* Hero Preset */}
                    {heroPreset && (
                        <HeroPreset
                            preset={heroPreset}
                            packagePreview={getPackagePreview(heroPreset)}
                            onLoad={() => handleLoadPreset(heroPreset)}
                            onHover={() => setHoveredPreset(heroPreset.id)}
                            onLeave={() => setHoveredPreset(null)}
                        />
                    )}

                    {/* Other Presets Grid */}
                    {otherPresets.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                {UI_STRINGS.PRESETS.MORE_PRESETS}
                            </h3>
                            <motion.div
                                className="grid gap-4 md:grid-cols-2"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {otherPresets.map((preset, index) => (
                                    <motion.div key={preset.id} variants={cardItem}>
                                        <PresetCard
                                            preset={preset}
                                            config={getPresetConfig(preset.id, index + 1)}
                                            isHovered={hoveredPreset === preset.id}
                                            packagePreview={getPackagePreview(preset)}
                                            onLoad={() => handleLoadPreset(preset)}
                                            onHover={() => setHoveredPreset(preset.id)}
                                            onLeave={() => setHoveredPreset(null)}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    )}

                    {/* Empty state if no presets */}
                    {presets.length === 0 && (
                        <motion.div
                            className="text-center py-12 text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>{UI_STRINGS.PRESETS.EMPTY_STATE}</p>
                        </motion.div>
                    )}
                </>
            )}
        </motion.div>
    );
}
