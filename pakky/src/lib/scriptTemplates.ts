/**
 * Script Templates
 * Provides reusable script step templates for common configurations
 */

import type { ScriptStep } from './types';

// ============================================
// Template Definitions
// ============================================

export interface ScriptTemplate {
    id: string;
    name: string;
    description: string;
    category: 'git' | 'shell' | 'npm' | 'ssh' | 'system';
    step: ScriptStep;
    /** Packages that should trigger this template suggestion */
    suggestedFor?: string[];
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
    // Git Configuration
    {
        id: 'git-config',
        name: 'Configure Git',
        description: 'Set up Git username, email, and common settings',
        category: 'git',
        suggestedFor: ['git', 'gh'],
        step: {
            name: 'Configure Git',
            condition: 'package_installed:git',
            prompt_for_input: {
                'user.name': {
                    message: 'Enter your Git username',
                    default: 'Your Name',
                },
                'user.email': {
                    message: 'Enter your Git email',
                    validation: 'email',
                },
            },
            commands: [
                "git config --global user.name '{{user.name}}'",
                "git config --global user.email '{{user.email}}'",
                "git config --global init.defaultBranch main",
                "git config --global pull.rebase false",
            ],
            continue_on_error: true,
        },
    },

    // SSH Key Generation
    {
        id: 'ssh-keygen',
        name: 'Generate SSH Key',
        description: 'Create a new SSH key for GitHub/GitLab authentication',
        category: 'ssh',
        suggestedFor: ['git', 'gh'],
        step: {
            name: 'Setup SSH Key',
            condition: 'always',
            prompt: 'Generate SSH key for GitHub?',
            prompt_for_input: {
                email: {
                    message: 'Enter your email for SSH key',
                    validation: 'email',
                },
            },
            commands: [
                "ssh-keygen -t ed25519 -C '{{email}}' -f ~/.ssh/id_ed25519 -N ''",
                'eval "$(ssh-agent -s)"',
                'ssh-add ~/.ssh/id_ed25519',
            ],
            continue_on_error: true,
        },
    },

    // NPM Global Packages
    {
        id: 'npm-globals',
        name: 'Install NPM Global Packages',
        description: 'Install commonly used global npm packages (pnpm, yarn, typescript)',
        category: 'npm',
        suggestedFor: ['node', 'npm'],
        step: {
            name: 'Install Global NPM Packages',
            condition: 'package_installed:node',
            commands: [
                'npm install -g pnpm yarn typescript eslint prettier',
            ],
            continue_on_error: true,
        },
    },

    // Oh My Zsh Installation
    {
        id: 'oh-my-zsh',
        name: 'Install Oh My Zsh',
        description: 'Install Oh My Zsh framework for zsh customization',
        category: 'shell',
        suggestedFor: ['zsh'],
        step: {
            name: 'Install Oh My Zsh',
            condition: 'macos',
            prompt: 'Install Oh My Zsh?',
            commands: [
                'sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended',
            ],
            continue_on_error: true,
        },
    },

    // Zsh Plugins
    {
        id: 'zsh-plugins',
        name: 'Install Zsh Plugins',
        description: 'Install zsh-autosuggestions and zsh-syntax-highlighting',
        category: 'shell',
        suggestedFor: ['zsh'],
        step: {
            name: 'Install Zsh Plugins',
            condition: 'macos',
            commands: [
                'git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions',
                'git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting',
            ],
            continue_on_error: true,
        },
    },

    // Python Setup
    {
        id: 'python-setup',
        name: 'Setup Python Environment',
        description: 'Install pip packages and configure Python',
        category: 'system',
        suggestedFor: ['python', 'python3'],
        step: {
            name: 'Setup Python Environment',
            condition: 'package_installed:python',
            commands: [
                'pip3 install --upgrade pip',
                'pip3 install virtualenv pipenv',
            ],
            continue_on_error: true,
        },
    },

    // VS Code Extensions
    {
        id: 'vscode-extensions',
        name: 'Install VS Code Extensions',
        description: 'Install recommended VS Code extensions',
        category: 'system',
        suggestedFor: ['visual-studio-code'],
        step: {
            name: 'Install VS Code Extensions',
            condition: 'package_installed:visual-studio-code',
            commands: [
                'code --install-extension dbaeumer.vscode-eslint',
                'code --install-extension esbenp.prettier-vscode',
                'code --install-extension bradlc.vscode-tailwindcss',
                'code --install-extension eamodio.gitlens',
            ],
            continue_on_error: true,
        },
    },

    // Docker Post-Setup
    {
        id: 'docker-setup',
        name: 'Configure Docker',
        description: 'Start Docker and verify installation',
        category: 'system',
        suggestedFor: ['docker'],
        step: {
            name: 'Configure Docker',
            condition: 'package_installed:docker',
            commands: [
                'open -a Docker',
            ],
            continue_on_error: true,
        },
    },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get templates suggested for the given packages
 */
export function getSuggestedTemplates(packageNames: string[]): ScriptTemplate[] {
    const lowerNames = packageNames.map(n => n.toLowerCase());
    
    return SCRIPT_TEMPLATES.filter(template => {
        if (!template.suggestedFor) return false;
        return template.suggestedFor.some(pkg => 
            lowerNames.some(name => name.includes(pkg))
        );
    });
}

/**
 * Get all templates by category
 */
export function getTemplatesByCategory(category: ScriptTemplate['category']): ScriptTemplate[] {
    return SCRIPT_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): ScriptTemplate | undefined {
    return SCRIPT_TEMPLATES.find(t => t.id === id);
}

/**
 * Convert selected templates to ScriptStep array
 */
export function templatesToSteps(templateIds: string[]): ScriptStep[] {
    return templateIds
        .map(id => getTemplateById(id)?.step)
        .filter((step): step is ScriptStep => step !== undefined);
}
