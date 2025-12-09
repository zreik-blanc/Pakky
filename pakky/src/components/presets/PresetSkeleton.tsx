export function PresetSkeleton() {
    return (
        <div className="bg-card/30 border border-border/30 rounded-xl p-4 animate-pulse">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-muted/50 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted/50 rounded w-2/3" />
                    <div className="h-4 bg-muted/30 rounded w-full" />
                    <div className="h-4 bg-muted/30 rounded w-4/5" />
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                <div className="h-5 bg-muted/30 rounded-full w-20" />
                <div className="h-5 bg-muted/30 rounded-full w-16" />
            </div>
            <div className="h-9 bg-muted/30 rounded-lg mt-4" />
        </div>
    );
}
