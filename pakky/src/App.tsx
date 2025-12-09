import { useState, useCallback, useEffect, useRef } from 'react';
import { useInstallStore } from './stores/installStore';
import { configAPI, userConfigAPI } from './lib/electron';
import type { PakkyConfig, PackageInstallItem } from './lib/types';
import './index.css';

// Components
import AppLayout from '@/components/layout/AppLayout';
import OnboardingPage from '@/pages/Onboarding';
import { ConfigCorruptionAlert } from '@/components/alerts/ConfigCorruptionAlert';
import { AppRoutes } from '@/components/AppRoutes';
import { useAppInitialization } from '@/hooks/useAppInitialization';

type Page = 'home' | 'presets' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [importedPackages, setImportedPackages] = useState<PackageInstallItem[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<PackageInstallItem[]>([]);
  const [installLogs, setInstallLogs] = useState<Record<string, string[]>>({});
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
      console.log('Restoring queue from user config:', userConfig.queue.length, 'packages');
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

      const config: PakkyConfig = await configAPI.loadConfig(filePath);

      // Convert config to packages
      const packages: PackageInstallItem[] = [];

      // Parse macOS homebrew packages
      if (config.macos?.homebrew) {
        // Add formulae
        if (config.macos.homebrew.formulae) {
          for (const pkg of config.macos.homebrew.formulae) {
            const name = typeof pkg === 'string' ? pkg : pkg.name;
            const description = typeof pkg === 'string' ? undefined : pkg.description;
            packages.push({
              id: `formula:${name}`,
              name,
              type: 'formula',
              status: 'pending',
              description: description || 'CLI tool',
              logs: [],
            });
          }
        }

        // Add casks
        if (config.macos.homebrew.casks) {
          for (const pkg of config.macos.homebrew.casks) {
            const name = typeof pkg === 'string' ? pkg : pkg.name;
            const description = typeof pkg === 'string' ? undefined : pkg.description;
            packages.push({
              id: `cask:${name}`,
              name,
              type: 'cask',
              status: 'pending',
              description: description || 'Application',
              logs: [],
            });
          }
        }
      }

      setImportedPackages(packages);
      setCurrentPage('home'); // Navigate to home to show imported packages
      console.log('Imported', packages.length, 'packages from config');
    } catch (error) {
      console.error('Failed to import config:', error);
    }
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
        />
      </AppLayout>
    </div>
  );
}

export default App;
