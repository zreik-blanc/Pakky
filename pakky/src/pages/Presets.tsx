import { useEffect, useState } from 'react';
import { PackageInstallItem, Preset } from '@/lib/types';
import { Package, Layers } from 'lucide-react';
import { presetsAPI } from '@/lib/electron';
import { PresetSkeleton, HeroPreset, PresetCard, getPresetConfig } from '@/components/presets';

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
        const packages: PackageInstallItem[] = [];

        const formulae = preset.packages?.formulae || preset.macos?.homebrew?.formulae || [];
        const casks = preset.packages?.casks || preset.macos?.homebrew?.casks || [];

        for (const item of formulae) {
            const name = typeof item === 'string' ? item : item.name;
            packages.push({
                id: `formula:${name}`,
                name,
                type: 'formula',
                status: 'pending',
                description: 'CLI tool',
                logs: [],
            });
        }

        for (const item of casks) {
            const name = typeof item === 'string' ? item : item.name;
            packages.push({
                id: `cask:${name}`,
                name,
                type: 'cask',
                status: 'pending',
                description: 'Application',
                logs: [],
            });
        }

        onLoadPreset(packages);
    };

    const getPackagePreview = (preset: Preset) => {
        const formulae = preset.packages?.formulae || preset.macos?.homebrew?.formulae || [];
        const casks = preset.packages?.casks || preset.macos?.homebrew?.casks || [];
        const all = [...formulae, ...casks].slice(0, 6);
        return all.map(item => typeof item === 'string' ? item : item.name);
    };

    // Hero preset is the first one
    const heroPreset = presets[0];
    const otherPresets = presets.slice(1);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto overflow-x-hidden pb-8">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Layers className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Presets</h2>
                </div>
                <p className="text-muted-foreground">
                    Pre-made configurations to get you started quickly. Choose one to load it into your queue.
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
                                More Presets
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                {otherPresets.map((preset, index) => (
                                    <PresetCard
                                        key={preset.id}
                                        preset={preset}
                                        config={getPresetConfig(preset.id, index + 1)}
                                        isHovered={hoveredPreset === preset.id}
                                        packagePreview={getPackagePreview(preset)}
                                        onLoad={() => handleLoadPreset(preset)}
                                        onHover={() => setHoveredPreset(preset.id)}
                                        onLeave={() => setHoveredPreset(null)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state if no presets */}
                    {presets.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No presets available</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
