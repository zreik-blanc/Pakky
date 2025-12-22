import { useState, useCallback } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { Toaster } from 'sonner';
import { useInstallStore } from './stores/installStore';
import { pageTransition } from './lib/animations';
import './index.css';

// Components
import AppLayout from '@/components/layout/AppLayout';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { OnboardingOverlay } from '@/components/layout/OnboardingOverlay';
import { ConfigCorruptionAlert } from '@/components/alerts/ConfigCorruptionAlert';
import { SecurityWarningAlert } from '@/components/alerts/SecurityWarningAlert';
import { AppRoutes } from '@/components/AppRoutes';
import { ImportConfigDialog } from '@/components/import/ImportConfigDialog';

// Hooks
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useConfigImport } from '@/hooks/useConfigImport';

type Page = 'home' | 'presets' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
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

  // Navigate to home after successful import
  const handleImportSuccess = useCallback(() => {
    setCurrentPage('home');
  }, []);

  const {
    showImportDialog,
    securityWarning,
    openImportDialog,
    closeImportDialog,
    handleImportFromFile,
    handleImportFromContent,
    handleSecurityConfirm,
    handleSecurityReject,
  } = useConfigImport(handleImportSuccess);

  // Show loading screen during initialization
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show corruption alert if config is corrupted
  if (configError === 'corrupted') {
    return <ConfigCorruptionAlert />;
  }

  return (
    <>
      <LayoutGroup>
        {/* Main app - always rendered, but starts hidden during onboarding */}
        <motion.div
          className="h-full"
          animate={{ opacity: showMainApp ? 1 : 0 }}
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
            onOpenChange={(open) => !open && closeImportDialog()}
            onImportFromFile={handleImportFromFile}
            onImportFromContent={handleImportFromContent}
          />

          <AppLayout
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            onImportConfig={openImportDialog}
            systemInfo={systemInfo}
            progress={progress}
          >
            <AppRoutes
              currentPage={currentPage}
              systemInfo={systemInfo}
              userConfig={userConfig}
              onNavigate={setCurrentPage}
            />
          </AppLayout>
        </motion.div>

        {/* Onboarding overlay */}
        <OnboardingOverlay
          isOnboarding={isOnboarding}
          systemInfo={systemInfo}
          onComplete={handleOnboardingComplete}
        />
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
