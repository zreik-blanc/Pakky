import { useEffect, useState } from 'react';
import { PackageInstallItem, Preset } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Sparkles, BarChart3, Code2, Terminal } from 'lucide-react';
import { presetsAPI } from '@/lib/electron';

interface PresetsPageProps {
    onLoadPreset: (packages: PackageInstallItem[]) => void;
}

// Map icons based on preset ID or keywords
const getIconForPreset = (id: string) => {
    if (id.includes('web')) return Sparkles;
    if (id.includes('data')) return BarChart3;
    if (id.includes('minimal')) return Package;
    if (id.includes('dev')) return Code2;
    return Terminal;
};

export default function PresetsPage({ onLoadPreset }: PresetsPageProps) {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [loading, setLoading] = useState(true);

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

        // Extract formulae and casks from either location (root packages or macos.homebrew)
        // detailed JSONs use macos.homebrew, simpler ones might use packages
        const formulae = preset.packages?.formulae || preset.macos?.homebrew?.formulae || [];
        const casks = preset.packages?.casks || preset.macos?.homebrew?.casks || [];

        // Add formulae
        for (const item of formulae) {
            // item can be string or object
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

        // Add casks
        for (const item of casks) {
            // item can be string or object
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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading presets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Presets</h2>
                <p className="text-muted-foreground">Pre-made configurations to get you started quickly</p>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {presets.map((preset) => {
                    const Icon = getIconForPreset(preset.id);
                    const formulaeCount = (preset.packages?.formulae || preset.macos?.homebrew?.formulae || []).length;
                    const casksCount = (preset.packages?.casks || preset.macos?.homebrew?.casks || []).length;

                    return (
                        <Card key={preset.id} className="bg-card/50 hover:bg-card/80 transition-colors border-border/50 hover:border-border">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{preset.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1.5 h-10">{preset.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="flex gap-2">
                                    <Badge variant="secondary">{formulaeCount} CLI tools</Badge>
                                    <Badge variant="secondary">{casksCount} Apps</Badge>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4">
                                <Button
                                    onClick={() => handleLoadPreset(preset)}
                                    className="w-full"
                                    variant="outline"
                                >
                                    Load Preset
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

