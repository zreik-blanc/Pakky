import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '../ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileJson, Download } from 'lucide-react';
import { JsonPreview } from '@/components/ui/json-preview';
import type { PakkyConfig } from '@/lib/types';

interface ExportPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: PakkyConfig;
    onConfirm: (config: PakkyConfig) => void;
    userName?: string;
}

export function ExportPreviewDialog({
    open,
    onOpenChange,
    config,
    onConfirm,
    userName
}: ExportPreviewDialogProps) {
    const [currentConfig, setCurrentConfig] = useState<PakkyConfig>({
        ...config,
        author: userName
    });

    // Reset config when modal opens or config prop changes
    useEffect(() => {
        if (open) {
            setCurrentConfig({
                ...config,
                author: userName
            });
        }
    }, [open, config, userName]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentConfig(prev => ({
            ...prev,
            name: e.target.value
        }));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCurrentConfig(prev => ({
            ...prev,
            description: e.target.value
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-primary" />
                        Export Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Review and annotate your configuration before exporting.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Configuration Name</Label>
                            <Input
                                id="name"
                                value={currentConfig.name}
                                onChange={handleNameChange}
                                placeholder="my-awesome-config"
                            />
                            {userName && (
                                <p className="text-[10px] text-muted-foreground">
                                    Author: <span className="font-medium text-foreground">{userName}</span>
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Add defaults notes about this configuration..."
                                value={currentConfig.description || ''}
                                onChange={handleDescriptionChange}
                                className="resize-none h-24"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Preview</Label>
                            <div className="relative rounded-md border border-border bg-muted/30">
                                <ScrollArea className="h-[200px] w-full rounded-md">
                                    <JsonPreview
                                        data={currentConfig}
                                        className="p-4"
                                    />
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 shrink-0 bg-background/80 backdrop-blur-sm z-50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={() => onConfirm(currentConfig)} className="gap-2">
                        <Download className="w-4 h-4" />
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
