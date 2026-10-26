'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, subscribeUserProjects, loginAnonymously, SavedProject } from '@/lib/firebase';

export type ThemeType = 'dark' | 'light' | 'cyber' | 'clay' | 'emerald';

export interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
  isOnline: boolean;
  mounted: boolean;
  user: User | null;
  userProjects: SavedProject[];
  activeNav: number;
  setActiveNav: (nav: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeWizardTool: string | null;
  setActiveWizardTool: (tool: string | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isAssistantOpen: boolean;
  setIsAssistantOpen: (open: boolean) => void;
  isProjectsDrawerOpen: boolean;
  setIsProjectsDrawerOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({
  children,
  initialActiveNav = 0,
}: {
  children: React.ReactNode;
  initialActiveNav?: number;
}) {
  // Static default for initial SSR & CSR pass to guarantee hydration match
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  const [user, setUser] = useState<User | null>(null);
  const [userProjects, setUserProjects] = useState<SavedProject[]>([]);
  const [activeNav, setActiveNav] = useState<number>(initialActiveNav);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeWizardTool, setActiveWizardTool] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [isProjectsDrawerOpen, setIsProjectsDrawerOpen] = useState<boolean>(false);

  // Restore client theme and network state asynchronously post-hydration pass
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true);
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('utility_hub_theme') as ThemeType;
        if (savedTheme) {
          setThemeState(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setThemeState('dark');
        }
        setIsOnline(navigator.onLine);
        if (window.location.pathname.includes('/tools/video-to-gif')) {
          setActiveNav(3);
        } else if (window.location.pathname.includes('/tools/background-remover')) {
          setActiveNav(4);
        } else if (window.location.pathname.includes('/tools/image-to-prompt')) {
          setActiveNav(5);
        }
      }
    });

    return () => cancelAnimationFrame(timer);
  }, []);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('utility_hub_theme', newTheme);
    }
  };

  // Sync body class and root dark class whenever theme changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.className = `theme-${theme} min-h-screen antialiased selection:bg-purple-500 selection:text-white overflow-hidden`;
      const darkActive = theme === 'dark' || theme === 'cyber' || theme === 'emerald';
      document.documentElement.classList.toggle('dark', darkActive);
    }
  }, [theme]);

  // Track online / offline status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Track Firebase Auth state & subscribe to Cloud Firestore projects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const unsubProjects = subscribeUserProjects(currentUser.uid, (projects) => {
          setUserProjects(projects);
        });
        return () => unsubProjects();
      } else {
        setUserProjects([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const isDark = theme === 'dark' || theme === 'cyber' || theme === 'emerald';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        isOnline,
        mounted,
        user,
        userProjects,
        activeNav,
        setActiveNav,
        searchQuery,
        setSearchQuery,
        activeWizardTool,
        setActiveWizardTool,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isAssistantOpen,
        setIsAssistantOpen,
        isProjectsDrawerOpen,
        setIsProjectsDrawerOpen,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
