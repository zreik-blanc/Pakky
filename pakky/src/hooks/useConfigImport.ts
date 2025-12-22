import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { configAPI, type SecurityScanResult } from '@/lib/electron';
import { useConfigStore } from '@/stores/configStore';
import { useQueueStore } from '@/stores/queueStore';
import { parseConfig } from '@/lib/configParser';
import type { PackageInstallItem, PakkyConfig } from '@/lib/types';

interface UseConfigImportReturn {
    // State
    showImportDialog: boolean;
    securityWarning: SecurityScanResult | null;
    // Actions
    openImportDialog: () => void;
    closeImportDialog: () => void;
    handleImportFromFile: () => Promise<void>;
    handleImportFromContent: (content: string) => Promise<void>;
    handleSecurityConfirm: () => void;
    handleSecurityReject: () => void;
}

/**
 * Hook to manage config import flow including:
 * - Import dialog state
 * - File and paste imports
 * - Security warning handling
 */
export function useConfigImport(
    onImportSuccess: () => void
): UseConfigImportReturn {
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [securityWarning, setSecurityWarning] = useState<SecurityScanResult | null>(null);
    const [pendingImport, setPendingImport] = useState<{ packages: PackageInstallItem[] } | null>(null);

    const { setImportedPackages } = useQueueStore();

    // Process imported config (shared logic for both file and paste)
    const processImportedConfig = useCallback(async (
        config: PakkyConfig,
        security: SecurityScanResult
    ) => {
        // Parse config using the centralized parser (handles rich schemas)
        const { packages, settings } = parseConfig(config);

        // Store config in config store for use during installation
        if (settings) {
            useConfigStore.getState().setConfig(config);
        }

        // Check for security warnings
        if (security.hasDangerousContent || security.hasSuspiciousContent || security.hasObfuscation) {
            setSecurityWarning(security);
            setPendingImport({ packages });
            return; // Wait for user confirmation
        }

        setImportedPackages(packages);
        onImportSuccess();
        toast.success('Config imported successfully!');
    }, [setImportedPackages, onImportSuccess]);

    // Open the import dialog
    const openImportDialog = useCallback(() => {
        setShowImportDialog(true);
    }, []);

    // Close the import dialog
    const closeImportDialog = useCallback(() => {
        setShowImportDialog(false);
    }, []);

    // Handle import from file
    const handleImportFromFile = useCallback(async () => {
        try {
            const filePath = await configAPI.selectConfigFile();
            if (!filePath) return;

            const { config, security } = await configAPI.loadConfig(filePath);
            await processImportedConfig(config, security);
        } catch (error) {
            console.error('Failed to import config from file:', error);
            toast.error('Failed to import config. Please check the file format.');
        }
    }, [processImportedConfig]);

    // Handle import from pasted content
    const handleImportFromContent = useCallback(async (content: string) => {
        try {
            const { config, security } = await configAPI.parseContent(content);
            await processImportedConfig(config, security);
        } catch (error) {
            console.error('Failed to import config from pasted content:', error);
            toast.error('Failed to import config. Please check the format and try again.');
        }
    }, [processImportedConfig]);

    // Handle security warning confirmation
    const handleSecurityConfirm = useCallback(() => {
        if (pendingImport) {
            setImportedPackages(pendingImport.packages);
            onImportSuccess();
            toast.success('Config imported successfully!');
        }
        setSecurityWarning(null);
        setPendingImport(null);
    }, [pendingImport, setImportedPackages, onImportSuccess]);

    // Handle security warning rejection
    const handleSecurityReject = useCallback(() => {
        setSecurityWarning(null);
        setPendingImport(null);
    }, []);

    return {
        showImportDialog,
        securityWarning,
        openImportDialog,
        closeImportDialog,
        handleImportFromFile,
        handleImportFromContent,
        handleSecurityConfirm,
        handleSecurityReject,
    };
}
