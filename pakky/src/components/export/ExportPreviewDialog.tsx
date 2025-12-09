import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '../ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileJson, Download, Settings, Tag, Sparkles, X } from 'lucide-react';
import { JsonPreview } from '@/components/ui/json-preview';
import { Badge } from '@/components/ui/badge';
import type { PakkyConfig, PackageInstallItem, SystemInfo, ConfigSettings } from '@/lib/types';
import { buildPakkyConfig, generateTagSuggestions, DEFAULT_BUILD_OPTIONS, type BuildConfigOptions } from '@/lib/configBuilder';
import { getSuggestedTemplates, templatesToSteps, type PostInstallTemplate } from '@/lib/postInstallTemplates';
import { APP_CONFIG } from '@/lib/config';

interface ExportPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    packages: PackageInstallItem[];
    onConfirm: (config: PakkyConfig) => void;
    userName?: string;
    systemInfo?: SystemInfo | null;
}

// Toggle Switch Component
function ToggleSwitch({ 
    checked, 
    onChange, 
    label, 
    description 
}: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string; 
    description?: string;
}) {
    return (
        <label className="flex items-start gap-3 cursor-pointer group">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`
                    relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 
                    focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    ${checked ? 'bg-primary' : 'bg-muted'}
                `}
            >
                <span
                    className={`
                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg 
                        ring-0 transition duration-200 ease-in-out
                        ${checked ? 'translate-x-4' : 'translate-x-0'}
                    `}
                />
            </button>
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium leading-none group-hover:text-foreground transition-colors">
                    {label}
                </span>
                {description && (
                    <span className="text-xs text-muted-foreground">{description}</span>
                )}
            </div>
        </label>
    );
}

