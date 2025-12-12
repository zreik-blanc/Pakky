import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Home, Sparkles, Settings, Upload, CheckCircle2, AlertCircle, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { InstallProgress } from '@/lib/types';
import {
    slideInFromLeft,
    slideInFromBottom,
    scaleIn,
    pingTransition,
    quickTween,
    StaggerText,
} from '@/lib/animations';

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

const SIDEBAR_COLLAPSED_KEY = 'pakky-sidebar-collapsed';

export default function AppLayout({
    children,
    currentPage,
    onNavigate,
    onImportConfig,
    systemInfo,
    progress
}: AppLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    }, [isCollapsed]);

    const navItems = [
        { id: 'home' as Page, label: 'Home', icon: Home },
        { id: 'presets' as Page, label: 'Presets', icon: Sparkles },
        { id: 'settings' as Page, label: 'Settings', icon: Settings },
    ];

    const pageTitle = navItems.find(item => item.id === currentPage)?.label || 'Home';

    return (
        <div className="h-screen flex bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                className="bg-card/40 backdrop-blur-md flex flex-col relative group z-50"
                animate={{ width: isCollapsed ? 64 : 240 }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
                {/* Border element - starts below traffic lights with fade-in */}
                <div
                    className="absolute top-10 right-0 bottom-0 w-px"
                    style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--border) / 0.5) 20px)' }}
                />

                {/* Spacer for macOS traffic lights - no border here */}
                <div
                    className="h-7 shrink-0"
                    style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
                />

                {/* Logo area */}
                <div
                    className="h-14 flex items-center gap-3 px-4 border-b border-border/30"
                    style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
                >
                    <motion.div
                        layoutId="pakky-logo"
                        className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center ring-1 ring-primary/20 shrink-0"
                        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                        transition={{
                            layout: {
                                type: 'tween',
                                ease: [0.32, 0.72, 0, 1],
                                duration: 0.8
                            }
                        }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <Package className="w-5 h-5" />
                    </motion.div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.div
                                variants={slideInFromLeft}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="pb-0.5"
                                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                            >
                                <h1 className="text-base font-bold tracking-tight leading-tight">
                                    <StaggerText isVisible={!isCollapsed}>Pakky</StaggerText>
                                </h1>
                                <p className="text-[9px] text-muted-foreground/70 font-mono uppercase tracking-wider">
                                    {systemInfo?.platform === 'macos' ? 'macOS' : systemInfo?.platform} • {systemInfo?.arch}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-2 space-y-1 mt-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        return (
                            <Button
                                key={item.id}
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full transition-colors duration-200",
                                    isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-3",
                                    isActive && "font-semibold shadow-sm bg-secondary/80",
                                    !isActive && "hover:bg-accent/50"
                                )}
                                onClick={() => onNavigate(item.id)}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon className={cn(
                                    "w-4 h-4 shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )} />
                                <StaggerText isVisible={!isCollapsed}>
                                    {item.label}
                                </StaggerText>
                            </Button>
                        );
                    })}
                </nav>

                {/* Import Config Button */}
                <div className="p-2 border-t border-border/30">
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full transition-colors duration-200 border-border/50 hover:bg-accent/50",
                            isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-3"
                        )}
                        onClick={onImportConfig}
                        title={isCollapsed ? "Import Config" : undefined}
                    >
                        <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                        <StaggerText isVisible={!isCollapsed}>
                            Import Config
                        </StaggerText>
                    </Button>
                </div>

                {/* Quick Stats */}
                <AnimatePresence>
                    {progress.totalPackages > 0 && (
                        <motion.div
                            variants={slideInFromBottom}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className={cn(
                                "p-2 border-t border-border/30",
                                isCollapsed && "flex flex-col items-center gap-2"
                            )}
                        >
                            {!isCollapsed && (
                                <div className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-widest px-1 mb-2">
                                    Status
                                </div>
                            )}
                            <div className={cn(
                                "gap-2",
                                isCollapsed ? "flex flex-col" : "grid grid-cols-2"
                            )}>
                                <motion.div
                                    className={cn(
                                        "bg-green-500/10 border border-green-500/20 rounded-lg text-center",
                                        isCollapsed ? "p-2" : "p-2.5"
                                    )}
                                    whileHover={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}
                                    transition={quickTween}
                                >
                                    <div className={cn(
                                        "font-bold text-green-500 flex items-center justify-center gap-1",
                                        isCollapsed ? "text-sm" : "text-base"
                                    )}>
                                        <CheckCircle2 className={cn(isCollapsed ? "w-3 h-3" : "w-3.5 h-3.5")} />
                                        {progress.completedPackages}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="text-[9px] text-green-600 font-medium">Done</div>
                                    )}
                                </motion.div>
                                <motion.div
                                    className={cn(
                                        "bg-red-500/10 border border-red-500/20 rounded-lg text-center",
                                        isCollapsed ? "p-2" : "p-2.5"
                                    )}
                                    whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                                    transition={quickTween}
                                >
                                    <div className={cn(
                                        "font-bold text-red-500 flex items-center justify-center gap-1",
                                        isCollapsed ? "text-sm" : "text-base"
                                    )}>
                                        <AlertCircle className={cn(isCollapsed ? "w-3 h-3" : "w-3.5 h-3.5")} />
                                        {progress.failedPackages}
                                    </div>
                                    {!isCollapsed && (
                                        <div className="text-[9px] text-red-600 font-medium">Failed</div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Collapse Toggle */}
                <div className="p-2 border-t border-border/30">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "w-full transition-colors duration-200 text-muted-foreground hover:text-foreground",
                            isCollapsed ? "justify-center px-0" : "justify-start gap-3 px-3"
                        )}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? (
                            <PanelLeft className="w-4 h-4 shrink-0" />
                        ) : (
                            <>
                                <PanelLeftClose className="w-4 h-4 shrink-0" />
                                <motion.span
                                    className="text-xs"
                                    variants={slideInFromLeft}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    Collapse
                                </motion.span>
                            </>
                        )}
                    </Button>
                </div>
            </motion.aside>

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Minimal Header */}
                <header
                    className="h-12 bg-card/30 backdrop-blur-sm border-b border-border/30 px-6 flex items-center justify-between shrink-0"
                    style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
                >
                    <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                        <h2 className="text-sm font-semibold text-foreground/90">{pageTitle}</h2>
                    </div>

                    {/* Status indicator */}
                    <AnimatePresence>
                        {progress.status === 'installing' && (
                            <motion.div
                                variants={scaleIn}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20"
                                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                            >
                                <div className="relative flex h-1.5 w-1.5">
                                    <motion.span
                                        className="absolute inline-flex h-full w-full rounded-full bg-primary"
                                        animate={{ scale: [1, 2], opacity: [0.75, 0] }}
                                        transition={pingTransition}
                                    />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                                </div>
                                <span className="text-xs font-medium text-primary">
                                    Installing {progress.completedPackages}/{progress.totalPackages}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                {/* Main Content */}
                <main className="flex-1 bg-background relative overflow-hidden">
                    <div className="h-full">
                        <div className="p-6 h-full">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
