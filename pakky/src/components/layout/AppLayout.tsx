import { Package, Home, Sparkles, Settings, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InstallProgress } from '@/lib/types';

type Page = 'home' | 'presets' | 'settings';

interface AppLayoutProps {
    children: React.ReactNode;
    currentPage: Page;
    onNavigate: (page: Page) => void;
    onImportConfig: () => void;
    systemInfo: {
        platform: string;
        arch: string;
    } | null;
    progress: InstallProgress;
}

export default function AppLayout({
    children,
    currentPage,
    onNavigate,
    onImportConfig,
    systemInfo,
    progress
}: AppLayoutProps) {

    const navItems = [
        { id: 'home' as Page, label: 'Home', icon: Home },
        { id: 'presets' as Page, label: 'Presets', icon: Sparkles },
        { id: 'settings' as Page, label: 'Settings', icon: Settings },
    ];

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
            {/* Header - with top padding for macOS traffic lights */}
            <header
                className="bg-card/50 backdrop-blur-sm border-b px-6 pt-9 pb-3 flex items-center justify-between z-50 transition-all duration-300"
                style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
            >
                <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center ring-1 ring-primary/20">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Pakky</h1>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                            {systemInfo?.platform === 'macos' ? 'macOS' : systemInfo?.platform} • {systemInfo?.arch}
                        </p>
                    </div>
                </div>

                {/* Status indicator */}
                {progress.status === 'installing' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </div>
                        <span className="text-xs font-medium text-primary">
                            Installing... {progress.completedPackages}/{progress.totalPackages}
                        </span>
                    </div>
                )}
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="w-64 bg-card/30 border-r flex flex-col p-4">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;
                            return (
                                <Button
                                    key={item.id}
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start gap-3",
                                        isActive && "font-semibold shadow-sm bg-secondary/80"
                                    )}
                                    onClick={() => onNavigate(item.id)}
                                >
                                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                    {item.label}
                                </Button>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-6 border-t space-y-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3"
                            onClick={onImportConfig}
                        >
                            <Upload className="w-4 h-4 text-muted-foreground" />
                            Import Config
                        </Button>
                    </div>

                    {/* Quick Stats */}
                    {progress.totalPackages > 0 && (
                        <div className="mt-auto pt-6 space-y-2 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest pl-1">
                                Installation Status
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center transition-all hover:bg-green-500/15">
                                    <div className="text-lg font-bold text-green-500 flex items-center justify-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {progress.completedPackages}
                                    </div>
                                    <div className="text-[10px] text-green-600 font-medium">Completed</div>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center transition-all hover:bg-red-500/15">
                                    <div className="text-lg font-bold text-red-500 flex items-center justify-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {progress.failedPackages}
                                    </div>
                                    <div className="text-[10px] text-red-600 font-medium">Failed</div>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-background relative flex flex-col overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-8">
                            {children}
                        </div>
                    </ScrollArea>
                </main>
            </div>
        </div>
    );
}
