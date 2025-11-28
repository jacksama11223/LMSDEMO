import React, { useContext, useMemo, useEffect, useState } from 'react';
import {
  AuthContext, DataContext, GlobalStateContext, PageContext,
  AuthProvider, DataProvider, GlobalStateProvider, PageProvider
} from './contexts/AppProviders';
import { useFeatureFlag } from './hooks/useAppHooks';
import AuthPage from './components/auth/AuthPage';
import LockoutScreen from './components/auth/LockoutScreen';
import NotificationBell from './components/common/NotificationBell';
import GlobalStyles from './components/common/GlobalStyles';
import GeminiAPIKeyModal from './components/modals/GeminiAPIKeyModal';
import StudentDashboardPage from './components/pages/StudentDashboardPage';
import TeacherDashboardPage from './components/pages/TeacherDashboardPage';
import AdminDashboardPage from './components/pages/AdminDashboardPage';
import CourseDetailPage from './components/pages/CourseDetailPage';
import LessonPage from './components/pages/LessonPage';
import AssignmentHubPage from './components/pages/AssignmentHubPage';
import AssignmentCreatorPage from './components/pages/AssignmentCreatorPage';
import AssignmentViewerPage from './components/pages/AssignmentViewerPage';
import GradebookPage from './components/pages/GradebookPage';
import ChatPage from './components/pages/ChatPage';
import GroupChatPage from './components/pages/GroupChatPage';
import GeminiTeacherPage from './components/pages/GeminiTeacherPage';
import GeminiStudentPage from './components/pages/GeminiStudentPage';
import ApiKeyPage from './components/pages/ApiKeyPage';
import AdminResiliencePage from './components/pages/AdminResiliencePage';
import DeploymentPage from './components/pages/DeploymentPage';
import SecurityPage from './components/pages/SecurityPage';
import LearningPathCreatorPage from './components/pages/LearningPathCreatorPage';
import LearningPathDetailPage from './components/pages/LearningPathDetailPage';
import LearningNodeStudyPage from './components/pages/LearningNodeStudyPage';
import OnboardingTour, { TourStep } from './components/common/OnboardingTour';

