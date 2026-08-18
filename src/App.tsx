import React, { useState, useEffect } from 'react';
import {
  NavigationTab,
  Reciter,
  Recitation,
  RecitationSubmission,
  PlayerState
} from './types';
import {
  reciterRepository,
  recitationRepository,
  submissionRepository
} from './services/Repositories';
import { audioService } from './services/AudioService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HeroSection } from './components/HeroSection';
import { HomeActions } from './components/HomeActions';
import { RecitationCard } from './components/RecitationCard';
import { ReciterCard } from './components/ReciterCard';
import { ReciterProfileModal } from './components/ReciterProfileModal';
import { PlayerBar } from './components/PlayerBar';
import { FullPlayerModal } from './components/FullPlayerModal';
import { SubmitRecitationView } from './components/SubmitRecitationView';
import { SubmissionsListModal } from './components/SubmissionsListModal';
import { FeaturedRecitersView } from './components/FeaturedRecitersView';
import { ListenScreen } from './components/ListenScreen';
import { AboutScreen } from './components/AboutScreen';
import { AndroidArchitectureModal } from './components/AndroidArchitectureModal';
import { AdminControlPanel } from './components/admin/AdminControlPanel';
import { NotificationsModal } from './components/NotificationsModal';
import { UserProfileModal } from './components/UserProfileModal';
import { userService } from './services/UserService';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    try {
      const saved = sessionStorage.getItem('telawat_current_tab');
      if (saved && ['home', 'listen', 'submit', 'featured', 'about'].includes(saved)) {
        return saved as NavigationTab;
      }
    } catch {}
    return 'home';
  });
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [recitations, setRecitations] = useState<Recitation[]>([]);
  const [submissions, setSubmissions] = useState<RecitationSubmission[]>([]);

  // Sync tab with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('telawat_current_tab', currentTab);
    } catch {}
  }, [currentTab]);

  // Modals & Navigation state
  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTabletView, setIsTabletView] = useState(false);
  const [isAdminViewOpen, setIsAdminViewOpen] = useState<boolean>(
    typeof window !== 'undefined' && window.location.hash === '#admin'
  );

  // Global Player State
  const [playerState, setPlayerState] = useState<PlayerState>(audioService.getState());

  // Load initial data from Clean Architecture Repositories
  const loadData = async () => {
    try {
      const [allReciters, allRecitations, allSubmissions] = await Promise.all([
        reciterRepository.getAllReciters(),
        recitationRepository.getAllRecitations(),
        submissionRepository.getUserSubmissions()
      ]);
      setReciters(allReciters);
      setRecitations(allRecitations);
      setSubmissions(allSubmissions);
    } catch (e) {
      console.error('Failed to load repositories data:', e);
    }
  };

  useEffect(() => {
    loadData();
    userService.syncWithRemoteProfile();
    userService.fetchRemoteNotifications();
  }, []);

  // Listen to AudioService state changes & MediaSession updates
  useEffect(() => {
    const unsubscribe = audioService.subscribe((state) => {
      setPlayerState({ ...state });
    });
    return () => unsubscribe();
  }, []);

  // URL Hash listener for direct admin panel access
  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminViewOpen(window.location.hash === '#admin');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Audio Control Handlers
  const handlePlayRecitation = async (recitation: Recitation) => {
    if (playerState.currentRecitation?.id === recitation.id) {
      audioService.togglePlayPause();
    } else {
      await audioService.playRecitation(recitation, recitations);
    }
  };

  const handleTogglePlay = () => {
    audioService.togglePlayPause();
  };

  const handleNext = () => {
    audioService.playNext();
  };

  const handlePrevious = () => {
    audioService.playPrevious();
  };

  const handleSeek = (seconds: number) => {
    audioService.seek(seconds);
  };

  const handleLikeToggle = async (recitationId: string) => {
    try {
      const installId = userService.getInstallationId();
      const result = await recitationRepository.toggleLike(recitationId, installId);
      setRecitations((prev) =>
        prev.map((r) => {
          if (r.id === recitationId) {
            return {
              ...r,
              isLiked: result.isLiked,
              likeCount: result.likeCount
            };
          }
          return r;
        })
      );
    } catch (e) {
      console.error('Failed to toggle like:', e);
    }
  };

  const handleSelectReciter = (reciter: Reciter) => {
    setSelectedReciter(reciter);
  };

  const handleSelectReciterById = (reciterId: string) => {
    const found = reciters.find((r) => r.id === reciterId);
    if (found) {
      setSelectedReciter(found);
    }
  };

  const handleSubmitRecitation = async (
    data: Omit<RecitationSubmission, 'id' | 'submittedAt' | 'status'>
  ): Promise<RecitationSubmission> => {
    const newSubmission = await submissionRepository.submitRecitation(data);
    setSubmissions((prev) => [newSubmission, ...prev]);
    return newSubmission;
  };

  // Dedicated Admin Screen (Pure standalone view, no home bleed)
  if (isAdminViewOpen) {
    return (
      <AdminControlPanel
        onBackToApp={() => {
          setIsAdminViewOpen(false);
          window.location.hash = '';
          loadData();
        }}
        onClose={() => {
          setIsAdminViewOpen(false);
          window.location.hash = '';
          loadData();
        }}
        onDataChanged={() => {
          loadData();
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#F6FBFF] text-[#193B4D] flex flex-col font-tajawal ${
        isTabletView ? 'max-w-4xl mx-auto border-x border-[#D8E8F2] shadow-2xl my-4 rounded-3xl overflow-hidden' : ''
      }`}
      dir="rtl"
    >
      {/* Universal Header */}
      <Header
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenAdmin={() => {
          setIsAdminViewOpen(true);
          window.location.hash = 'admin';
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24">
        {/* Tab 1: الرئيسية (Home) */}
        {currentTab === 'home' && (
          <div className="space-y-6">
            {/* 1. Hero Banner with Announcements/Competitions above & Big Welcome Box */}
            <HeroSection
              onExploreClick={() => setCurrentTab('listen')}
              onSubmitClick={() => setCurrentTab('submit')}
            />

            {/* 2. Main Action Cards in 2 Columns with Animated Icons */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base sm:text-lg text-[#145273] font-amiri flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F2C96B]" />
                  <span>الخدمات والأقسام الرئيسية</span>
                </h3>
              </div>
              <HomeActions onNavigate={(tab) => setCurrentTab(tab)} />
            </section>
          </div>
        )}

        {/* Tab 2: استمع إلى القراء (Listen / Discovery) */}
        {currentTab === 'listen' && (
          <ListenScreen
            recitations={recitations}
            reciters={reciters}
            playerState={playerState}
            onPlay={handlePlayRecitation}
            onLikeToggle={handleLikeToggle}
            onSelectReciter={handleSelectReciter}
          />
        )}

        {/* Tab 3: انشر تلاوتك (Submit Recitation) */}
        {currentTab === 'submit' && (
          <SubmitRecitationView
            onSubmit={handleSubmitRecitation}
            onViewSubmissions={() => setIsSubmissionsModalOpen(true)}
            submissionsCount={submissions.length}
          />
        )}

        {/* Tab 4: القراء ولوحة الشرف (Featured Reciters & Honors) */}
        {currentTab === 'featured' && (
          <FeaturedRecitersView
            reciters={reciters}
            recitations={recitations}
            playerState={playerState}
            onSelectReciter={handleSelectReciter}
            onPlay={handlePlayRecitation}
            onLikeToggle={handleLikeToggle}
          />
        )}

        {/* Tab 5: عن المنصة (About) */}
        {currentTab === 'about' && (
          <AboutScreen
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
          />
        )}
      </main>

      {/* Persistent Mini Audio Player Bar */}
      <PlayerBar
        playerState={playerState}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={handleSeek}
        onLikeToggle={handleLikeToggle}
        onExpand={() => setIsPlayerExpanded(true)}
        onClose={() => audioService.stop()}
      />

      {/* Full Player Modal */}
      {isPlayerExpanded && (
        <FullPlayerModal
          playerState={playerState}
          onClose={() => setIsPlayerExpanded(false)}
          onTogglePlay={handleTogglePlay}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSeek={handleSeek}
          onLikeToggle={handleLikeToggle}
          onReciterClick={(reciterId) => {
            setIsPlayerExpanded(false);
            handleSelectReciterById(reciterId);
          }}
        />
      )}

      {/* Reciter Profile Full Modal */}
      {selectedReciter && (
        <ReciterProfileModal
          reciter={selectedReciter}
          recitations={recitations.filter((r) => r.reciterId === selectedReciter.id)}
          playerState={playerState}
          onClose={() => setSelectedReciter(null)}
          onPlay={handlePlayRecitation}
          onLikeToggle={handleLikeToggle}
        />
      )}

      {/* User Submissions History Modal */}
      {isSubmissionsModalOpen && (
        <SubmissionsListModal
          submissions={submissions}
          onClose={() => setIsSubmissionsModalOpen(false)}
        />
      )}

      {/* Android/Media3/Compose Architecture Modal */}
      {isArchitectureModalOpen && (
        <AndroidArchitectureModal
          onClose={() => setIsArchitectureModalOpen(false)}
        />
      )}

      {/* Complete Admin Control Panel Modal / Full View */}
      {isAdminViewOpen && (
        <AdminControlPanel
          onBackToApp={() => {
            setIsAdminViewOpen(false);
            window.location.hash = '';
            loadData(); // Refresh app data upon closing admin panel
          }}
          onClose={() => {
            setIsAdminViewOpen(false);
            window.location.hash = '';
            loadData();
          }}
          onDataChanged={() => {
            loadData();
          }}
        />
      )}

      {/* User Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (isAdminViewOpen) {
            setIsAdminViewOpen(false);
            window.location.hash = '';
          }
        }}
      />
    </div>
  );
}
