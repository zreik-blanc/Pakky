import { z } from 'zod';

// Helper schemas
const PackageObjectSchema = z.object({
    name: z.string(),
    version: z.string().optional(),
    description: z.string().optional(),
    required: z.boolean().optional(),
    position: z.number().optional(), // Queue position for ordering
    post_install: z.array(z.string()).optional(),
});

const CaskObjectSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional(),
    position: z.number().optional(), // Queue position for ordering
    extensions: z.array(z.string()).optional(),
    post_install: z.array(z.string()).optional(),
});

const ItemSchema = z.union([z.string(), PackageObjectSchema]);
const CaskItemSchema = z.union([z.string(), CaskObjectSchema]);

const MASAppSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional(),
});

const ShellConfigSchema = z.object({
    default_shell: z.enum(['zsh', 'bash', 'fish']).optional(),
    install_oh_my_zsh: z.boolean().optional(),
    oh_my_zsh_theme: z.string().optional(),
    zsh_plugins: z.array(z.string()).optional(),
    dotfiles: z.object({
        source: z.string(),
        files: z.array(z.string()),
    }).optional(),
});

const MacOSSystemSettingsSchema = z.object({
    dock: z.object({
        autohide: z.boolean().optional(),
        size: z.number().optional(),
        position: z.enum(['bottom', 'left', 'right']).optional(),
        show_recents: z.boolean().optional(),
    }).optional(),
    finder: z.object({
        show_hidden_files: z.boolean().optional(),
        show_path_bar: z.boolean().optional(),
        show_status_bar: z.boolean().optional(),
        default_view: z.enum(['icon', 'list', 'column', 'gallery']).optional(),
    }).optional(),
    keyboard: z.object({
        key_repeat_rate: z.number().optional(),
        initial_key_repeat: z.number().optional(),
        disable_press_and_hold: z.boolean().optional(),
    }).optional(),
    trackpad: z.object({
        tap_to_click: z.boolean().optional(),
        three_finger_drag: z.boolean().optional(),
    }).optional(),
    screenshots: z.object({
        location: z.string().optional(),
        format: z.enum(['png', 'jpg', 'pdf']).optional(),
        show_thumbnail: z.boolean().optional(),
    }).optional(),
});

const MacOSConfigSchema = z.object({
    requires: z.object({
        min_version: z.string().optional(),
        arch: z.array(z.enum(['arm64', 'x86_64'])).optional(),
    }).optional(),
    homebrew: z.object({
        taps: z.array(z.string()).optional(),
        formulae: z.array(ItemSchema).optional(),
        casks: z.array(CaskItemSchema).optional(),
    }).optional(),
    mas: z.array(MASAppSchema).optional(),
    shell: ShellConfigSchema.optional(),
    system: MacOSSystemSettingsSchema.optional(),
});

const WingetPackageSchema = z.object({
    id: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional(),
});

const WingetItemSchema = z.union([z.string(), WingetPackageSchema]);

const WindowsConfigSchema = z.object({
    requires: z.object({
        min_version: z.string().optional(),
    }).optional(),
    winget: z.array(WingetItemSchema).optional(),
    chocolatey: z.array(z.string()).optional(),
    wsl: z.object({
        enable: z.boolean().optional(),
        distro: z.string().optional(),
        install_packages: z.array(z.string()).optional(),
    }).optional(),
    powershell: z.object({
        profile_setup: z.boolean().optional(),
        modules: z.array(z.string()).optional(),
    }).optional(),
});

const LinuxConfigSchema = z.object({
    requires: z.object({
        distros: z.array(z.string()).optional(),
    }).optional(),
    apt: z.array(ItemSchema).optional(),
    dnf: z.array(z.string()).optional(),
    pacman: z.array(z.string()).optional(),
    flatpak: z.object({
        enabled: z.boolean().optional(),
        packages: z.array(z.string()).optional(),
    }).optional(),
    shell: ShellConfigSchema.optional(),
});

const ScriptStepSchema = z.object({
    name: z.string()
        .min(1, 'Script name is required')
        .max(255, 'Script name cannot exceed 255 characters'),
    position: z.number().optional(), // Queue position for ordering
    condition: z.string()
        .max(1000, 'Condition cannot exceed 1000 characters')
        .optional(),
    prompt: z.string()
        .max(500, 'Prompt cannot exceed 500 characters')
        .optional(),
    prompt_for_input: z.record(z.string(), z.object({
        message: z.string().max(500, 'Message cannot exceed 500 characters'),
        default: z.string().max(1000, 'Default value cannot exceed 1000 characters').optional(),
        validation: z.enum(['email', 'url', 'path', 'none']).optional(),
    })).optional(),
    commands: z.array(
        z.string()
            .min(1, 'Command cannot be empty')
            .max(10000, 'Command cannot exceed 10000 characters')
    )
        .min(1, 'At least one command is required')
        .max(100, 'Maximum 100 commands per script'),
    continue_on_error: z.boolean().optional(),
});

const ConfigSettingsSchema = z.object({
    continue_on_error: z.boolean().optional(),
    skip_already_installed: z.boolean().optional(),
    parallel_installs: z.boolean().optional(),
    create_backup: z.boolean().optional(),
});

const ConfigMetadataSchema = z.object({
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    pakky_version: z.string().optional(),
    exported_from: z.string().optional(),
    checksum: z.string().optional(),
});

// Main Config Schema
// Constants for validation
export const CONFIG_LIMITS = {
    MAX_TAGS: 5,
} as const;

// Main Config Schema
export const PakkyConfigSchema = z.object({
    $schema: z.string().optional(),
    name: z.string(),
    version: z.string(),
    author: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).max(CONFIG_LIMITS.MAX_TAGS, {
        message: `Maximum ${CONFIG_LIMITS.MAX_TAGS} tags allowed`
    }).optional(),
    settings: ConfigSettingsSchema.optional(),
    macos: MacOSConfigSchema.optional(),
    windows: WindowsConfigSchema.optional(),
    linux: LinuxConfigSchema.optional(),
    scripts: z.array(ScriptStepSchema).optional(),
    metadata: ConfigMetadataSchema.optional(),
});

export const PresetSchema = z.object({
    id: z.string().optional(), // Can be injected
    name: z.string(),
    description: z.string(),
    icon: z.string().optional(),
    settings: ConfigSettingsSchema.optional(),
    macos: MacOSConfigSchema.optional(), // Use the full MacOS schema
    windows: WindowsConfigSchema.optional(),
    linux: LinuxConfigSchema.optional(),
    // Keep legacy packages support for backward compatibility if needed, or remove if we want strict adherence to new schema
    // The previous schema had a generic 'packages' object which seems to be a simplified macos/homebrew mirror. 
    // Given the direction is "future ready" and "every schema", usage of specific OS schemas is better.
    // However, to avoid breaking existing presets that might use 'packages' (though checking devops-engineer.json it uses macos.homebrew), 
    // I will keep it but make it optional as it was.
    packages: z.object({
        taps: z.array(z.string()).optional(),
        formulae: z.array(ItemSchema).optional(),
        casks: z.array(CaskItemSchema).optional(),
    }).optional(),
    scripts: z.array(ScriptStepSchema).optional(),
});
