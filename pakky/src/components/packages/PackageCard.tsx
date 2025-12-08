import { PackageInstallItem } from "@/lib/types"
import { Package, Terminal, CheckCircle2, XCircle, Clock, Loader2, Check, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InstallTerminal } from "@/components/install/InstallTerminal"
import { cn } from "@/lib/utils"

interface PackageCardProps {
    pkg: PackageInstallItem
    onRemove: (id: string) => void
    disabled?: boolean
    logs?: string[]
}

export function PackageCard({ pkg, onRemove, disabled, logs = [] }: PackageCardProps) {
    const isInstalling = pkg.status === 'installing'
    const hasLogs = logs.length > 0
    const showActivity = isInstalling || hasLogs

    const getStatusIcon = (status: PackageInstallItem['status']) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'already_installed':
                return <Check className="w-5 h-5 text-muted-foreground" />;
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'installing':
                return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
            case 'skipped':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            default:
                return <Clock className="w-5 h-5 text-muted-foreground/50" />;
        }
    };

    return (
        <div className={cn(
            "group relative bg-card border rounded-xl transition-all duration-200",
            isInstalling ? "border-primary/50 shadow-sm ring-1 ring-primary/20" : "hover:border-primary/30"
        )}>
            <div className="p-4 flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    pkg.status === 'success' ? "bg-green-500/10" :
                        pkg.status === 'failed' ? "bg-red-500/10" :
                            "bg-muted"
                )}>
                    {/* Icon Logic */}
                    {pkg.type === 'cask' ? (
                        <Package className={cn("w-5 h-5", pkg.status === 'success' ? "text-green-500" : "text-primary")} />
                    ) : (
                        <Terminal className={cn("w-5 h-5", pkg.status === 'success' ? "text-green-500" : "text-emerald-500")} />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm text-foreground">{pkg.name}</h3>
                        {getStatusIcon(pkg.status)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase font-mono tracking-wider">
                            {pkg.type}
                        </Badge>
                        {pkg.status === 'already_installed' && (
                            <span className="text-green-500/80 font-medium">Already Installed</span>
                        )}
                        {pkg.description && !hasLogs && !pkg.error && (
                            <span className="truncate max-w-[300px] border-l pl-2">{pkg.description}</span>
                        )}
                        {pkg.error && (
                            <span className="text-red-500 font-medium truncate">{pkg.error}</span>
                        )}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(pkg.id)}
                    disabled={disabled || isInstalling}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Installing Progress Bar / Logs */}
            {showActivity && (
                <div className="px-4 pb-4 pt-0">
                    {/* Simple progress bar if installing and no logs yet */}
                    {isInstalling && !hasLogs && (
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-primary animate-indeterminate-progress origin-left" />
                        </div>
                    )}

                    <InstallTerminal logs={logs} isInstalling={isInstalling} />
                </div>
            )}
        </div>
    )
}
