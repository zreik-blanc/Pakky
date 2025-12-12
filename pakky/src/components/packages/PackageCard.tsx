import { motion, AnimatePresence } from 'motion/react';
import { PackageInstallItem } from "@/lib/types"
import { Package, Terminal, CheckCircle2, XCircle, Clock, Loader2, Check, AlertCircle, X, RotateCw, ChevronDown, ChevronUp, ScrollText, Beer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InstallTerminal } from "@/components/install/InstallTerminal"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
    spinnerTransition,
    pulseTransition,
    shakeAnimation,
    shakeTransition,
    indeterminateProgress,
    indeterminateProgressTransition,
    collapseExpand,
} from '@/lib/animations'

/**
 * Status configuration map for package installation states
 * Replaces switch statement with declarative config
 */
const STATUS_CONFIG = {
    success: {
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        ring: 'ring-green-500/20',
        label: 'Installed'
    },
    already_installed: {
        icon: <Check className="w-4 h-4" />,
        color: 'text-muted-foreground',
        bg: 'bg-muted/50',
        ring: 'ring-border/50',
        label: 'Already Installed'
    },
    failed: {
        icon: <XCircle className="w-4 h-4" />,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        ring: 'ring-red-500/20',
        label: 'Failed'
    },
    installing: {
        icon: null, // Spinner handled separately
        color: 'text-primary',
        bg: 'bg-primary/10',
        ring: 'ring-primary/30',
        label: 'Installing...'
    },
    checking: {
        icon: null, // Spinner handled separately
        color: 'text-muted-foreground',
        bg: 'bg-muted/30',
        ring: 'ring-border/30',
        label: 'Checking...'
    },
    skipped: {
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        ring: 'ring-yellow-500/20',
        label: 'Skipped'
    },
    pending: {
        icon: <Clock className="w-4 h-4" />,
        color: 'text-muted-foreground/60',
        bg: 'bg-muted/30',
        ring: 'ring-border/30',
        label: 'Pending'
    },
} as const

/** Get status config with fallback to pending state */
const getStatusConfig = (status: PackageInstallItem['status']) =>
    STATUS_CONFIG[status] ?? STATUS_CONFIG.pending

/** Spinner icon component for installing/checking states */
const SpinnerIcon = () => (
    <motion.div
        animate={{ rotate: 360 }}
        transition={spinnerTransition}
    >
        <Loader2 className="w-4 h-4" />
    </motion.div>
)

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
    const isChecking = pkg.status === 'checking'
    const hasLogs = logs.length > 0
    const showActivity = isInstalling || hasLogs

    const statusConfig = getStatusConfig(pkg.status);
    const canReinstall = pkg.status === 'already_installed' && onReinstall

    // Get the appropriate status icon
    const getStatusIcon = () => {
        if (isInstalling || isChecking) {
            return <SpinnerIcon />
        }
        return statusConfig.icon
    }

    return (
        <motion.div
            className={cn(
                "group relative bg-card/80 backdrop-blur-sm border rounded-xl transition-all duration-200 ease-out",
                isInstalling && "border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20",
                pkg.status === 'success' && "border-green-500/30",
                pkg.status === 'failed' && "border-red-500/30",
                pkg.status === 'pending' && "hover:border-primary/30 hover:shadow-sm hover:bg-card",
                pkg.status === 'already_installed' && "opacity-75 hover:opacity-100"
            )}
            animate={pkg.status === 'failed' ? shakeAnimation : undefined}
            transition={pkg.status === 'failed' ? shakeTransition : { duration: 0.2 }}
        >
            <div className="p-3.5 flex items-center gap-3">
                {/* Position Number */}
                {pkg.position && (
                    <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center shrink-0 text-xs font-medium text-muted-foreground">
                        {pkg.position}
                    </div>
                )}

                {/* Package Icon */}
                <motion.div
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1",
                        statusConfig.bg,
                        statusConfig.ring,
                    )}
                    animate={isInstalling ? { opacity: [0.6, 1, 0.6], scale: [0.98, 1, 0.98] } : undefined}
                    transition={isInstalling ? pulseTransition : undefined}
                >
                    {pkg.type === 'cask' ? (
                        <Package className={cn("w-5 h-5", statusConfig.color)} />
                    ) : pkg.type === 'script' ? (
                        <ScrollText className={cn("w-5 h-5", statusConfig.color)} />
                    ) : (
                        <Terminal className={cn("w-5 h-5",
                            pkg.status === 'success' ? "text-green-500" :
                                pkg.status === 'failed' ? "text-red-500" : "text-emerald-500"
                        )} />
                    )}
                </motion.div>

                {/* Package Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-sm text-foreground truncate">{pkg.name}</h3>
                        <div className={cn("flex items-center gap-1", statusConfig.color)}>
                            {getStatusIcon()}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <Badge
                            variant="outline"
                            className={cn(
                                "h-4.5 px-1.5 text-[9px] uppercase font-mono tracking-wider border-border/50 gap-1",
                                pkg.type === 'cask' ? "text-primary/80" :
                                    pkg.type === 'script' ? "text-amber-500/80" : "text-emerald-500/80"
                            )}
                        >
                            {(pkg.type === 'formula' || pkg.type === 'cask') && (
                                <Beer className="w-3 h-3 text-amber-500" />
                            )}
                            {(pkg.type === 'script') && (
                                <ScrollText className="w-3 h-3 text-amber-500" />
                            )}
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
                        <motion.div
                            initial={{ opacity: 0.5 }}
                            whileHover={{ opacity: 1 }}
                            className="opacity-0 group-hover:opacity-100"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground transition-colors duration-200"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </Button>
                        </motion.div>
                    )}

                    {canReinstall && (
                        <motion.div
                            initial={{ opacity: 0.5 }}
                            whileHover={{ opacity: 1 }}
                            className="opacity-0 group-hover:opacity-100"
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary transition-colors duration-200"
                                onClick={() => onReinstall && onReinstall(pkg.id)}
                                disabled={disabled || isInstalling}
                                title="Force Reinstall"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                            </Button>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0.5 }}
                        whileHover={{ opacity: 1, scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="opacity-0 group-hover:opacity-100"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors duration-200"
                            onClick={() => onRemove(pkg.id)}
                            disabled={disabled || isInstalling}
                            title="Remove"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Installing Progress Bar / Logs */}
            <AnimatePresence>
                {(showActivity || isExpanded) && (isInstalling || isExpanded) && (
                    <motion.div
                        className="px-3.5 pb-3.5 pt-0"
                        variants={collapseExpand}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Progress bar when installing */}
                        {isInstalling && !hasLogs && (
                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden mt-1 mb-2">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary w-full"
                                    animate={indeterminateProgress}
                                    transition={indeterminateProgressTransition}
                                />
                            </div>
                        )}

                        {/* Terminal logs */}
                        {(hasLogs || isExpanded) && (
                            <InstallTerminal logs={logs} isInstalling={isInstalling} />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
