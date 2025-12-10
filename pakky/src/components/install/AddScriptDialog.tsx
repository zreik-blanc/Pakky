import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollText, Plus, AlertCircle, Variable } from 'lucide-react';
import type { PackageInstallItem } from '@/lib/types';

interface AddScriptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (script: PackageInstallItem) => void;
}

interface VariableConfig {
    key: string;
    message: string;
    defaultValue: string;
}

// Extract {{variable}} placeholders from commands
function extractVariables(commands: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = regex.exec(commands)) !== null) {
        variables.add(match[1].trim());
    }
    return Array.from(variables);
}

export function AddScriptDialog({ open, onOpenChange, onAdd }: AddScriptDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [commands, setCommands] = useState('');
    const [error, setError] = useState('');
    const [variableConfigs, setVariableConfigs] = useState<Record<string, VariableConfig>>({});

    // Detect variables in commands
    const detectedVariables = useMemo(() => extractVariables(commands), [commands]);

    // Update variable configs when commands change
    const handleCommandsChange = (value: string) => {
        setCommands(value);
        setError('');
        
        const newVariables = extractVariables(value);
        setVariableConfigs(prev => {
            const updated: Record<string, VariableConfig> = {};
            for (const varName of newVariables) {
                if (prev[varName]) {
                    updated[varName] = prev[varName];
                } else {
                    // Create default config for new variable
                    updated[varName] = {
                        key: varName,
                        message: `Enter value for ${varName}`,
                        defaultValue: '',
                    };
                }
            }
            return updated;
        });
    };

    const updateVariableConfig = (key: string, field: 'message' | 'defaultValue', value: string) => {
        setVariableConfigs(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
            },
        }));
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setCommands('');
        setError('');
        setVariableConfigs({});
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

        // Build promptForInput from variable configs
        const promptForInput: PackageInstallItem['promptForInput'] = {};
        for (const varName of detectedVariables) {
            const config = variableConfigs[varName];
            if (config) {
                promptForInput[varName] = {
                    message: config.message || `Enter value for ${varName}`,
                    default: config.defaultValue || undefined,
                };
            }
        }

        const script: PackageInstallItem = {
            id: `script:${name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            name: name.trim(),
            type: 'script',
            status: 'pending',
            description: description.trim() || 'Custom script',
            commands: commandList,
            promptForInput: Object.keys(promptForInput).length > 0 ? promptForInput : undefined,
            logs: [],
        };

        onAdd(script);
        handleClose(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-amber-500" />
                        Add Custom Script
                    </DialogTitle>
                    <DialogDescription>
                        Create a custom script. Use <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{{variable}}"}</code> for dynamic values.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pr-4">
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
                                placeholder={`echo "Hello {{name}}"\nmkdir -p ~/Projects\ngit config --global user.name '{{username}}'`}
                                value={commands}
                                onChange={(e) => handleCommandsChange(e.target.value)}
                                rows={5}
                                className="font-mono text-sm"
                            />
                        </div>

                        {/* Variable configuration section */}
                        {detectedVariables.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Variable className="w-4 h-4 text-amber-500" />
                                    <span>Variables Detected ({detectedVariables.length})</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Configure prompts for each variable. Users will be asked to enter these values before the script runs.
                                </p>
                                
                                <div className="space-y-4 pl-1">
                                    {detectedVariables.map(varName => (
                                        <div key={varName} className="p-3 bg-muted/30 rounded-lg space-y-3">
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-mono">
                                                    {`{{${varName}}}`}
                                                </code>
                                            </div>
                                            <div className="grid gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Prompt Message</Label>
                                                    <Input
                                                        placeholder={`Enter value for ${varName}`}
                                                        value={variableConfigs[varName]?.message || ''}
                                                        onChange={(e) => updateVariableConfig(varName, 'message', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Default Value (optional)</Label>
                                                    <Input
                                                        placeholder="No default"
                                                        value={variableConfigs[varName]?.defaultValue || ''}
                                                        onChange={(e) => updateVariableConfig(varName, 'defaultValue', e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </p>
                        )}
                    </div>
                </ScrollArea>

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