// --- Floating Cloud Sidebar ---
const Sidebar: React.FC = () => {
  const { user } = useContext(AuthContext)!;
  const { page, navigate } = useContext(PageContext)!;
  const { serviceStatus } = useContext(GlobalStateContext)!;

  const isChatEnabled = useFeatureFlag('v2_chat');
  const isGroupsEnabled = useFeatureFlag('v5_groups');

  const navItems = useMemo(() => {
    let baseItems: { id: string; name: string; icon: string }[] = [];
    const isAiOk = serviceStatus.ai_tutor_service === 'OPERATIONAL' || serviceStatus.ai_assistant_service === 'OPERATIONAL';

    if (user?.role === 'STUDENT') {
      baseItems = [
        { id: 'dashboard', name: 'Trạm Vũ Trụ', icon: '🪐' },
        { id: 'assignment_hub', name: 'Cây Tri Thức', icon: '🌳' },
        ...(isAiOk ? [{ id: 'gemini_student', name: 'Nhà Tiên Tri', icon: '🔮' }] : []),
      ];
      if (isChatEnabled) baseItems.push({ id: 'chat', name: 'Liên lạc', icon: '📡' });
      if (isGroupsEnabled) baseItems.push({ id: 'group_chat', name: 'Phi đội', icon: '🪁' });
    } else if (user?.role === 'TEACHER') {
       baseItems = [
        { id: 'dashboard', name: 'Đài Chỉ Huy', icon: '🔭' },
        { id: 'assignment_hub', name: 'Lớp Học', icon: '📚' },
        ...(isAiOk ? [{ id: 'gemini_teacher', name: 'Trợ Lý Ảo', icon: '🤖' }] : []),
      ];
    } else if (user?.role === 'ADMIN') {
       baseItems = [
        { id: 'dashboard', name: 'QA Hub', icon: '🎛️' },
        { id: 'admin_resilience', name: 'Hệ thống', icon: '🔧' },
        { id: 'deployment', name: 'Deploy', icon: '🚀' },
        { id: 'security', name: 'An ninh', icon: '🛡️' },
      ];
    }
    if (isAiOk) baseItems.push({ id: 'api_key', name: 'Key', icon: '🔑' });
    return baseItems;
  }, [user?.role, serviceStatus, isChatEnabled, isGroupsEnabled]);

  return (
    <aside id="main-sidebar" className="fixed left-6 top-1/2 transform -translate-y-1/2 w-20 flex flex-col items-center py-6 z-50">
      {/* Floating Glass Pill Background */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.1)] -z-10"></div>
      
      <div className="mb-6 animate-float">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-2xl shadow-lg border-2 border-white/30">
          🌌
        </div>
      </div>
      
      <div className="flex-1 w-full flex flex-col items-center space-y-6 px-2 justify-center">
        {navItems.map(item => {
           const isActive = page === item.id;
           return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => navigate(item.id)}
              className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                isActive 
                  ? 'bg-white text-blue-600 shadow-[0_0_20px_rgba(255,255,255,0.6)] scale-110' 
                  : 'text-white/70 hover:bg-white/20 hover:text-white hover:scale-110'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              
              {/* Cloud Tooltip */}
              <div className="absolute left-full ml-5 px-4 py-2 bg-white/90 text-blue-900 font-bold text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none backdrop-blur-sm transform scale-90 group-hover:scale-100 origin-left">
                {item.name}
                <div className="absolute left-0 top-1/2 -ml-1.5 -mt-1.5 w-3 h-3 bg-white/90 transform rotate-45"></div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
         <div id="user-avatar" className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 border-2 border-white/50 flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-help" title={user?.name}>
            {user?.name.charAt(0)}
         </div>
      </div>
    </aside>
  );
};

const Header: React.FC = () => {
  const { logout, user } = useContext(AuthContext)!;
  const { setPage: setGlobalPage } = useContext(GlobalStateContext)!;

  return (
    <header className="fixed top-6 right-8 left-32 h-16 flex items-center justify-between z-40 pointer-events-none">
      <div className="pointer-events-auto px-6 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
          <h2 className="text-blue-100 text-sm font-bold tracking-widest uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            LMS STARLINK <span className="text-pink-300">//</span> {user?.role}
          </h2>
      </div>
      <div className="flex items-center space-x-4 pointer-events-auto">
        <button id="header-settings" onClick={() => setGlobalPage('api_key', { isApiKeyModalOpen: true })} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all">
           <span className="text-lg">⚙️</span>
        </button>
        <div id="header-notif" className="pointer-events-auto"><NotificationBell /></div>
        <button onClick={logout} className="btn btn-danger text-xs px-6 py-2 rounded-full shadow-lg">
          THOÁT
        </button>
      </div>
    </header>
  );
};

const PageRouter: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { page, params } = useContext(PageContext)!;

    const PageComponent = useMemo(() => {
      if (!user) return StudentDashboardPage;
      switch (page) {
        case 'dashboard': return user.role === 'STUDENT' ? StudentDashboardPage : user.role === 'TEACHER' ? TeacherDashboardPage : AdminDashboardPage;
        case 'course_detail': return () => <CourseDetailPage courseId={params.courseId} />;
        case 'lesson': return () => <LessonPage lessonId={params.lessonId} />;
        case 'assignment_hub': return AssignmentHubPage;
        case 'chat': return ChatPage;
        case 'api_key': return ApiKeyPage;
        case 'assignment_viewer': return () => <AssignmentViewerPage assignmentId={params.assignmentId} />;
        case 'group_chat': return GroupChatPage;
        case 'gemini_student': return GeminiStudentPage;
        case 'assignment_creator': return () => <AssignmentCreatorPage type={params.type} />;
        case 'gradebook': return () => <GradebookPage assignmentId={params.assignmentId} />;
        case 'gemini_teacher': return GeminiTeacherPage;
        case 'admin_resilience': return AdminResiliencePage;
        case 'deployment': return DeploymentPage;
        case 'security': return SecurityPage;
        case 'learning_path_creator': return LearningPathCreatorPage;
        case 'learning_path_detail': return () => <LearningPathDetailPage pathId={params.pathId} />;
        case 'learning_node_study': return () => <LearningNodeStudyPage pathId={params.pathId} nodeId={params.nodeId} isLastNode={params.isLastNode} />;
        default: return StudentDashboardPage;
      }
    }, [page, user, params]);
  
    return <PageComponent />;
};

