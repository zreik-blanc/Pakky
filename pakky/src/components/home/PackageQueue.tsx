import { Play, Square, Loader2, Download, PackageOpen } from 'lucide-react';
import type { PackageInstallItem } from '@/lib/types';
import { PackageCard } from '@/components/packages/PackageCard';
import { Button } from '@/components/ui/button';

interface PackageQueueProps {
    packages: PackageInstallItem[];
    installLogs: Record<string, string[]>;
    isInstalling: boolean;
    isStartingInstall: boolean;
    onRemove: (id: string) => void;
    onReinstall: (id: string) => void;
    onStartInstall: () => void;
    onCancelInstall: () => void;
    onExport: () => void;
}

export function PackageQueue({
    packages,
    installLogs,
    isInstalling,
    isStartingInstall,
    onRemove,
    onReinstall,
    onStartInstall,
    onCancelInstall,
    onExport
}: PackageQueueProps) {
    const pendingPackages = packages.filter(p => p.status !== 'already_installed');

    if (packages.length === 0) {
        return (
            <div className="py-20 text-center space-y-4 border-2 border-dashed border-border/50 rounded-xl bg-card/20">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                    <PackageOpen className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Your queue is empty</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Search for packages above to add them to your installation queue.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">Queue</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {pendingPackages.length} pending
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {!isInstalling && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExport}
                            className="h-8 gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </Button>
                    )}

                    {pendingPackages.length > 0 && (
                        <>
                            {isInstalling ? (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={onCancelInstall}
                                    className="h-8 shadow-sm gap-2"
                                >
                                    <Square className="w-3.5 h-3.5 fill-current" />
                                    Cancel
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={onStartInstall}
                                    disabled={isStartingInstall}
                                    className="h-8 shadow-sm bg-primary hover:bg-primary/90 gap-2"
                                >
                                    {isStartingInstall ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                    )}
                                    {isStartingInstall ? 'Checking...' : 'Install All'}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-3">
                {packages.map((pkg) => (
                    <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        onRemove={onRemove}
                        onReinstall={onReinstall}
                        disabled={isInstalling}
                        logs={installLogs[pkg.id]}
                    />
                ))}
            </div>
        </div>
    );
}
