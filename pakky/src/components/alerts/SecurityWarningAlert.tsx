import { motion } from 'motion/react';
import { AlertTriangle, ShieldAlert, ShieldX, X, Skull } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { SecurityScanResult } from '@/lib/electron';

interface SecurityWarningAlertProps {
    security: SecurityScanResult;
    onConfirm: () => void;
    onReject: () => void;
}

const severityConfig = {
    none: {
        icon: AlertTriangle,
        color: 'text-muted-foreground',
        bg: 'bg-muted/50',
        border: 'border-muted',
        title: 'Review Configuration',
    },
    low: {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        title: 'Caution Required',
    },
    medium: {
        icon: AlertTriangle,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        title: 'Caution Required',
    },
    high: {
        icon: ShieldAlert,
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        border: 'border-destructive/20',
        title: 'Security Warning',
    },
    critical: {
        icon: Skull,
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        border: 'border-destructive/30',
        title: 'CRITICAL: Likely Malicious',
    },
};

export function SecurityWarningAlert({ security, onConfirm, onReject }: SecurityWarningAlertProps) {
    const config = severityConfig[security.severity];
    const IconComponent = config.icon;
    const isCritical = security.severity === 'critical';
    const isHighOrCritical = security.severity === 'high' || security.severity === 'critical';

    return (
        <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                <Card className={`w-full max-w-lg shadow-lg ${config.border}`}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg}`}
                                animate={isHighOrCritical ? { scale: [1, 1.05, 1] } : undefined}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <IconComponent className={`w-6 h-6 ${config.color}`} />
                            </motion.div>
                            <div>
                                <CardTitle className={config.color}>
                                    {config.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {isCritical
                                        ? 'This configuration shows signs of intentional obfuscation'
                                        : isHighOrCritical
                                            ? 'This configuration contains potentially dangerous commands'
                                            : 'This configuration contains commands that may modify your system'
                                    }
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Severity badge */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Threat Level:</span>
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                                {security.severity}
                            </span>
                        </div>

                        {/* Obfuscation warning - most important */}
                        {security.hasObfuscation && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <ShieldX className="w-4 h-4 text-destructive" />
                                    <p className="text-sm font-medium text-destructive">
                                        Obfuscation Detected!
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Commands in this config appear to be intentionally obscured using techniques
                                    commonly used by malware to bypass security filters. This is a strong indicator
                                    of malicious intent.
                                </p>
                                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1 max-h-24 overflow-y-auto">
                                    {security.obfuscatedCommands.map((cmd, i) => (
                                        <code key={i} className="block text-xs font-mono text-destructive/80 truncate">
                                            {cmd}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dangerous commands */}
                        {security.dangerousCommands.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-destructive">
                                    Dangerous commands ({security.dangerousCommands.length}):
                                </p>
                                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto scrollbar-hide">
                                    {security.dangerousCommands.map((cmd, i) => (
                                        <code key={i} className="block text-xs font-mono text-destructive/80" title={cmd}>
                                            {cmd}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suspicious commands - only show if no dangerous/obfuscated */}
                        {security.suspiciousCommands.length > 0 && !isHighOrCritical && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-orange-500">
                                    Commands that will run ({security.suspiciousCommands.length}):
                                </p>
                                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                                    {security.suspiciousCommands.map((cmd, i) => (
                                        <code key={i} className="block text-xs font-mono text-orange-500/80" title={cmd}>
                                            {cmd}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Blocked commands by security level */}
                        {security.blockedCommands && security.blockedCommands.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-amber-500">
                                    Blocked by {security.securityLevel} mode ({security.blockedCommands.length}):
                                </p>
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                                    {security.blockedCommands.map((cmd, i) => (
                                        <code key={i} className="block text-xs font-mono text-amber-500/80" title={cmd}>
                                            {cmd}
                                        </code>
                                    ))}
                                </div>
                                {security.recommendations && security.recommendations.length > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        💡 {security.recommendations[0]}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* General warnings */}
                        <div className="text-xs text-muted-foreground space-y-1">
                            {isCritical && (
                                <p className="text-destructive font-medium">
                                    We STRONGLY recommend NOT importing this configuration.
                                </p>
                            )}
                            <p>
                                Only import configurations from sources you trust. Shell commands can execute
                                any code on your system with your user permissions.
                            </p>
                        </div>
                    </CardContent>

                    <CardFooter className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onReject}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            variant={isHighOrCritical ? 'destructive' : 'default'}
                            className="flex-1"
                            onClick={onConfirm}
                        >
                            {isCritical ? 'Import Anyway (Risky!)' : isHighOrCritical ? 'Import Anyway' : 'Continue'}
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </motion.div>
    );
}
