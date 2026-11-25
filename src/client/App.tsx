import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ApiKeyModal } from './components/ApiKeyModal';
import { getActiveUserId } from './services/api';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScenarioExplorerPage } from './pages/ScenarioExplorerPage';
import { LiveSimulationPage } from './pages/LiveSimulationPage';
import { DebriefPage } from './pages/DebriefPage';
import { CommunicationDnaPage } from './pages/CommunicationDnaPage';
import { ThinkInEnglishPage } from './pages/ThinkInEnglishPage';
import { DebateArenaPage } from './pages/DebateArenaPage';
import { PresentationCoachPage } from './pages/PresentationCoachPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scen_airport_crisis');
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  // userKey forces re-render of pages when the active user switches
  const [userKey, setUserKey] = useState<string>(getActiveUserId());

  const handleUserSwitch = useCallback((userId: string) => {
    setUserKey(userId);
  }, []);

  const handleStartScenario = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    setCurrentTab('simulation');
  };

  const handleEndSimulation = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setCurrentTab('debrief');
  };

  const handleNextChallenge = (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    setCurrentTab('simulation');
  };

  return (
    <div className="app-container">
      {/* Top Glass Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenSettings={() => setIsApiKeyModalOpen(true)}
        onUserSwitch={handleUserSwitch}
      />

      {/* Main Page Viewports */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {currentTab === 'landing' && (
          <LandingPage
            onEnterReality={() => setCurrentTab('dashboard')}
            onExploreScenarios={() => setCurrentTab('scenarios')}
            onSelectMode={(mode) => setCurrentTab(mode)}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            key={`dashboard-${userKey}`}
            onStartScenario={handleStartScenario}
            onViewDebrief={(sessionId) => {
              setActiveSessionId(sessionId);
              setCurrentTab('debrief');
            }}
            onExploreScenarios={() => setCurrentTab('scenarios')}
            onOpenDna={() => setCurrentTab('dna')}
          />
        )}

        {currentTab === 'scenarios' && (
          <ScenarioExplorerPage
            onSelectScenario={handleStartScenario}
          />
        )}

        {currentTab === 'simulation' && (
          <LiveSimulationPage
            scenarioId={activeScenarioId}
            onEndSimulation={handleEndSimulation}
            onExit={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'debrief' && (
          <DebriefPage
            sessionId={activeSessionId}
            onNextChallenge={handleNextChallenge}
            onReturnDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'dna' && (
          <CommunicationDnaPage
            key={`dna-${userKey}`}
            onStartScenario={handleStartScenario}
            onExploreScenarios={() => setCurrentTab('scenarios')}
          />
        )}

        {currentTab === 'think_in_english' && (
          <ThinkInEnglishPage key={`think-${userKey}`} />
        )}

        {currentTab === 'debate' && (
          <DebateArenaPage key={`debate-${userKey}`} />
        )}

        {currentTab === 'presentation' && (
          <PresentationCoachPage key={`presentation-${userKey}`} />
        )}
      </main>

      {/* Settings / API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
};
