import { Play, Square, Loader2, Download, PackageOpen, Sparkles, Search, Plus } from 'lucide-react';
import type { PackageInstallItem } from '@/lib/types';
import { PackageCard } from '@/components/packages/PackageCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
    onNavigateToPresets?: () => void;
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
    onExport,
    onNavigateToPresets
}: PackageQueueProps) {
    const pendingPackages = packages.filter(p => p.status !== 'already_installed');

    if (packages.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
                {/* Animated illustration */}
                <div className="relative mb-8">
                    {/* Floating background elements */}
                    <div className="absolute -top-4 -left-6 w-3 h-3 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s', animationDuration: '2s' }} />
                    <div className="absolute -top-2 -right-4 w-2 h-2 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '2.5s' }} />
                    <div className="absolute -bottom-3 -left-3 w-2.5 h-2.5 bg-emerald-500/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.2s' }} />
                    <div className="absolute -bottom-1 right-0 w-2 h-2 bg-emerald-500/20 rounded-full animate-bounce" style={{ animationDelay: '0.7s', animationDuration: '2.8s' }} />

                    {/* Main icon container */}
                    <div className="w-24 h-24 bg-gradient-to-br from-card to-muted rounded-2xl flex items-center justify-center border border-border/50 shadow-lg relative overflow-hidden group">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        <PackageOpen className="w-10 h-10 text-muted-foreground/60" />
                    </div>

                    {/* Plus icon floating */}
                    <div className="absolute -right-3 -top-3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 animate-pulse">
                        <Plus className="w-4 h-4 text-primary" />
                    </div>
                </div>

                <div className="space-y-2 mb-8 max-w-md">
                    <h3 className="text-xl font-semibold tracking-tight">Your queue is empty</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Search for packages using the search bar above, or start with a pre-made configuration.
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {onNavigateToPresets && (
                        <Button
                            variant="default"
                            className="gap-2 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                            onClick={onNavigateToPresets}
                        >
                            <Sparkles className="w-4 h-4" />
                            Browse Presets
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        className="gap-2 hover:bg-accent/50 transition-all duration-200"
                        onClick={() => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()}
                    >
                        <Search className="w-4 h-4" />
                        Search Packages
                    </Button>
                </div>

                {/* Tip */}
                <div className="mt-8 px-4 py-2.5 bg-muted/30 rounded-lg border border-border/30 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">Tip:</span> You can also import a config file using the sidebar
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
            {/* Queue header - Fixed, doesn't scroll */}
            <div className="flex items-center justify-between bg-background py-3 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">Queue</span>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium transition-colors",
                            pendingPackages.length > 0
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                        )}>
                            {pendingPackages.length} pending
                        </span>
                    </div>
                    {packages.length > pendingPackages.length && (
                        <span className="text-xs text-muted-foreground">
                            • {packages.length - pendingPackages.length} installed
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {!isInstalling && packages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onExport}
                            className="h-8 gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                    )}

                    {pendingPackages.length > 0 && (
                        <>
                            {isInstalling ? (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={onCancelInstall}
                                    className="h-8 shadow-sm gap-2 hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Square className="w-3 h-3 fill-current" />
                                    Cancel
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={onStartInstall}
                                    disabled={isStartingInstall}
                                    className="h-8 shadow-sm bg-primary hover:bg-primary/90 gap-2 hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isStartingInstall ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Play className="w-3 h-3 fill-current" />
                                    )}
                                    {isStartingInstall ? 'Checking...' : 'Install All'}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Package list with staggered animation - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-4">
                <div className="grid gap-2.5 pb-6">
                    {packages.map((pkg, index) => (
                        <div
                            key={pkg.id}
                            className="animate-in fade-in slide-in-from-right-2"
                            style={{ animationDelay: `${Math.min(index * 50, 300)}ms`, animationDuration: '300ms' }}
                        >
                            <PackageCard
                                pkg={pkg}
                                onRemove={onRemove}
                                onReinstall={onReinstall}
                                disabled={isInstalling}
                                logs={installLogs[pkg.id]}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
