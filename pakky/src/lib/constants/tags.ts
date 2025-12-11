/**
 * Tag Configuration and Rules
 * Mapping of package keywords to suggested tags for exports
 */

/** Maximum number of tags allowed per config */
export const MAX_TAGS = 5;

export interface TagRule {
    keywords: string[];
    tags: string[];
}

export const TAG_RULES: TagRule[] = [
    { keywords: ['node', 'npm', 'yarn', 'pnpm', 'typescript', 'deno', 'bun'], tags: ['javascript', 'web-dev'] },
    { keywords: ['python', 'pip', 'conda', 'jupyter', 'pandas', 'numpy'], tags: ['python', 'data-science'] },
    { keywords: ['docker', 'kubernetes', 'podman', 'k9s', 'helm'], tags: ['devops', 'containerization'] },
    { keywords: ['visual-studio-code', 'sublime', 'atom', 'vim', 'neovim', 'emacs'], tags: ['editor', 'development'] },
    { keywords: ['git', 'gh', 'gitlab', 'hub', 'lazygit'], tags: ['version-control'] },
    { keywords: ['postgres', 'mysql', 'redis', 'mongodb', 'sqlite', 'mariadb'], tags: ['database'] },
    { keywords: ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'vite'], tags: ['frontend'] },
    { keywords: ['aws', 'azure', 'gcloud', 'terraform', 'pulumi'], tags: ['cloud'] },
    { keywords: ['go', 'golang', 'rust', 'cargo'], tags: ['systems-programming'] },
    { keywords: ['java', 'kotlin', 'gradle', 'maven'], tags: ['java'] },
    { keywords: ['ruby', 'rails', 'rbenv'], tags: ['ruby'] },
    { keywords: ['php', 'composer', 'laravel'], tags: ['php'] },
    { keywords: ['figma', 'sketch', 'adobe'], tags: ['design'] },
    { keywords: ['slack', 'discord', 'zoom', 'teams'], tags: ['communication'] },
    { keywords: ['1password', 'bitwarden', 'lastpass'], tags: ['security'] },
    { keywords: ['raycast', 'alfred', 'rectangle', 'magnet'], tags: ['productivity'] },
    { keywords: ['iterm', 'warp', 'alacritty', 'kitty', 'hyper'], tags: ['terminal'] },
    { keywords: ['arc', 'firefox', 'chrome', 'brave', 'safari'], tags: ['browser'] },
    { keywords: ['spotify', 'vlc', 'iina'], tags: ['media'] },
] as const;