// Tag Input Component
function TagInput({ 
    tags, 
    suggestions, 
    onChange 
}: { 
    tags: string[]; 
    suggestions: string[]; 
    onChange: (tags: string[]) => void;
}) {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim().toLowerCase();
            if (newTag && !tags.includes(newTag)) {
                onChange([...tags, newTag]);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    const addSuggestion = (suggestion: string) => {
        if (!tags.includes(suggestion)) {
            onChange([...tags, suggestion]);
        }
    };

    const unusedSuggestions = suggestions.filter(s => !tags.includes(s));

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 p-2 min-h-[42px] rounded-md border border-input bg-background">
                {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-muted rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? "Add tags..." : ""}
                    className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                />
            </div>
            {unusedSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Suggestions:
                    </span>
                    {unusedSuggestions.slice(0, 6).map(suggestion => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => addSuggestion(suggestion)}
                            className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                            + {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Post-Install Template Selector
function PostInstallSelector({
    templates,
    selectedIds,
    onChange
}: {
    templates: PostInstallTemplate[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
}) {
    if (templates.length === 0) return null;

    const toggleTemplate = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(t => t !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    return (
        <div className="space-y-2">
            <Label className="text-sm">Post-Install Scripts</Label>
            <p className="text-xs text-muted-foreground mb-2">
                Select scripts to run after installation
            </p>
            <div className="space-y-1">
                {templates.map(template => {
                    const isSelected = selectedIds.includes(template.id);
                    return (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => toggleTemplate(template.id)}
                            className={`
                                w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all
                                ${isSelected 
                                    ? 'bg-primary/10 ring-1 ring-primary/30' 
                                    : 'hover:bg-muted/50'
                                }
                            `}
                        >
                            <div
                                className={`
                                    mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors
                                    ${isSelected 
                                        ? 'border-primary bg-primary text-primary-foreground' 
                                        : 'border-muted-foreground/30'
                                    }
                                `}
                            >
                                {isSelected && (
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
                                    {template.name}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {template.description}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function ExportPreviewDialog({
    open,
    onOpenChange,
    packages,
    onConfirm,
    userName,
    systemInfo
}: ExportPreviewDialogProps) {
    // Basic info
    const [name, setName] = useState<string>(APP_CONFIG.DEFAULTS.EXPORT_NAME);
    const [description, setDescription] = useState<string>(APP_CONFIG.DEFAULTS.EXPORT_DESCRIPTION);
    const [tags, setTags] = useState<string[]>([]);

    // Export options
    const [includeDescriptions, setIncludeDescriptions] = useState(DEFAULT_BUILD_OPTIONS.includeDescriptions);
    const [includeMetadata, setIncludeMetadata] = useState(DEFAULT_BUILD_OPTIONS.includeMetadata);
    const [includeSystemRequirements, setIncludeSystemRequirements] = useState(DEFAULT_BUILD_OPTIONS.includeSystemRequirements);

    // Settings
    const [settings, setSettings] = useState<ConfigSettings>(DEFAULT_BUILD_OPTIONS.settings);

    // Post-install templates
    const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

    // Tag suggestions based on packages
    const tagSuggestions = useMemo(() => generateTagSuggestions(packages), [packages]);

    // Suggested post-install templates based on packages
    const suggestedTemplates = useMemo(() => 
        getSuggestedTemplates(packages.map(p => p.name)), 
        [packages]
    );

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setName(APP_CONFIG.DEFAULTS.EXPORT_NAME);
            setDescription(APP_CONFIG.DEFAULTS.EXPORT_DESCRIPTION);
            setTags([]);
            setIncludeDescriptions(DEFAULT_BUILD_OPTIONS.includeDescriptions);
            setIncludeMetadata(DEFAULT_BUILD_OPTIONS.includeMetadata);
            setIncludeSystemRequirements(DEFAULT_BUILD_OPTIONS.includeSystemRequirements);
            setSettings(DEFAULT_BUILD_OPTIONS.settings);
            setSelectedTemplates([]);
        }
    }, [open]);

    // Build the config for preview
    const previewConfig = useMemo(() => {
        const options: BuildConfigOptions = {
            name,
            description: description || undefined,
            author: userName,
            tags: tags.length > 0 ? tags : undefined,
            includeDescriptions,
            includeMetadata,
            includeSystemRequirements,
            settings,
            systemInfo: systemInfo || undefined,
        };

        const config = buildPakkyConfig(packages, options);

        // Add post-install steps if any selected
        if (selectedTemplates.length > 0) {
            config.post_install = templatesToSteps(selectedTemplates);
        }

        return config;
    }, [
        name, description, userName, tags, includeDescriptions, includeMetadata,
        includeSystemRequirements, settings, systemInfo, packages, selectedTemplates
    ]);

    const handleConfirm = () => {
        onConfirm(previewConfig);
    };

    const updateSetting = (key: keyof ConfigSettings, value: boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-primary" />
                        Export Configuration
                    </DialogTitle>
                    <DialogDescription>
                        Customize and export your package configuration.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="mx-6 grid grid-cols-3 w-auto">
                        <TabsTrigger value="general" className="gap-1.5">
                            <FileJson className="w-3.5 h-3.5" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="options" className="gap-1.5">
                            <Settings className="w-3.5 h-3.5" />
                            Options
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Preview
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
                        {/* General Tab */}
                        <TabsContent value="general" className="mt-0 space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Configuration Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="my-awesome-config"
                                />
                                {userName && (
                                    <p className="text-[10px] text-muted-foreground">
                                        Author: <span className="font-medium text-foreground">{userName}</span>
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Add notes about this configuration..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="resize-none h-20"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Tags</Label>
                                <TagInput
                                    tags={tags}
                                    suggestions={tagSuggestions}
                                    onChange={setTags}
                                />
                            </div>

                            {suggestedTemplates.length > 0 && (
                                <PostInstallSelector
                                    templates={suggestedTemplates}
                                    selectedIds={selectedTemplates}
                                    onChange={setSelectedTemplates}
                                />
                            )}
                        </TabsContent>

                        {/* Options Tab */}
                        <TabsContent value="options" className="mt-0 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium mb-3">Export Options</h4>
                                    <div className="space-y-3">
                                        <ToggleSwitch
                                            checked={includeDescriptions}
                                            onChange={setIncludeDescriptions}
                                            label="Include package descriptions"
                                            description="Add descriptions to each package in the config"
                                        />
                                        <ToggleSwitch
                                            checked={includeMetadata}
                                            onChange={setIncludeMetadata}
                                            label="Include metadata"
                                            description="Add creation date, version, and export info"
                                        />
                                        <ToggleSwitch
                                            checked={includeSystemRequirements}
                                            onChange={setIncludeSystemRequirements}
                                            label="Include system requirements"
                                            description="Add macOS version and architecture requirements"
                                        />
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium mb-3">Installation Settings</h4>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        These settings control how packages are installed when importing this config
                                    </p>
                                    <div className="space-y-3">
                                        <ToggleSwitch
                                            checked={settings.continue_on_error ?? true}
                                            onChange={(v) => updateSetting('continue_on_error', v)}
                                            label="Continue on error"
                                            description="Continue installing other packages if one fails"
                                        />
                                        <ToggleSwitch
                                            checked={settings.skip_already_installed ?? true}
                                            onChange={(v) => updateSetting('skip_already_installed', v)}
                                            label="Skip already installed"
                                            description="Don't reinstall packages that are already present"
                                        />
                                        <ToggleSwitch
                                            checked={settings.parallel_installs ?? false}
                                            onChange={(v) => updateSetting('parallel_installs', v)}
                                            label="Parallel installs"
                                            description="Install multiple packages simultaneously (faster but less stable)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Preview Tab */}
                        <TabsContent value="preview" className="mt-0">
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>JSON Preview</Label>
                                    <span className="text-xs text-muted-foreground">
                                        {packages.length} package{packages.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="relative rounded-md border border-border bg-muted/30">
                                    <ScrollArea className="h-[400px] w-full rounded-md">
                                        <JsonPreview
                                            data={previewConfig}
                                            className="p-4"
                                        />
                                    </ScrollArea>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="p-6 pt-2 shrink-0 bg-background/80 backdrop-blur-sm z-50 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} className="gap-2">
                        <Download className="w-4 h-4" />
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
