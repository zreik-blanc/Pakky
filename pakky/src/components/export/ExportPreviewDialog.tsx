import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '../ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileJson, Download, Settings, Tag, Apple, AppWindow, Terminal } from 'lucide-react';
import { JsonPreview } from '@/components/ui/json-preview';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { TagInput } from '@/components/ui/TagInput';
import { ScriptSelector } from '@/components/export/ScriptSelector';
import { Checkbox } from '@/components/ui/checkbox';
import type { PakkyConfig, PackageInstallItem, SystemInfo, ConfigSettings } from '@/lib/types';
import { buildPakkyConfig, generateTagSuggestions, getMacOSMinVersion, DEFAULT_BUILD_OPTIONS, type BuildConfigOptions } from '@/lib/configBuilder';
import { getSuggestedTemplates, templatesToSteps } from '@/lib/scriptTemplates';
import { EXPORT_DEFAULTS } from '@/lib/constants';
import { hoverScale, tapScale, formContainer, formItem } from '@/lib/animations';

interface ExportPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    packages: PackageInstallItem[];
    onConfirm: (config: PakkyConfig) => void;
    userName?: string;
    systemInfo?: SystemInfo | null;
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
    const [name, setName] = useState<string>(EXPORT_DEFAULTS.NAME);
    const [description, setDescription] = useState<string>(EXPORT_DEFAULTS.DESCRIPTION);
    const [tags, setTags] = useState<string[]>([]);
    const [nameError, setNameError] = useState<string>('');

    // Export options
    const [includeDescriptions, setIncludeDescriptions] = useState(DEFAULT_BUILD_OPTIONS.includeDescriptions);
    const [includeMetadata, setIncludeMetadata] = useState(DEFAULT_BUILD_OPTIONS.includeMetadata);
    const [includeSystemRequirements, setIncludeSystemRequirements] = useState(DEFAULT_BUILD_OPTIONS.includeSystemRequirements);

    // System requirements (user-configurable)
    const [minVersion, setMinVersion] = useState<string>('');
    const [selectedArchitectures, setSelectedArchitectures] = useState<('arm64' | 'x86_64')[]>([]);

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
            setName(EXPORT_DEFAULTS.NAME);
            setDescription(EXPORT_DEFAULTS.DESCRIPTION);
            setTags([]);
            setIncludeDescriptions(DEFAULT_BUILD_OPTIONS.includeDescriptions);
            setIncludeMetadata(DEFAULT_BUILD_OPTIONS.includeMetadata);
            setIncludeSystemRequirements(DEFAULT_BUILD_OPTIONS.includeSystemRequirements);
            setSettings(DEFAULT_BUILD_OPTIONS.settings);
            setSelectedTemplates([]);
            setNameError('');

            // Pre-populate system requirements from current system
            if (systemInfo) {
                setMinVersion(getMacOSMinVersion(systemInfo.version));
                setSelectedArchitectures([systemInfo.arch as 'arm64' | 'x86_64']);
            } else {
                setMinVersion('');
                setSelectedArchitectures([]);
            }
        }
    }, [open, systemInfo]);

    // Toggle architecture selection
    const toggleArchitecture = (arch: 'arm64' | 'x86_64') => {
        setSelectedArchitectures(prev =>
            prev.includes(arch)
                ? prev.filter(a => a !== arch)
                : [...prev, arch]
        );
    };

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
            systemRequirements: includeSystemRequirements ? {
                minVersion: minVersion || undefined,
                architectures: selectedArchitectures.length > 0 ? selectedArchitectures : undefined,
            } : undefined,
        };

        const config = buildPakkyConfig(packages, options);

        // Add script steps if any selected
        if (selectedTemplates.length > 0) {
            config.scripts = templatesToSteps(selectedTemplates);
        }

        return config;
    }, [
        name, description, userName, tags, includeDescriptions, includeMetadata,
        includeSystemRequirements, settings, systemInfo, packages, selectedTemplates,
        minVersion, selectedArchitectures
    ]);

    const handleConfirm = () => {
        // Validate name
        if (!name.trim()) {
            setNameError('Configuration name is required');
            return;
        }
        if (name.length > 100) {
            setNameError('Name is too long (max 100 characters)');
            return;
        }
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
                        <TabsContent value="general" className="mt-0">
                            <motion.div
                                className="space-y-4"
                                variants={formContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.div className="grid gap-2" variants={formItem}>
                                    <Label htmlFor="name">Configuration Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (nameError) setNameError('');
                                        }}
                                        placeholder="my-awesome-config"
                                        className={nameError ? 'border-destructive' : ''}
                                    />
                                    <AnimatePresence>
                                        {nameError && (
                                            <motion.p
                                                className="text-xs text-destructive"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                            >
                                                {nameError}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                    {userName && (
                                        <p className="text-[10px] text-muted-foreground">
                                            Author: <span className="font-medium text-foreground">{userName}</span>
                                        </p>
                                    )}
                                </motion.div>

                                <motion.div className="grid gap-2" variants={formItem}>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Add notes about this configuration..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="resize-none h-20"
                                    />
                                </motion.div>

                                <motion.div className="grid gap-2" variants={formItem}>
                                    <Label>Tags</Label>
                                    <TagInput
                                        tags={tags}
                                        suggestions={tagSuggestions}
                                        onChange={setTags}
                                    />
                                </motion.div>

                                {suggestedTemplates.length > 0 && (
                                    <motion.div variants={formItem}>
                                        <ScriptSelector
                                            templates={suggestedTemplates}
                                            selectedIds={selectedTemplates}
                                            onChange={setSelectedTemplates}
                                        />
                                    </motion.div>
                                )}
                            </motion.div>
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
                                        <div className="space-y-3">
                                            <ToggleSwitch
                                                checked={includeSystemRequirements}
                                                onChange={setIncludeSystemRequirements}
                                                label="Include system requirements"
                                                description="Add platform version and architecture requirements"
                                            />
                                            {/* Expandable system requirements settings by platform */}
                                            {includeSystemRequirements && (
                                                <div className="ml-12 pl-4 border-l-2 border-border space-y-4 pt-2">
                                                    {/* macOS Requirements */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Apple className="w-4 h-4" />
                                                            <h5 className="text-sm font-medium">macOS</h5>
                                                        </div>
                                                        <div className="ml-6 space-y-3">
                                                            <div className="space-y-1.5">
                                                                <Label htmlFor="minVersion" className="text-xs text-muted-foreground">
                                                                    Minimum Version
                                                                </Label>
                                                                <Input
                                                                    id="minVersion"
                                                                    value={minVersion}
                                                                    onChange={(e) => setMinVersion(e.target.value)}
                                                                    placeholder="e.g., 14.0"
                                                                    className="h-8 text-sm max-w-[150px]"
                                                                />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs text-muted-foreground">
                                                                    Supported Architectures
                                                                </Label>
                                                                <div className="flex gap-4">
                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <Checkbox
                                                                            checked={selectedArchitectures.includes('arm64')}
                                                                            onCheckedChange={() => toggleArchitecture('arm64')}
                                                                        />
                                                                        <span className="text-sm">Apple Silicon (arm64)</span>
                                                                    </label>
                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <Checkbox
                                                                            checked={selectedArchitectures.includes('x86_64')}
                                                                            onCheckedChange={() => toggleArchitecture('x86_64')}
                                                                        />
                                                                        <span className="text-sm">Intel (x86_64)</span>
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Windows Requirements - Future */}
                                                    <div className="space-y-3 opacity-40">
                                                        <div className="flex items-center gap-2">
                                                            <AppWindow className="w-4 h-4" />
                                                            <h5 className="text-sm font-medium">Windows</h5>
                                                            <span className="text-xs text-muted-foreground">(coming soon)</span>
                                                        </div>
                                                    </div>

                                                    {/* Linux Requirements - Future */}
                                                    <div className="space-y-3 opacity-40">
                                                        <div className="flex items-center gap-2">
                                                            <Terminal className="w-4 h-4" />
                                                            <h5 className="text-sm font-medium">Linux</h5>
                                                            <span className="text-xs text-muted-foreground">(coming soon)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
                    <motion.div whileHover={hoverScale} whileTap={tapScale}>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                    </motion.div>
                    <motion.div whileHover={!name.trim() ? {} : hoverScale} whileTap={!name.trim() ? {} : tapScale}>
                        <Button onClick={handleConfirm} className="gap-2" disabled={!name.trim()}>
                            <Download className="w-4 h-4" />
                            Save Configuration
                        </Button>
                    </motion.div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
