import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollText, AlertCircle } from 'lucide-react';
import type { PackageInstallItem } from '@/lib/types';

interface ScriptInputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    packages: PackageInstallItem[];
    onConfirm: (values: Record<string, string>) => void;
    onSkip: () => void;
}

interface InputField {
    scriptName: string;
    key: string;
    message: string;
    default?: string;
    validation?: 'email' | 'url' | 'path' | 'none';
}

function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function ScriptInputDialog({ 
    open, 
    onOpenChange, 
    packages, 
    onConfirm, 
    onSkip 
}: ScriptInputDialogProps) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Collect all input fields from scripts
    const inputFields: InputField[] = packages
        .filter(pkg => pkg.type === 'script' && pkg.promptForInput)
        .flatMap(pkg => 
            Object.entries(pkg.promptForInput || {}).map(([key, config]) => ({
                scriptName: pkg.name,
                key,
                message: config.message,
                default: config.default,
                validation: config.validation,
            }))
        );

    // Initialize values with defaults
    useEffect(() => {
        if (open) {
            const initialValues: Record<string, string> = {};
            inputFields.forEach(field => {
                if (field.default && !values[field.key]) {
                    initialValues[field.key] = field.default;
                }
            });
            if (Object.keys(initialValues).length > 0) {
                setValues(prev => ({ ...initialValues, ...prev }));
            }
        }
    }, [open, inputFields.length]);

    const handleChange = (key: string, value: string) => {
        setValues(prev => ({ ...prev, [key]: value }));
        // Clear error when user types
        if (errors[key]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[key];
                return newErrors;
            });
        }
    };

    const validateInputs = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        inputFields.forEach(field => {
            const value = values[field.key] || '';
            
            if (!value.trim()) {
                newErrors[field.key] = 'This field is required';
                return;
            }

            if (field.validation === 'email' && !validateEmail(value)) {
                newErrors[field.key] = 'Please enter a valid email address';
            } else if (field.validation === 'url' && !validateUrl(value)) {
                newErrors[field.key] = 'Please enter a valid URL';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleConfirm = () => {
        if (validateInputs()) {
            onConfirm(values);
        }
    };

    // Group fields by script name
    const groupedFields = inputFields.reduce((acc, field) => {
        if (!acc[field.scriptName]) {
            acc[field.scriptName] = [];
        }
        acc[field.scriptName].push(field);
        return acc;
    }, {} as Record<string, InputField[]>);

    if (inputFields.length === 0) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-amber-500" />
                        Script Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Some post-install scripts require additional information to run.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[400px] pr-4">
                    <div className="space-y-6 py-4">
                        {Object.entries(groupedFields).map(([scriptName, fields]) => (
                            <div key={scriptName} className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    {scriptName}
                                </h4>
                                {fields.map(field => (
                                    <div key={field.key} className="space-y-2">
                                        <Label htmlFor={field.key}>
                                            {field.message}
                                        </Label>
                                        <Input
                                            id={field.key}
                                            type={field.validation === 'email' ? 'email' : 'text'}
                                            placeholder={field.default || ''}
                                            value={values[field.key] || ''}
                                            onChange={(e) => handleChange(field.key, e.target.value)}
                                            className={errors[field.key] ? 'border-red-500' : ''}
                                        />
                                        {errors[field.key] && (
                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                {errors[field.key]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onSkip}>
                        Skip Scripts
                    </Button>
                    <Button onClick={handleConfirm}>
                        Continue Installation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