const AppLayout: React.FC = () => {
  const { user } = useContext(AuthContext)!;
  const { page: globalPage, pageParams: globalPageParams } = useContext(GlobalStateContext)!;
  const { completeOnboarding } = useContext(DataContext)!;
  const { navigate } = useContext(PageContext)!;

  const isApiKeyModalOpen = useMemo(() => globalPage === 'api_key' && globalPageParams?.isApiKeyModalOpen, [globalPage, globalPageParams]);

  const [isTourOpen, setIsTourOpen] = useState(false);

  // Define Tour Steps
  const tourSteps: TourStep[] = useMemo(() => [
      { 
          targetId: 'main-sidebar', 
          title: 'Thanh Điều Hướng', 
          content: 'Đây là trung tâm điều khiển. Bạn có thể truy cập mọi tính năng từ đây: Trạm Vũ Trụ, Cây Tri Thức, Nhà Tiên Tri AI, v.v.', 
          position: 'right' 
      },
      { 
          targetId: 'dashboard-hero', 
          title: 'Trạm Vũ Trụ', 
          content: 'Chào mừng bạn trở lại! Nơi đây hiển thị tổng quan hành trình của bạn và lối tắt để tiếp tục học ngay lập tức.', 
          position: 'bottom' 
      },
      { 
          targetId: 'course-list', 
          title: 'Các Điểm Đến', 
          content: 'Danh sách các khóa học bạn đang tham gia. Mỗi khóa học là một hành tinh mới chờ bạn khám phá.', 
          position: 'right' 
      },
      { 
          targetId: 'treasure-chest', 
          title: 'Kho Báu', 
          content: 'Nơi lưu giữ thành tích của bạn: XP, Kim Cương và các vật phẩm đã mua. Hãy học tập chăm chỉ để làm giàu kho báu nhé!', 
          position: 'left' 
      },
      { 
          targetId: 'btn-portal-ai', 
          title: 'Nhà Tiên Tri AI', 
          content: 'Gặp khó khăn? Hãy hỏi Nhà Tiên Tri Gemini. Bạn có thể chọn nhiều tính cách khác nhau để được hướng dẫn.', 
          position: 'left' 
      },
      { 
          targetId: 'nav-group_chat', 
          title: 'Phi Đội (Mới)', 
          content: 'Tính năng mới! Tạo hoặc tham gia các nhóm học tập (Spaceship) để cùng bạn bè chinh phục thử thách.', 
          position: 'right' 
      },
      { 
          targetId: 'header-settings', 
          title: 'Cài Đặt', 
          content: 'Đừng quên cấu hình API Key tại đây để sử dụng các tính năng AI mạnh mẽ nhất.', 
          position: 'bottom' 
      },
  ], []);

  useEffect(() => {
      if (user && !user.hasSeenOnboarding && user.role === 'STUDENT') {
          // Delay slightly to ensure rendering
          const timer = setTimeout(() => setIsTourOpen(true), 1000);
          return () => clearTimeout(timer);
      }
  }, [user]);

  const handleTourComplete = () => {
      if (user) {
          completeOnboarding(user.id);
          setIsTourOpen(false);
      }
  };

  return (
    <div className="min-h-screen relative text-gray-100 overflow-hidden font-sans">
       {/* Dynamic Sky Background */}
       <div className="sky-bg"></div>
       <div className="clouds-container">
            <div className="cloud w-[300px] h-[300px] top-[10%] left-[-20%] opacity-40 duration-[60s]"></div>
            <div className="cloud w-[500px] h-[500px] top-[40%] left-[-10%] opacity-30 duration-[80s]"></div>
            <div className="cloud w-[400px] h-[400px] bottom-[10%] right-[-10%] opacity-40 duration-[70s]"></div>
       </div>

       <Sidebar />
       <Header />
       
       <main className="pl-36 pr-8 pt-28 pb-12 min-h-screen relative z-10 transition-all duration-500">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
             <PageRouter />
          </div>
       </main>
       
       <GeminiAPIKeyModal isOpen={isApiKeyModalOpen} onClose={() => navigate('dashboard')} />
       
       {/* Onboarding Tour */}
       <OnboardingTour 
            steps={tourSteps} 
            isOpen={isTourOpen} 
            onComplete={handleTourComplete}
            onSkip={handleTourComplete}
       />
    </div>
  );
};

const AppRoot: React.FC = () => {
  const { user, isLocked } = useContext(AuthContext)!;
  if (isLocked) return <LockoutScreen />;
  if (!user) return <AuthPage />;
  return <AppLayout />;
}

const App: React.FC = () => {
  return (
    <DataProvider>
      <GlobalStateProvider>
        <AuthProvider>
          <PageProvider>
            <GlobalStyles />
            <AppRoot />
          </PageProvider>
        </AuthProvider>
      </GlobalStateProvider>
    </DataProvider>
  );
}

export default App;