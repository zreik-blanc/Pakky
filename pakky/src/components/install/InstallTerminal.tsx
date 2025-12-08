import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface InstallTerminalProps {
    logs: string[]
    isInstalling?: boolean
    className?: string
}

export function InstallTerminal({ logs, isInstalling, className }: InstallTerminalProps) {
    if (logs.length === 0 && !isInstalling) return null

    return (
        <div className={cn("mt-3 bg-[#0c0c0c] border border-border/50 rounded-lg font-mono text-xs overflow-hidden", className)}>
            <ScrollArea className="h-32 px-3 py-2 w-full">
                <div className="space-y-1">
                    {logs.length === 0 && isInstalling && (
                        <div className="text-muted-foreground flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="animate-pulse">Starting installation...</span>
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div
                            key={i}
                            className={cn(
                                "break-all",
                                log.startsWith('✓') ? 'text-green-500' :
                                    log.startsWith('✗') ? 'text-red-500' :
                                        log.startsWith('$') ? 'text-blue-400 font-semibold' :
                                            'text-muted-foreground'
                            )}
                        >
                            {log}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
