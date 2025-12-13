import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import type { ConfigSettings } from '@/lib/types';

interface InstallSettingsPopoverProps {
    settings: ConfigSettings;
    onChange: (settings: ConfigSettings) => void;
    disabled?: boolean;
}

const DEFAULT_SETTINGS: ConfigSettings = {
    continue_on_error: true,
    skip_already_installed: true,
    parallel_installs: false,
};

export function InstallSettingsPopover({
    settings,
    onChange,
    disabled = false,
}: InstallSettingsPopoverProps) {
    const [open, setOpen] = useState(false);

    // Merge with defaults to ensure all fields are present
    const currentSettings = { ...DEFAULT_SETTINGS, ...settings };

    const updateSetting = (key: keyof ConfigSettings, value: boolean) => {
        onChange({ ...currentSettings, [key]: value });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    className="h-8 gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Settings</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <h4 className="text-sm font-medium">Installation Settings</h4>
                        <p className="text-xs text-muted-foreground">
                            Configure how packages are installed
                        </p>
                    </div>
                    <div className="space-y-3">
                        <ToggleSwitch
                            checked={currentSettings.continue_on_error ?? true}
                            onChange={(v) => updateSetting('continue_on_error', v)}
                            label="Continue on error"
                            description="Continue installing other packages if one fails"
                        />
                        <ToggleSwitch
                            checked={currentSettings.skip_already_installed ?? true}
                            onChange={(v) => updateSetting('skip_already_installed', v)}
                            label="Skip already installed"
                            description="Don't reinstall packages that are already present"
                        />
                        <ToggleSwitch
                            checked={currentSettings.parallel_installs ?? false}
                            onChange={(v) => updateSetting('parallel_installs', v)}
                            label="Parallel installs"
                            description="Install multiple packages simultaneously (experimental)"
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
