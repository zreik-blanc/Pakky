import { PackageInstallItem } from "@/lib/types"
import { Package, Terminal, CheckCircle2, XCircle, Clock, Loader2, Check, AlertCircle, X, RotateCw, ChevronDown, ChevronUp, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InstallTerminal } from "@/components/install/InstallTerminal"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface PackageCardProps {
    pkg: PackageInstallItem
    onRemove: (id: string) => void
    onReinstall?: (id: string) => void
    disabled?: boolean
    logs?: string[]
}

export function PackageCard({ pkg, onRemove, onReinstall, disabled, logs = [] }: PackageCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const isInstalling = pkg.status === 'installing'
    const hasLogs = logs.length > 0
    const showActivity = isInstalling || hasLogs

    const getStatusConfig = (status: PackageInstallItem['status']) => {
        switch (status) {
            case 'success':
                return {
                    icon: <CheckCircle2 className="w-4 h-4" />,
                    color: 'text-green-500',
                    bg: 'bg-green-500/10',
                    ring: 'ring-green-500/20',
                    label: 'Installed'
                };
            case 'already_installed':
                return {
                    icon: <Check className="w-4 h-4" />,
                    color: 'text-muted-foreground',
                    bg: 'bg-muted/50',
                    ring: 'ring-border/50',
                    label: 'Already Installed'
                };
            case 'failed':
                return {
                    icon: <XCircle className="w-4 h-4" />,
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                    ring: 'ring-red-500/20',
                    label: 'Failed'
                };
            case 'installing':
                return {
                    icon: <Loader2 className="w-4 h-4 animate-spin" />,
                    color: 'text-primary',
                    bg: 'bg-primary/10',
                    ring: 'ring-primary/30',
                    label: 'Installing...'
                };
            case 'skipped':
                return {
                    icon: <AlertCircle className="w-4 h-4" />,
                    color: 'text-yellow-500',
                    bg: 'bg-yellow-500/10',
                    ring: 'ring-yellow-500/20',
                    label: 'Skipped'
                };
            default:
                return {
                    icon: <Clock className="w-4 h-4" />,
                    color: 'text-muted-foreground/60',
                    bg: 'bg-muted/30',
                    ring: 'ring-border/30',
                    label: 'Pending'
                };
        }
    };

    const statusConfig = getStatusConfig(pkg.status);
    const canReinstall = pkg.status === 'already_installed' && onReinstall

    return (
        <div className={cn(
            "group relative bg-card/80 backdrop-blur-sm border rounded-xl transition-all duration-300",
            isInstalling && "border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20",
            pkg.status === 'success' && "border-green-500/30",
            pkg.status === 'failed' && "border-red-500/30 animate-shake",
            pkg.status === 'pending' && "hover:border-primary/30 hover:shadow-sm",
            pkg.status === 'already_installed' && "opacity-75 hover:opacity-100"
        )}>
            <div className="p-3.5 flex items-center gap-3">
                {/* Package Icon */}
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ring-1",
                    statusConfig.bg,
                    statusConfig.ring,
                    isInstalling && "animate-pulse"
                )}>
                    {pkg.type === 'cask' ? (
                        <Package className={cn("w-5 h-5 transition-colors", statusConfig.color)} />
                    ) : pkg.type === 'script' ? (
                        <ScrollText className={cn("w-5 h-5 transition-colors", statusConfig.color)} />
                    ) : (
                        <Terminal className={cn("w-5 h-5 transition-colors",
                            pkg.status === 'success' ? "text-green-500" :
                                pkg.status === 'failed' ? "text-red-500" : "text-emerald-500"
                        )} />
                    )}
                </div>

                {/* Package Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-sm text-foreground truncate">{pkg.name}</h3>
                        <div className={cn("flex items-center gap-1", statusConfig.color)}>
                            {statusConfig.icon}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <Badge
                            variant="outline"
                            className={cn(
                                "h-4.5 px-1.5 text-[9px] uppercase font-mono tracking-wider border-border/50",
                                pkg.type === 'cask' ? "text-primary/80" : 
                                pkg.type === 'script' ? "text-amber-500/80" : "text-emerald-500/80"
                            )}
                        >
                            {pkg.type}
                        </Badge>

                        {pkg.action === 'reinstall' && (
                            <span className="text-amber-500 font-medium flex items-center gap-1">
                                <RotateCw className="w-3 h-3" />
                                Reinstall
                            </span>
                        )}

                        {pkg.error && (
                            <span className="text-red-400 truncate max-w-[200px]" title={pkg.error}>
                                {pkg.error}
                            </span>
                        )}

                        {!pkg.error && !pkg.action && pkg.description && !showActivity && (
                            <span className="text-muted-foreground truncate max-w-[250px]">
                                {pkg.description}
                            </span>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                    {/* Expand logs button */}
                    {hasLogs && !isInstalling && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-200"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </Button>
                    )}

                    {canReinstall && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all duration-200"
                            onClick={() => onReinstall && onReinstall(pkg.id)}
                            disabled={disabled || isInstalling}
                            title="Force Reinstall"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all duration-200"
                        onClick={() => onRemove(pkg.id)}
                        disabled={disabled || isInstalling}
                        title="Remove"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Installing Progress Bar / Logs */}
            {(showActivity || isExpanded) && (
                <div className={cn(
                    "px-3.5 pb-3.5 pt-0 animate-in fade-in slide-in-from-top-2 duration-200",
                    !isInstalling && !isExpanded && "hidden"
                )}>
                    {/* Progress bar when installing */}
                    {isInstalling && !hasLogs && (
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden mt-1 mb-2">
                            <div className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary w-full animate-indeterminate-progress" />
                        </div>
                    )}

                    {/* Terminal logs */}
                    {(hasLogs || isExpanded) && (
                        <InstallTerminal logs={logs} isInstalling={isInstalling} />
                    )}
                </div>
            )}
        </div>
    )
}
