import React, { useState, useEffect, useRef } from 'react';
import {
  AudioLines,
  Brain,
  ChevronDown,
  Compass,
  Flame,
  LayoutDashboard,
  Mic,
  Settings,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { ApiService, getActiveUserId, setActiveUserId } from '../services/api';
import { SpeechService } from '../services/speech';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSettings: () => void;
  onUserSwitch?: (userId: string) => void;
  userLevel?: string;
}

const SEEDED_USERS = [
  { id: 'usr_sarah_chen', name: 'Dr. Sarah Chen', initials: 'SC', level: 'C1' },
  { id: 'usr_carlos_mendes', name: 'Carlos Mendes', initials: 'CM', level: 'B2' },
  { id: 'usr_kenji_sato', name: 'Kenji Sato', initials: 'KS', level: 'B2' },
  { id: 'usr_elena_rostova', name: 'Elena Rostova', initials: 'ER', level: 'C1' },
  { id: 'usr_marcus_vance', name: 'Marcus Vance', initials: 'MV', level: 'C2' }
];

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scenarios', label: 'Scenarios', icon: Compass },
  { id: 'dna', label: 'My progress', icon: Sparkles },
  { id: 'think_in_english', label: 'Think', icon: Brain },
  { id: 'debate', label: 'Debate', icon: Flame },
  { id: 'presentation', label: 'Keynote', icon: Mic }
];

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  onUserSwitch
}) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(SpeechService.isMuted());
  const [activeUserId, setActiveUserIdState] = useState(getActiveUserId());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ApiService.getServerConfig()
      .then(config => setHasApiKey(config.hasGeminiKey))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelectUser = (userId: string) => {
    setActiveUserId(userId);
    setActiveUserIdState(userId);
    setShowUserMenu(false);
    onUserSwitch?.(userId);
  };

  const activeUser = SEEDED_USERS.find(user => user.id === activeUserId) || SEEDED_USERS[0];

  return (
    <header className="app-header">
      <div className="navbar-inner">
        <button className="navbar-brand" onClick={() => onSelectTab('landing')} aria-label="English Reality home">
          <span className="navbar-brand-mark"><AudioLines size={19} strokeWidth={2.5} /></span>
          <span className="navbar-brand-copy"><strong>English</strong><span>reality</span></span>
        </button>

        <nav className="navbar-links" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`nav-tab-${id}`}
              className={`navbar-link${currentTab === id ? ' active' : ''}`}
              onClick={() => onSelectTab(id)}
              aria-current={currentTab === id ? 'page' : undefined}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="navbar-tools">
          <button
            className={`navbar-icon-button${isVoiceMuted ? '' : ' is-on'}`}
            onClick={() => setIsVoiceMuted(SpeechService.toggleMute())}
            title={isVoiceMuted ? 'Voice muted' : 'Voice active'}
            aria-label={isVoiceMuted ? 'Turn voice on' : 'Mute voice'}
          >
            {isVoiceMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <div className="navbar-user-wrap" ref={menuRef}>
            <button
              id="user-switcher-btn"
              className="navbar-user-button"
              onClick={() => setShowUserMenu(previous => !previous)}
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              <span className="navbar-avatar">{activeUser.initials}</span>
              <span className="navbar-user-copy">
                <strong>{activeUser.name}</strong>
                <small>{activeUser.level} learner</small>
              </span>
              <ChevronDown size={14} className={showUserMenu ? 'rotated' : ''} />
            </button>

            {showUserMenu && (
              <div className="navbar-user-menu" role="menu">
                <span className="navbar-menu-label">Switch learner</span>
                {SEEDED_USERS.map(user => (
                  <button
                    key={user.id}
                    id={`user-${user.id}`}
                    className={`navbar-menu-user${user.id === activeUserId ? ' selected' : ''}`}
                    onClick={() => handleSelectUser(user.id)}
                    role="menuitem"
                  >
                    <span className="navbar-avatar">{user.initials}</span>
                    <span>{user.name}</span>
                    <small>{user.level}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="navbar-icon-button navbar-settings"
            onClick={onOpenSettings}
            title="AI & voice settings"
            aria-label="AI and voice settings"
          >
            <span className={`navbar-status-dot${hasApiKey ? ' ready' : ''}`} />
            <Settings size={17} />
          </button>
        </div>
      </div>
    </header>
  );
};
