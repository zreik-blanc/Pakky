import { useState, useEffect, useCallback } from 'react';
import { useInstallStore } from './stores/installStore';
import { systemAPI, configAPI, userConfigAPI } from './lib/electron';
import type { Platform, SystemInfo, PakkyConfig, PackageInstallItem } from './lib/types';
import './index.css';

// Components
import AppLayout from '@/components/layout/AppLayout';
import HomePage from './pages/Home';
import PresetsPage from '@/pages/Presets';
import SettingsPage from '@/pages/Settings';
import OnboardingPage from '@/pages/Onboarding';
import { ConfigCorruptionAlert } from '@/components/alerts/ConfigCorruptionAlert';

type Page = 'home' | 'presets' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [importedPackages, setImportedPackages] = useState<PackageInstallItem[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<PackageInstallItem[]>([]);
  const [installLogs, setInstallLogs] = useState<Record<string, string[]>>({});
  const { progress } = useInstallStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. Get System Info
        const info = await systemAPI.getSystemInfo();
        const sysInfo = {
          platform: info.platform as Platform,
          arch: info.arch,
          version: info.version,
          homeDir: info.homeDir,
          hostname: info.hostname,
        };
        setSystemInfo(sysInfo);

        // 2. Check User Config (Onboarding Status)
        const userConfig = await userConfigAPI.read();

        if (!userConfig) {
          setIsOnboarding(true);
        } else {
          // Update last seen
          await userConfigAPI.save({
            userName: userConfig.userName,
            systemInfo: sysInfo
          });
        }
      } catch (error: unknown) {
        console.error('Failed to initialize app:', error);

        if (error instanceof Error && error.message.includes('CONFIG_CORRUPTED')) {
          setConfigError('corrupted');
          setIsLoading(false);
          return;
        }

        // Fallback for development if everything fails
        setSystemInfo({
          platform: 'macos',
          arch: 'arm64',
          version: '14.0',
          homeDir: '/Users/dev',
          hostname: 'dev-machine',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

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
        onComplete={() => setIsOnboarding(false)}
      />
    );
  }

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onImportConfig={handleImportConfig}
      systemInfo={systemInfo}
      progress={progress}
    >
      {currentPage === 'home' && (
        <HomePage
          systemInfo={systemInfo}
          importedPackages={importedPackages}
          onClearImported={() => setImportedPackages([])}
          selectedPackages={selectedPackages}
          setSelectedPackages={setSelectedPackages}
          installLogs={installLogs}
          setInstallLogs={setInstallLogs}
          onNavigateToPresets={() => setCurrentPage('presets')}
        />
      )}
      {currentPage === 'presets' && (
        <PresetsPage
          onLoadPreset={(packages) => {
            setSelectedPackages(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newPackages = packages.filter(p => !existingIds.has(p.id));
              return [...prev, ...newPackages];
            });
            setCurrentPage('home');
          }}
        />
      )}
      {currentPage === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}

export default App;

