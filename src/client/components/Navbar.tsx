import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  LayoutDashboard,
  Mic,
  Settings,
  Sparkles,
  Zap,
  Flame,
  ChevronDown,
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
  { id: 'usr_sarah_chen',    name: 'Dr. Sarah Chen',   initials: 'SC', level: 'C1' },
  { id: 'usr_carlos_mendes', name: 'Carlos Mendes',    initials: 'CM', level: 'B2' },
  { id: 'usr_kenji_sato',    name: 'Kenji Sato',       initials: 'KS', level: 'B2' },
  { id: 'usr_elena_rostova', name: 'Elena Rostova',    initials: 'ER', level: 'C1' },
  { id: 'usr_marcus_vance',  name: 'Marcus Vance',     initials: 'MV', level: 'C2' },
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
      .then(cfg => setHasApiKey(cfg.hasGeminiKey))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

  const activeUser = SEEDED_USERS.find(u => u.id === activeUserId) || SEEDED_USERS[0];

  const navItems = [
    { id: 'dashboard',        label: 'Dashboard',   icon: LayoutDashboard },
    { id: 'scenarios',        label: 'Scenarios',   icon: Compass },
    { id: 'dna',              label: 'DNA',         icon: Sparkles },
    { id: 'think_in_english', label: 'Think',       icon: Zap },
    { id: 'debate',           label: 'Debate',      icon: Flame },
    { id: 'presentation',     label: 'Keynote',     icon: Mic },
  ];

  return (
    <nav style={{
      background: '#0C0C0C',
      borderBottom: '1px solid #2A2A2A',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.75rem',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        height: '52px',
        gap: '1rem'
      }}>

        {/* Wordmark */}
        <div
          onClick={() => onSelectTab('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            flexShrink: 0,
            borderRight: '1px solid #2A2A2A',
            paddingRight: '1.5rem',
            marginRight: '0.5rem'
          }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            background: '#FF5C2B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.7rem',
            color: '#0C0C0C',
            letterSpacing: '0.04em',
            flexShrink: 0
          }}>
            ER
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.9rem',
            letterSpacing: '0.06em',
            color: '#F5F5F0',
            textTransform: 'uppercase'
          }}>
            English Reality
          </span>
        </div>

        {/* Nav Tabs */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '0', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0 1rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: isActive ? '#FF5C2B' : '#555555',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #FF5C2B' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#8C8C8C';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#555555';
                }}
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>

          {/* Voice toggle */}
          <button
            onClick={() => {
              const muted = SpeechService.toggleMute();
              setIsVoiceMuted(muted);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0 0.85rem',
              height: '100%',
              background: 'transparent',
              border: 'none',
              borderLeft: '1px solid #2A2A2A',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: isVoiceMuted ? '#555555' : '#FF5C2B',
              transition: 'color 0.12s ease',
            }}
            title={isVoiceMuted ? 'Voice muted' : 'Voice active'}
          >
            {isVoiceMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span>{isVoiceMuted ? 'Muted' : 'Voice'}</span>
          </button>

          {/* User switcher */}
          <div ref={menuRef} style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
            <button
              id="user-switcher-btn"
              onClick={() => setShowUserMenu(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0 0.85rem',
                height: '100%',
                background: 'transparent',
                border: 'none',
                borderLeft: '1px solid #2A2A2A',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-body)',
                color: '#F5F5F0',
              }}
            >
              <span style={{
                width: '22px',
                height: '22px',
                background: '#FF5C2B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#0C0C0C',
                fontFamily: 'var(--font-mono)',
                flexShrink: 0
              }}>
                {activeUser.initials}
              </span>
              <span style={{ fontWeight: 600, maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeUser.name}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#FF5C2B', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {activeUser.level}
              </span>
              <ChevronDown size={11} color="#555555" style={{
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.12s'
              }} />
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: '#0C0C0C',
                border: '1px solid #2A2A2A',
                borderRadius: 0,
                minWidth: '210px',
                zIndex: 9999,
              }}>
                <div style={{
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: '#555555',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderBottom: '1px solid #2A2A2A'
                }}>
                  Speaker Profiles
                </div>
                {SEEDED_USERS.map(user => (
                  <button
                    key={user.id}
                    id={`user-${user.id}`}
                    onClick={() => handleSelectUser(user.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: user.id === activeUserId ? '#141414' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #1E1E1E',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#141414'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = user.id === activeUserId ? '#141414' : 'transparent'; }}
                  >
                    <span style={{
                      width: '22px',
                      height: '22px',
                      background: user.id === activeUserId ? '#FF5C2B' : '#1E1E1E',
                      color: user.id === activeUserId ? '#0C0C0C' : '#555555',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      flexShrink: 0
                    }}>
                      {user.initials}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: user.id === activeUserId ? 600 : 400,
                        color: user.id === activeUserId ? '#F5F5F0' : '#8C8C8C'
                      }}>
                        {user.name}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#FF5C2B', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {user.level}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0 0.85rem',
              height: '100%',
              background: 'transparent',
              border: 'none',
              borderLeft: '1px solid #2A2A2A',
              cursor: 'pointer',
              color: '#555555',
              transition: 'color 0.12s ease',
            }}
            title="AI & Voice Settings"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F5F5F0'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#555555'; }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              background: hasApiKey ? '#FF5C2B' : '#FF4040',
              display: 'inline-block',
              flexShrink: 0
            }} />
            <Settings size={14} />
          </button>
        </div>
      </div>
    </nav>
  );
};
