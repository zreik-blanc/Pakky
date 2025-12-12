import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, ClipboardPaste, FileJson, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { scaleIn, slideInFromBottom } from '@/lib/animations';

type ImportMethod = 'choice' | 'paste';

interface ImportConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImportFromFile: () => void;
    onImportFromContent: (content: string) => Promise<void>;
}

export function ImportConfigDialog({
    open,
    onOpenChange,
    onImportFromFile,
    onImportFromContent,
}: ImportConfigDialogProps) {
    const [method, setMethod] = useState<ImportMethod>('choice');
    const [pastedContent, setPastedContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after animation
        setTimeout(() => {
            setMethod('choice');
            setPastedContent('');
            setError(null);
        }, 200);
    };

    const handleFileUpload = () => {
        handleClose();
        onImportFromFile();
    };

    const handlePasteSubmit = async () => {
        if (!pastedContent.trim()) {
            setError('Please paste your configuration content');
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            await onImportFromContent(pastedContent);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse configuration');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBack = () => {
        setMethod('choice');
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <AnimatePresence mode="wait">
                    {method === 'choice' ? (
                        <motion.div
                            key="choice"
                            variants={scaleIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <FileJson className="w-5 h-5 text-primary" />
                                    Import Configuration
                                </DialogTitle>
                                <DialogDescription>
                                    Choose how you'd like to import your Pakky configuration.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-3 py-6">
                                <motion.button
                                    type="button"
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border border-border/50",
                                        "bg-card/50 hover:bg-accent/50 transition-colors text-left",
                                        "group"
                                    )}
                                    onClick={handleFileUpload}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                        <Upload className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-foreground">Upload File</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Select a .json or .pakky file from your computer
                                        </p>
                                    </div>
                                </motion.button>

                                <motion.button
                                    type="button"
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-lg border border-border/50",
                                        "bg-card/50 hover:bg-accent/50 transition-colors text-left",
                                        "group"
                                    )}
                                    onClick={() => setMethod('paste')}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                                        <ClipboardPaste className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-foreground">Paste Config</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Paste configuration JSON directly from clipboard
                                        </p>
                                    </div>
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="paste"
                            variants={slideInFromBottom}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 -ml-2"
                                        onClick={handleBack}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </Button>
                                    <ClipboardPaste className="w-5 h-5 text-emerald-500" />
                                    Paste Configuration
                                </DialogTitle>
                                <DialogDescription>
                                    Paste your Pakky configuration JSON below.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-3">
                                <Textarea
                                    value={pastedContent}
                                    onChange={(e) => {
                                        setPastedContent(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder={`{
                                        "name": "My Setup",
                                        "formulae": ["git", "node"],
                                        "casks": ["visual-studio-code"]
                                    }`}
                                    className={cn(
                                        "min-h-[200px] font-mono text-sm resize-none",
                                        "bg-background/50 border-input/50 focus:bg-background",
                                        error && "border-red-500/50 focus:ring-red-500/20"
                                    )}
                                    disabled={isProcessing}
                                />

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            variants={scaleIn}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg"
                                        >
                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    disabled={isProcessing}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handlePasteSubmit}
                                    disabled={isProcessing || !pastedContent.trim()}
                                    className="gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <ClipboardPaste className="w-4 h-4" />
                                            Import Configuration
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
