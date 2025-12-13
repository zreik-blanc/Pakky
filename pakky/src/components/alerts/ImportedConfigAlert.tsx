import { FileWarning, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ImportedConfigAlertProps {
    packageCount: number;
    onConfirm: () => void;
    onReject: () => void;
    onReviewConfig: () => void;
}

export function ImportedConfigAlert({
    packageCount,
    onConfirm,
    onReject,
    onReviewConfig
}: ImportedConfigAlertProps) {
    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-orange-500/30 shadow-lg">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-500/10">
                            <FileWarning className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <CardTitle className="text-orange-500">
                                Imported Configuration
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Installing {packageCount} package{packageCount !== 1 ? 's' : ''} from an external config
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        You're about to install packages from an imported configuration file.
                        If you don't recognize the source of this config, we recommend reviewing
                        the packages before proceeding.
                    </p>

                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">
                            <strong className="text-foreground">Tip:</strong> You can click on each package
                            in the queue to see its details, or export the config to review any
                            post-install scripts before running the installation.
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onReject}
                    >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onReviewConfig}
                    >
                        Review Config
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={onConfirm}
                    >
                        <Play className="w-4 h-4 mr-1" />
                        Install Anyway
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
