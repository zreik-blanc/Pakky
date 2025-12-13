import type { PackageInstallItem, PackageStatus } from '../types';

export type PackageType = PackageInstallItem['type'];

export interface CreatePackageParams {
    type: PackageType;
    name: string;
    description?: string;
    position?: number;
    version?: string;
    required?: boolean;
    postInstall?: string[];
    extensions?: string[];       // For casks (VS Code extensions)
    commands?: string[];         // For scripts
    promptForInput?: PackageInstallItem['promptForInput'];
    installed?: boolean;         // Pre-set already_installed status
}

export interface AppendResult {
    added: PackageInstallItem[];
    duplicates: string[];
}

/**
 * QueueManager
 * 
 * Centralized manager for handling the package installation queue.
 * Responsible for adding, removing, reordering, and merging packages.
 * Ensures consistent position assignment and duplicate prevention.
 */
export class QueueManager {

    // ============================================
    // Factory & ID Generation
    // ============================================

    /**
     * Generate a unique ID for a package based on type and name.
     */
    static generateId(type: PackageType, name: string): string {
        const baseName = name.trim().toLowerCase().replace(/\s+/g, '-');

        if (type === 'script') {
            // Scripts need unique IDs even with same name
            // Use timestamp + random string to avoid collisions in high-speed loops
            const random = Math.random().toString(36).substring(2, 9);
            return `script:${baseName}-${Date.now()}-${random}`;
        }

        return `${type}:${baseName}`;
    }

    /**
     * Create a new PackageInstallItem with consistent defaults.
     */
    static createItem(params: CreatePackageParams): PackageInstallItem {
        const id = this.generateId(params.type, params.name);

        // Determine default description based on type
        let defaultDescription: string;
        switch (params.type) {
            case 'cask':
                defaultDescription = 'Application';
                break;
            case 'script':
                defaultDescription = 'Custom script';
                break;
            case 'mas':
                defaultDescription = 'Mac App Store app';
                break;
            default:
                defaultDescription = 'CLI tool';
        }

        // Determine initial status
        const status: PackageStatus = params.installed ? 'already_installed' : 'pending';

        return {
            id,
            name: params.name.trim(),
            type: params.type,
            position: params.position,
            status,
            description: params.description || defaultDescription,
            version: params.version,
            required: params.required,
            postInstall: params.postInstall,
            extensions: params.extensions,
            commands: params.commands,
            promptForInput: params.promptForInput,
            logs: [],
        };
    }

    // ============================================
    // Duplicate Detection
    // ============================================

    /**
     * Check if a package with the given ID already exists.
     */
    static isDuplicate(packages: PackageInstallItem[], id: string): boolean {
        return packages.some(pkg => pkg.id === id);
    }

    /**
     * Check if a package with the same type and name exists (ignoring script timestamps).
     */
    static isDuplicateByTypeAndName(packages: PackageInstallItem[], type: PackageType, name: string): boolean {
        const normalizedName = String(name ?? '').trim().toLowerCase();
        return packages.some(pkg =>
            pkg.type === type &&
            String(pkg.name ?? '').trim().toLowerCase() === normalizedName
        );
    }

    // ============================================
    // Queue Operations
    // ============================================

    /**
     * Reindex all positions to be sequential (1, 2, 3, ...).
     * Preserves existing relative order.
     */
    static reindex(packages: PackageInstallItem[]): PackageInstallItem[] {
        // Check if any packages have positions defined
        const hasPositions = packages.some(pkg => pkg.position !== undefined);

        let sorted: PackageInstallItem[];
        if (hasPositions) {
            // Sort by existing positions first, then assign sequential
            sorted = [...packages].sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
        } else {
            // No existing positions, maintain current order
            sorted = packages;
        }

        return sorted.map((pkg, index) => ({
            ...pkg,
            position: index + 1,
        }));
    }

    /**
     * Add a single package to the queue.
     * Handles duplicate detection and position assignment.
     */
    static add(current: PackageInstallItem[], params: CreatePackageParams): AppendResult {
        // Check for duplicates (except scripts which are always unique)
        if (params.type !== 'script' && this.isDuplicateByTypeAndName(current, params.type, params.name)) {
            return {
                added: [],
                duplicates: [`${params.type}:${params.name.trim().toLowerCase()}`],
            };
        }

        // Create the package with proper position
        const pkg = this.createItem({
            ...params,
            position: current.length + 1,
        });

        return {
            added: [pkg],
            duplicates: [],
        };
    }

    /**
     * Add multiple packages to the queue.
     */
    static addMultiple(current: PackageInstallItem[], toAdd: PackageInstallItem[]): AppendResult {
        const added: PackageInstallItem[] = [];
        const duplicates: string[] = [];

        let nextPosition = current.length + 1;

        for (const pkg of toAdd) {
            // Check for duplicates (except scripts)
            if (pkg.type !== 'script' && this.isDuplicate(current, pkg.id)) {
                duplicates.push(pkg.id);
                continue;
            }

            // Also check in already-added packages
            if (pkg.type !== 'script' && added.some(p => p.id === pkg.id)) {
                duplicates.push(pkg.id);
                continue;
            }

            added.push({
                ...pkg,
                position: nextPosition++,
            });
        }

        return { added, duplicates };
    }

    /**
     * Remove a package by ID and reindex positions.
     */
    static remove(packages: PackageInstallItem[], id: string): PackageInstallItem[] {
        const filtered = packages.filter(pkg => pkg.id !== id);
        return this.reindex(filtered);
    }

    /**
     * Move a package to a new position (1-indexed).
     */
    static move(packages: PackageInstallItem[], id: string, newPosition: number): PackageInstallItem[] {
        const index = packages.findIndex(pkg => pkg.id === id);
        if (index === -1) return packages;

        // Clamp position to valid range
        const clampedPosition = Math.max(1, Math.min(newPosition, packages.length));
        const targetIndex = clampedPosition - 1; // Convert to 0-indexed

        if (index === targetIndex) return packages;

        // Remove from current position and insert at new position
        const result = [...packages];
        const [moved] = result.splice(index, 1);
        result.splice(targetIndex, 0, moved);

        // Clear all positions to ensure reindex uses array order, not stale position values
        const withClearedPositions = result.map(pkg => ({ ...pkg, position: undefined }));

        return this.reindex(withClearedPositions);
    }

    /**
     * Merge incoming packages with existing ones, adjusting positions.
     * Incoming packages are appended after existing ones.
     */
    static merge(existing: PackageInstallItem[], incoming: PackageInstallItem[]): PackageInstallItem[] {
        if (incoming.length === 0) {
            return existing;
        }

        // Filter out duplicates from incoming
        const existingIds = new Set(existing.map(p => p.id));
        const newPackages = incoming.filter(p => !existingIds.has(p.id));

        if (newPackages.length === 0) {
            return existing;
        }

        if (existing.length === 0) {
            return newPackages;
        }

        // Calculate offset for incoming positions
        const maxExistingPosition = Math.max(...existing.map(p => p.position ?? 0), 0);

        // Adjust incoming positions by offset
        const adjustedPackages = newPackages.map(pkg => ({
            ...pkg,
            position: (pkg.position ?? 0) + maxExistingPosition,
        }));

        return [...existing, ...adjustedPackages];
    }
}
