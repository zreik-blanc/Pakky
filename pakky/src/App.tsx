import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { useInstallStore } from './stores/installStore';
import { configAPI, userConfigAPI, type SecurityScanResult } from './lib/electron';
import type { PackageInstallItem } from './lib/types';
import { parseConfig } from './lib/configParser';
import { QueueManager } from '@/lib/managers/queueManager';
import { UI_STRINGS } from './lib/constants';
import { spinnerTransition, pulseTransition, pageTransition } from './lib/animations';
import './index.css';

// Components
import AppLayout from '@/components/layout/AppLayout';
import OnboardingPage from '@/pages/Onboarding';
import { ConfigCorruptionAlert } from '@/components/alerts/ConfigCorruptionAlert';
import { SecurityWarningAlert } from '@/components/alerts/SecurityWarningAlert';
import { AppRoutes } from '@/components/AppRoutes';
import { ImportConfigDialog } from '@/components/import/ImportConfigDialog';
import { useAppInitialization } from '@/hooks/useAppInitialization';

type Page = 'home' | 'presets' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [importedPackages, setImportedPackages] = useState<PackageInstallItem[]>([]);
  const [hasImportedConfig, setHasImportedConfig] = useState(false); // Track if packages came from import
  const [selectedPackages, setSelectedPackages] = useState<PackageInstallItem[]>([]);
  const [installLogs, setInstallLogs] = useState<Record<string, string[]>>({});
  const [securityWarning, setSecurityWarning] = useState<SecurityScanResult | null>(null);
  const [pendingImport, setPendingImport] = useState<{ packages: PackageInstallItem[] } | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { progress } = useInstallStore();

  const {
    systemInfo,
    isLoading,
    isOnboarding,
    showMainApp,
    configError,
    handleOnboardingComplete,
    userConfig
  } = useAppInitialization();

  // Load initial queue from user config
  useEffect(() => {
    if (userConfig?.queue && userConfig.queue.length > 0) {
      setSelectedPackages(prev => {
        // Merge with any existing (safely adjusting positions)
        return QueueManager.merge(prev, userConfig.queue!);
      });
    }
  }, [userConfig]);

  // Persist queue changes to user config (debounced)
  const saveQueueTimeout = useRef<NodeJS.Timeout>();
  useEffect(() => {
    if (!userConfig) return;

    // Clear existing timeout
    if (saveQueueTimeout.current) {
      clearTimeout(saveQueueTimeout.current);
    }

    // Debounce save (1s) to avoid excessive file writes while typing/clicking
    saveQueueTimeout.current = setTimeout(() => {
      userConfigAPI.save({
        queue: selectedPackages
      }).catch(err => console.error('Failed to save queue:', err));
    }, 1000);

    return () => {
      if (saveQueueTimeout.current) {
        clearTimeout(saveQueueTimeout.current);
      }
    };
  }, [selectedPackages, userConfig]);

  // Open the import dialog
  const handleImportConfig = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  // Process imported config (shared logic for both file and paste)
  const processImportedConfig = useCallback(async (
    config: import('./lib/types').PakkyConfig,
    security: SecurityScanResult
  ) => {
    // Parse config using the centralized parser (handles rich schemas)
    const { packages, settings } = parseConfig(config);

    // Store config settings in install store for use during installation
    if (settings) {
      useInstallStore.getState().setConfig(config);
    }

    // Check for security warnings
    if (security.hasDangerousContent || security.hasSuspiciousContent || security.hasObfuscation) {
      setSecurityWarning(security);
      setPendingImport({ packages });
      return; // Wait for user confirmation
    }

    setImportedPackages(packages);
    setHasImportedConfig(true);
    setCurrentPage('home');
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
    const { config, security } = await configAPI.parseContent(content);
    await processImportedConfig(config, security);
  }, [processImportedConfig]);

  // Handle security warning confirmation
  const handleSecurityConfirm = useCallback(() => {
    if (pendingImport) {
      setImportedPackages(pendingImport.packages);
      setHasImportedConfig(true); // Mark that we have imported packages
      setCurrentPage('home');
    }
    setSecurityWarning(null);
    setPendingImport(null);
  }, [pendingImport]);

  // Handle security warning rejection
  const handleSecurityReject = useCallback(() => {
    setSecurityWarning(null);
    setPendingImport(null);
  }, []);

  // Clear the imported flag when user clears all packages
  const handleClearImportedFlag = useCallback(() => {
    setHasImportedConfig(false);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <motion.div
            className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto"
            animate={{ rotate: 360 }}
            transition={spinnerTransition}
          />
          <motion.p
            className="text-muted-foreground"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={pulseTransition}
          >
            {UI_STRINGS.COMMON.LOADING_APP}
          </motion.p>
        </div>
      </div>
    );
  }

  if (configError === 'corrupted') {
    return <ConfigCorruptionAlert />;
  }

  // Render both onboarding and main app simultaneously for seamless layoutId animation
  // Onboarding is rendered as an overlay that fades out, while main app is always underneath
  return (
    <>
      <LayoutGroup>
        {/* Main app - always rendered, but starts hidden during onboarding */}
        <motion.div
          className="h-full"
          animate={{
            opacity: showMainApp ? 1 : 0,
          }}
          transition={pageTransition}
          style={{
            height: '100%',
            pointerEvents: showMainApp && !isOnboarding ? 'auto' : 'none'
          }}
        >
          {/* Security warning modal */}
          {securityWarning && (
            <SecurityWarningAlert
              security={securityWarning}
              onConfirm={handleSecurityConfirm}
              onReject={handleSecurityReject}
            />
          )}

          {/* Import config dialog */}
          <ImportConfigDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            onImportFromFile={handleImportFromFile}
            onImportFromContent={handleImportFromContent}
          />

          <AppLayout
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onImportConfig={handleImportConfig}
            systemInfo={systemInfo}
            progress={progress}
          >
            <AppRoutes
              currentPage={currentPage}
              systemInfo={systemInfo}
              userConfig={userConfig}
              importedPackages={importedPackages}
              setImportedPackages={setImportedPackages}
              selectedPackages={selectedPackages}
              setSelectedPackages={setSelectedPackages}
              installLogs={installLogs}
              setInstallLogs={setInstallLogs}
              onNavigate={setCurrentPage}
              hasImportedConfig={hasImportedConfig}
              onClearImportedFlag={handleClearImportedFlag}
            />
          </AppLayout>
        </motion.div>

        {/* Onboarding overlay - only rendered during onboarding, fades out when complete */}
        <AnimatePresence>
          {isOnboarding && (
            <>
              {/* Onboarding Background - Fades out independently */}
              <motion.div
                key="onboarding-bg"
                className="fixed inset-0 z-50 bg-background"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
              {/* Onboarding Content - Stays visible during exit for logo morph */}
              <motion.div
                key="onboarding-content"
                className="fixed inset-0 z-50 pointer-events-none"
                initial={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <div className="w-full h-full pointer-events-auto">
                  <OnboardingPage
                    systemInfo={systemInfo}
                    onComplete={handleOnboardingComplete}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </LayoutGroup>
      <Toaster
        theme="dark"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
    </>
  );
}

export default App;
