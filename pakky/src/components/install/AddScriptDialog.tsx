import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollText, Plus, AlertCircle } from 'lucide-react';
import type { PackageInstallItem } from '@/lib/types';

interface AddScriptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (script: PackageInstallItem) => void;
}

export function AddScriptDialog({ open, onOpenChange, onAdd }: AddScriptDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [commands, setCommands] = useState('');
    const [error, setError] = useState('');

    const resetForm = () => {
        setName('');
        setDescription('');
        setCommands('');
        setError('');
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            resetForm();
        }
        onOpenChange(isOpen);
    };

    const handleAdd = () => {
        // Validate
        if (!name.trim()) {
            setError('Script name is required');
            return;
        }

        const commandList = commands
            .split('\n')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);

        if (commandList.length === 0) {
            setError('At least one command is required');
            return;
        }

        const script: PackageInstallItem = {
            id: `script:${name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: name.trim(),
            type: 'script',
            status: 'pending',
            description: description.trim() || 'Custom script',
            commands: commandList,
            logs: [],
        };

        onAdd(script);
        handleClose(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-amber-500" />
                        Add Custom Script
                    </DialogTitle>
                    <DialogDescription>
                        Create a custom post-install script to run shell commands.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="script-name">Script Name</Label>
                        <Input
                            id="script-name"
                            placeholder="e.g., Configure SSH"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="script-description">Description (optional)</Label>
                        <Input
                            id="script-description"
                            placeholder="e.g., Set up SSH keys for GitHub"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="script-commands">
                            Commands
                            <span className="text-xs text-muted-foreground ml-2">
                                (one per line)
                            </span>
                        </Label>
                        <Textarea
                            id="script-commands"
                            placeholder={`echo "Hello World"\nmkdir -p ~/Projects\ngit config --global core.editor "code --wait"`}
                            value={commands}
                            onChange={(e) => {
                                setCommands(e.target.value);
                                setError('');
                            }}
                            rows={6}
                            className="font-mono text-sm"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => handleClose(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Script
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
