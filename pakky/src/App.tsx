import { useState, useCallback, useEffect, useRef } from 'react';
import { useInstallStore } from './stores/installStore';
import { configAPI, userConfigAPI, type SecurityScanResult } from './lib/electron';
import type { PackageInstallItem } from './lib/types';
import { parseConfig } from './lib/configParser';
import './index.css';

// Components
import AppLayout from '@/components/layout/AppLayout';
import OnboardingPage from '@/pages/Onboarding';
import { ConfigCorruptionAlert } from '@/components/alerts/ConfigCorruptionAlert';
import { SecurityWarningAlert } from '@/components/alerts/SecurityWarningAlert';
import { AppRoutes } from '@/components/AppRoutes';
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
        // Merge with any existing (rare, but good for safety)
        const existingIds = new Set(prev.map(p => p.id));
        const restored = userConfig.queue!.filter(p => !existingIds.has(p.id));
        return [...prev, ...restored];
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

  // Handle config import
  const handleImportConfig = useCallback(async () => {
    try {
      const filePath = await configAPI.selectConfigFile();
      if (!filePath) return;

      const { config, security } = await configAPI.loadConfig(filePath);

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
      setHasImportedConfig(true); // Mark that we have imported packages
      setCurrentPage('home'); // Navigate to home to show imported packages
    } catch (error) {
      console.error('Failed to import config:', error);
    }
  }, []);

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
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground animate-pulse">Loading Pakky...</p>
        </div>
      </div>
    );
  }

  if (configError === 'corrupted') {
    return <ConfigCorruptionAlert />;
  }

  if (isOnboarding) {
    return (
      <OnboardingPage
        systemInfo={systemInfo}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return (
    <div
      className={`transition-all duration-500 ease-out ${showMainApp ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
        }`}
      style={{ height: '100%' }}
    >
      {/* Security warning modal */}
      {securityWarning && (
        <SecurityWarningAlert
          security={securityWarning}
          onConfirm={handleSecurityConfirm}
          onReject={handleSecurityReject}
        />
      )}

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
    </div>
  );
}

export default App;
