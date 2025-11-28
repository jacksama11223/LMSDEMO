import React, { useState, useEffect, useContext, createContext, useRef, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { MOCK_DATA } from '../data/mockData';
import type {
    User, UserRole, Database, QuizQuestion, MockTestResults, LearningNode,
    AuthContextType, DataContextType, GlobalStateContextType, PageContextType,
    FeatureFlagStatus, ServiceName, ServiceStatusValue, ServiceStatus, FeatureFlags, StudyGroup
} from '../types';

// --- Context Definitions ---
export const DataContext = createContext<DataContextType | null>(null);
export const AuthContext = createContext<AuthContextType | null>(null);
export const GlobalStateContext = createContext<GlobalStateContextType | null>(null);
export const PageContext = createContext<PageContextType | null>(null);

// --- Data Provider ---
interface DataProviderProps { children: ReactNode; }
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const [db, setDb] = useState<Database>(MOCK_DATA);
    const testTimeoutRef = useRef<Record<string, number>>({});

    const registerUser = useCallback((id: string, password: string, name: string, role: UserRole) => {
        setDb(prevDb => {
            if (prevDb.USERS[id]) {
                throw new Error("User ID đã tồn tại.");
            }
            const newUser: User = { id, password, name, role, isLocked: false, apiKey: null, hasSeenOnboarding: false };
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            newDb.USERS[id] = newUser;
            
            Object.keys(newDb.ASSIGNMENTS).forEach(assignmentId => {
                const assignment = newDb.ASSIGNMENTS[assignmentId];
                if (assignment.type === 'file') {
                    if (!newDb.FILE_SUBMISSIONS[assignmentId]) newDb.FILE_SUBMISSIONS[assignmentId] = [];
                    newDb.FILE_SUBMISSIONS[assignmentId].push({
                        id: `sub_${id}_${assignmentId}`, studentId: id, studentName: name, status: "Chưa nộp",
                        grade: null, feedback: null, fileName: null, timestamp: null
                    });
                } else if (assignment.type === 'quiz' && assignment.quizId) {
                    if (!newDb.QUIZ_SUBMISSIONS[assignment.quizId]) newDb.QUIZ_SUBMISSIONS[assignment.quizId] = {};
                    newDb.QUIZ_SUBMISSIONS[assignment.quizId][id] = null;
                }
            });
            return newDb;
        });
    }, []);

    const toggleUserLock = useCallback((userId: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (newDb.USERS[userId]) {
                newDb.USERS[userId].isLocked = !newDb.USERS[userId].isLocked;
                const adminUser = Object.values(newDb.USERS).find(u => u.role === 'ADMIN');
                const logAction = newDb.USERS[userId].isLocked ? 'Locked' : 'Unlocked';
                const newLog = {
                    id: `log_${Date.now()}`, user: `ADMIN (${adminUser?.name || 'Unknown'})`,
                    action: `${logAction} user ${userId} (${newDb.USERS[userId].name})`,
                    timestamp: new Date().toISOString()
                };
                newDb.ACCESS_LOGS = [newLog, ...newDb.ACCESS_LOGS];
            }
            return newDb;
        });
    }, []);

    const setApiKey = useCallback((userId: string, apiKey: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (newDb.USERS[userId]) {
                newDb.USERS[userId].apiKey = apiKey;
            }
            return newDb;
        });
    }, []);

    const editLessonContent = useCallback((lessonId: string, newContent: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (newDb.LESSONS[lessonId]) {
                newDb.LESSONS[lessonId].content = newContent;
            }
            return newDb;
        });
    }, []);

    const createFileAssignment = useCallback((title: string, courseId: string) => {
        const newAssignmentId = `a_${Date.now()}`;
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            newDb.ASSIGNMENTS[newAssignmentId] = { id: newAssignmentId, courseId, title, type: 'file' };
            newDb.FILE_SUBMISSIONS[newAssignmentId] = [];
            Object.values(newDb.USERS).forEach(user => {
                if (user.role === 'STUDENT') {
                    newDb.FILE_SUBMISSIONS[newAssignmentId].push({
                        id: `sub_${user.id}_${newAssignmentId}`, studentId: user.id, studentName: user.name, status: "Chưa nộp",
                        grade: null, feedback: null, fileName: null, timestamp: null
                    });
                }
            });
            return newDb;
        });
    }, []);

    const createQuizAssignment = useCallback((title: string, courseId: string, questions: QuizQuestion[]) => {
        const newQuizId = `qz_${Date.now()}`;
        const newAssignmentId = `q_${Date.now()}`;
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            newDb.ASSIGNMENTS[newAssignmentId] = { id: newAssignmentId, courseId, title, type: 'quiz', quizId: newQuizId };
            newDb.QUIZZES[newQuizId] = { id: newQuizId, questions };
            newDb.QUIZ_SUBMISSIONS[newQuizId] = {};
            Object.values(newDb.USERS).forEach(user => {
                if (user.role === 'STUDENT') {
                    newDb.QUIZ_SUBMISSIONS[newQuizId][user.id] = null;
                }
            });
            return newDb;
        });
    }, []);

    const submitFileAssignment = useCallback((assignmentId: string, studentId: string, fileName: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            const subIndex = newDb.FILE_SUBMISSIONS[assignmentId]?.findIndex(s => s.studentId === studentId);
            if (subIndex > -1) {
                newDb.FILE_SUBMISSIONS[assignmentId][subIndex].status = "Đã nộp";
                newDb.FILE_SUBMISSIONS[assignmentId][subIndex].fileName = fileName;
                newDb.FILE_SUBMISSIONS[assignmentId][subIndex].timestamp = new Date().toISOString();
            }
            return newDb;
        });
    }, []);

    const submitQuiz = useCallback((quizId: string, studentId: string, answers: Record<string, number>) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            const quiz = newDb.QUIZZES[quizId];
            if (quiz && newDb.QUIZ_SUBMISSIONS[quizId] && newDb.QUIZ_SUBMISSIONS[quizId][studentId] === null) {
                let score = 0;
                quiz.questions.forEach(q => {
                    if (answers[q.id] === q.correctAnswer) score++;
                });
                newDb.QUIZ_SUBMISSIONS[quizId][studentId] = {
                    score, total: quiz.questions.length,
                    percentage: (score / quiz.questions.length) * 100,
                    timestamp: new Date().toISOString(), answers
                };
            }
            return newDb;
        });
    }, []);

    const gradeFileSubmission = useCallback((assignmentId: string, studentId: string, grade: number, feedback: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            const subIndex = newDb.FILE_SUBMISSIONS[assignmentId]?.findIndex(s => s.studentId === studentId);
            if (subIndex > -1) {
                newDb.FILE_SUBMISSIONS[assignmentId][subIndex].grade = grade;
                newDb.FILE_SUBMISSIONS[assignmentId][subIndex].feedback = feedback;
            }
            return newDb;
        });
    }, []);

    const sendChatMessage = useCallback((fromId: string, toId: string, text: string) => {
        const chatKey = [fromId, toId].sort().join('_');
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (!newDb.CHAT_MESSAGES[chatKey]) newDb.CHAT_MESSAGES[chatKey] = [];
            newDb.CHAT_MESSAGES[chatKey].push({
                id: `msg_${Date.now()}`, from: fromId, text, timestamp: new Date()
            });
            return newDb;
        });
    }, []);

    const joinGroup = useCallback((groupId: string, userId: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            const group = newDb.STUDY_GROUPS.find(g => g.id === groupId);
            const user = newDb.USERS[userId];
            if (group && user && !group.members.includes(userId)) {
                group.members.push(userId);
                if (!newDb.GROUP_CHAT_MESSAGES[groupId]) newDb.GROUP_CHAT_MESSAGES[groupId] = [];
                newDb.GROUP_CHAT_MESSAGES[groupId].push({
                    id: `gmsg_sys_${Date.now()}`,
                    user: { id: 'system', name: 'Hệ thống', role: 'SYSTEM' },
                    text: `${user.name} đã tham gia nhóm.`,
                    timestamp: new Date()
                });
            }
            return newDb;
        });
    }, []);

    const createGroup = useCallback((name: string, creatorId: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            const newGroupId = `g_${Date.now()}`;
            const newGroup: StudyGroup = {
                id: newGroupId,
                name,
                members: [creatorId],
                mission: {
                    id: `mis_${Date.now()}`,
                    title: 'Tân binh nhập ngũ',
                    target: 50,
                    current: 0,
                    reward: 20,
                    type: 'chat_activity'
                }
            };
            newDb.STUDY_GROUPS.push(newGroup);
            newDb.GROUP_CHAT_MESSAGES[newGroupId] = [{
                id: `gmsg_init_${Date.now()}`,
                user: { id: 'system', name: 'Hệ thống', role: 'SYSTEM' },
                text: `Phi thuyền "${name}" đã được khởi tạo. Chào mừng thuyền trưởng!`,
                timestamp: new Date()
            }];
            return newDb;
        });
    }, []);

    const sendGroupMessage = useCallback((groupId: string, user: { id: string, name: string, role: UserRole }, text: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (!newDb.GROUP_CHAT_MESSAGES[groupId]) newDb.GROUP_CHAT_MESSAGES[groupId] = [];
            newDb.GROUP_CHAT_MESSAGES[groupId].push({
                id: `gmsg${Date.now()}`, user: { id: user.id, name: user.name, role: user.role },
                text, timestamp: new Date()
            });
            return newDb;
        });
    }, []);

    const addDiscussionPost = useCallback((lessonId: string, user: { id: string, name: string }, text: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (!newDb.DISCUSSION[lessonId]) newDb.DISCUSSION[lessonId] = [];
            newDb.DISCUSSION[lessonId].push({
                id: `d_${Date.now()}`, user: `${user.id} (${user.name})`, text, timestamp: new Date()
            });
            return newDb;
        });
    }, []);

    const sendAnnouncement = useCallback((text: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            newDb.ANNOUNCEMENTS = [{ id: `ann_${Date.now()}`, text, timestamp: new Date(), readBy: [] }, ...newDb.ANNOUNCEMENTS];
            const adminUser = Object.values(newDb.USERS).find(u => u.role === 'ADMIN');
            newDb.ACCESS_LOGS = [{
                id: `log_${Date.now()}`, user: `ADMIN (${adminUser?.name || 'Unknown'})`,
                action: `Sent announcement: "${text.substring(0, 30)}..."`,
                timestamp: new Date().toISOString()
            }, ...newDb.ACCESS_LOGS];
            return newDb;
        });
    }, []);

    const dismissAnnouncement = useCallback((annId: string) => {
        setDb(prevDb => ({ ...prevDb, ANNOUNCEMENTS: prevDb.ANNOUNCEMENTS.filter(ann => ann.id !== annId) }));
    }, []);
    
    const runMockTest = useCallback((testType: keyof MockTestResults) => {
        if (testTimeoutRef.current[testType]) {
            clearTimeout(testTimeoutRef.current[testType]);
        }
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            newDb.MOCK_TEST_RESULTS[testType] = 'RUNNING';
            return newDb;
        });
        const duration = testType === 'unit' ? 2000 : (testType === 'integration' ? 4000 : 7000);
        testTimeoutRef.current[testType] = window.setTimeout(() => {
            const result = Math.random() > 0.1 ? 'PASS' : 'FAIL';
            setDb(prevDb => {
                const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
                newDb.MOCK_TEST_RESULTS[testType] = result;
                const adminUser = Object.values(newDb.USERS).find(u => u.role === 'ADMIN');
                newDb.ACCESS_LOGS = [{
                    id: `log_${Date.now()}`, user: `ADMIN (${adminUser?.name || 'Unknown'})`,
                    action: `Ran ${testType.toUpperCase()} Tests. Result: ${result}`,
                    timestamp: new Date().toISOString()
                }, ...newDb.ACCESS_LOGS];
                return newDb;
            });
            delete testTimeoutRef.current[testType];
        }, duration + Math.random() * 500);
    }, []);

    const addVideoNote = useCallback((lessonId: string, userId: string, timestamp: number, text: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (!newDb.VIDEO_NOTES) newDb.VIDEO_NOTES = {};
            if (!newDb.VIDEO_NOTES[lessonId]) newDb.VIDEO_NOTES[lessonId] = [];
            
            newDb.VIDEO_NOTES[lessonId].push({
                id: `vn_${Date.now()}`,
                userId,
                lessonId,
                timestamp,
                text,
                createdAt: new Date().toISOString()
            });
            newDb.VIDEO_NOTES[lessonId].sort((a, b) => a.timestamp - b.timestamp);
            return newDb;
        });
    }, []);

    const deleteVideoNote = useCallback((lessonId: string, noteId: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (newDb.VIDEO_NOTES && newDb.VIDEO_NOTES[lessonId]) {
                newDb.VIDEO_NOTES[lessonId] = newDb.VIDEO_NOTES[lessonId].filter(n => n.id !== noteId);
            }
            return newDb;
        });
    }, []);

    const markLessonComplete = useCallback((userId: string, lessonId: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (!newDb.LESSON_PROGRESS) newDb.LESSON_PROGRESS = {};
            if (!newDb.LESSON_PROGRESS[userId]) newDb.LESSON_PROGRESS[userId] = [];
            
            if (!newDb.LESSON_PROGRESS[userId].includes(lessonId)) {
                newDb.LESSON_PROGRESS[userId].push(lessonId);
            }
            return newDb;
        });
    }, []);

    const createLearningPath = useCallback((creatorId: string, title: string, topic: string, nodes: LearningNode[], meta: { level: string, goal: string, time: string }) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (!newDb.LEARNING_PATHS) newDb.LEARNING_PATHS = {};
            const pathId = `lp_${Date.now()}`;
            
            // Initialize nodes with empty flashcards array for persistence
            const initializedNodes = nodes.map(node => ({
                ...node,
                flashcards: []
            }));

            newDb.LEARNING_PATHS[pathId] = {
                id: pathId,
                creatorId,
                title,
                topic,
                nodes: initializedNodes,
                createdAt: new Date().toISOString(),
                targetLevel: meta.level as any,
                goal: meta.goal,
                dailyCommitment: meta.time
            };
            return newDb;
        });
    }, []);

    // --- NEW FUNCTIONS FOR LEARNING PATH ---
    const updateNodeProgress = useCallback((pathId: string, nodeId: string, data: Partial<LearningNode>) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            const path = newDb.LEARNING_PATHS[pathId];
            if (path) {
                const nodeIndex = path.nodes.findIndex(n => n.id === nodeId);
                if (nodeIndex > -1) {
                    path.nodes[nodeIndex] = { ...path.nodes[nodeIndex], ...data };
                }
            }
            return newDb;
        });
    }, []);

    const unlockNextNode = useCallback((pathId: string, currentNodeId: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            const path = newDb.LEARNING_PATHS[pathId];
            if (path) {
                const currentNodeIndex = path.nodes.findIndex(n => n.id === currentNodeId);
                if (currentNodeIndex > -1) {
                    // Mark current as completed
                    path.nodes[currentNodeIndex].isCompleted = true;
                    // Unlock next if exists
                    if (currentNodeIndex + 1 < path.nodes.length) {
                        path.nodes[currentNodeIndex + 1].isLocked = false;
                    }
                }
            }
            return newDb;
        });
    }, []);

    const extendLearningPath = useCallback((pathId: string, newNodes: LearningNode[]) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            const path = newDb.LEARNING_PATHS[pathId];
            if (path) {
                 // Initialize nodes with empty flashcards array
                const initializedNewNodes = newNodes.map(node => ({
                    ...node,
                    flashcards: []
                }));

                // Unlock the first new node so user can continue immediately
                if (initializedNewNodes.length > 0) {
                    initializedNewNodes[0].isLocked = false;
                }
                path.nodes = [...path.nodes, ...initializedNewNodes];
            }
            return newDb;
        });
    }, []);

    // --- SHOP & GAMIFICATION ---
    const buyShopItem = useCallback((itemId: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            const item = newDb.SHOP_ITEMS.find(i => i.id === itemId);
            const gamify = newDb.GAMIFICATION;

            if (!item) throw new Error("Vật phẩm không tồn tại.");
            if (gamify.inventory.includes(itemId)) throw new Error("Bạn đã sở hữu vật phẩm này.");

            if (item.currency === 'diamond') {
                if (gamify.diamonds < item.cost) throw new Error("Không đủ Kim cương.");
                gamify.diamonds -= item.cost;
            } else {
                 if (gamify.points < item.cost) throw new Error("Không đủ XP.");
                 gamify.points -= item.cost;
            }

            gamify.inventory.push(itemId);
            return newDb;
        });
    }, []);

    const equipShopItem = useCallback((itemId: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (!newDb.GAMIFICATION.inventory.includes(itemId)) throw new Error("Bạn chưa sở hữu vật phẩm này.");
            newDb.GAMIFICATION.equippedSkin = itemId;
            return newDb;
        });
    }, []);

    const checkDailyDiamondReward = useCallback(() => {
        let earned = false;
        setDb(prevDb => {
            const today = new Date().toDateString();
            const lastDate = prevDb.GAMIFICATION.lastStudyDate ? new Date(prevDb.GAMIFICATION.lastStudyDate).toDateString() : null;
            
            if (lastDate !== today) {
                const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
                newDb.GAMIFICATION.diamonds += 5; // Reward amount
                newDb.GAMIFICATION.lastStudyDate = new Date().toISOString();
                earned = true;
                return newDb;
            }
            return prevDb;
        });
        return earned;
    }, []);

    const completeOnboarding = useCallback((userId: string) => {
        setDb(prevDb => {
            const newDb = JSON.parse(JSON.stringify(prevDb)) as Database;
            if (newDb.USERS[userId]) {
                newDb.USERS[userId].hasSeenOnboarding = true;
            }
            return newDb;
        });
    }, []);
    // ---------------------------------------

    const value = useMemo(() => ({
        db, registerUser, toggleUserLock, setApiKey, editLessonContent,
        createFileAssignment, createQuizAssignment, submitFileAssignment, submitQuiz,
        gradeFileSubmission, sendChatMessage, joinGroup, createGroup, sendGroupMessage,
        addDiscussionPost, sendAnnouncement, dismissAnnouncement, runMockTest,
        addVideoNote, deleteVideoNote, markLessonComplete, createLearningPath,
        updateNodeProgress, unlockNextNode, extendLearningPath,
        buyShopItem, equipShopItem, checkDailyDiamondReward, completeOnboarding
    }), [
        db, registerUser, toggleUserLock, setApiKey, editLessonContent,
        createFileAssignment, createQuizAssignment, submitFileAssignment, submitQuiz,
        gradeFileSubmission, sendChatMessage, joinGroup, createGroup, sendGroupMessage,
        addDiscussionPost, sendAnnouncement, dismissAnnouncement, runMockTest,
        addVideoNote, deleteVideoNote, markLessonComplete, createLearningPath,
        updateNodeProgress, unlockNextNode, extendLearningPath,
        buyShopItem, equipShopItem, checkDailyDiamondReward, completeOnboarding
    ]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// --- Auth Provider ---
interface AuthProviderProps { children: ReactNode; }
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<{ id: string; name: string; role: UserRole; hasSeenOnboarding?: boolean } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { db } = useContext(DataContext)!;

    const login = useCallback((id: string, password?: string) => {
        const foundUser = db.USERS[id];
        if (foundUser && foundUser.password === password) {
            if (foundUser.isLocked) {
                setError("Tài khoản đã bị khóa.");
                setUser(null);
            } else {
                setUser({ id: foundUser.id, name: foundUser.name, role: foundUser.role, hasSeenOnboarding: foundUser.hasSeenOnboarding });
                setError(null);
            }
        } else {
            setError("Sai User ID hoặc mật khẩu.");
            setUser(null);
        }
    }, [db.USERS]);

    const logout = useCallback(() => {
        setUser(null);
        setError(null);
    }, []);

    const isLocked = useMemo(() => (user ? db.USERS[user.id]?.isLocked : false), [user, db.USERS]);
    const value = useMemo(() => ({ user, error, login, logout, isLocked }), [user, error, login, logout, isLocked]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- Global State Provider ---
interface GlobalStateProviderProps { children: ReactNode; }
export const GlobalStateProvider: React.FC<GlobalStateProviderProps> = ({ children }) => {
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
        v2_chat: { status: 'ALL', specificUsers: '' },
        v3_ai_analytics: { status: 'OFF', specificUsers: '' },
        v4_gamify: { status: 'SPECIFIC', specificUsers: 'sv001,sv003' },
        v5_groups: { status: 'ALL', specificUsers: '' },
    });

    const setFeatureFlag = useCallback((key: string, newStatus: FeatureFlagStatus, newUsers: string | undefined = undefined) => {
        setFeatureFlags(prev => ({ ...prev, [key]: { status: newStatus, specificUsers: newUsers !== undefined ? newUsers : prev[key].specificUsers } }));
    }, []);

    const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
        user_management: 'OPERATIONAL', course_management: 'OPERATIONAL', content_delivery: 'OPERATIONAL',
        assessment_taking: 'OPERATIONAL', storage_service: 'OPERATIONAL', grading_service: 'OPERATIONAL',
        notification_service: 'OPERATIONAL', chat_service: 'OPERATIONAL', group_service: 'OPERATIONAL',
        forum_service: 'OPERATIONAL', ai_tutor_service: 'OPERATIONAL', ai_assistant_service: 'OPERATIONAL',
        personalization: 'OPERATIONAL', analytics: 'OPERATIONAL',
    });

    const toggleServiceStatus = useCallback((serviceKey: ServiceName) => {
        setServiceStatus(prev => {
            const currentStatus = prev[serviceKey];
            const nextStatus: ServiceStatusValue = currentStatus === 'OPERATIONAL' ? 'DEGRADED' : currentStatus === 'DEGRADED' ? 'CRITICAL' : 'OPERATIONAL';
            return { ...prev, [serviceKey]: nextStatus };
        });
    }, []);

    const [page, setPage] = useState('dashboard');
    const [pageParams, setPageParams] = useState<Record<string, any>>({});
    const setGlobalPageState = useCallback((pageName: string, params: Record<string, any> = {}) => {
        setPage(pageName);
        setPageParams(params);
    }, []);

    const value = useMemo(() => ({
        featureFlags, setFeatureFlag, serviceStatus, toggleServiceStatus,
        page, pageParams, setPage: setGlobalPageState,
    }), [featureFlags, setFeatureFlag, serviceStatus, toggleServiceStatus, page, pageParams, setGlobalPageState]);

    return <GlobalStateContext.Provider value={value}>{children}</GlobalStateContext.Provider>;
};

// --- Page Provider ---
interface PageProviderProps { children: ReactNode; }
export const PageProvider: React.FC<PageProviderProps> = ({ children }) => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [currentParams, setCurrentParams] = useState<Record<string, any>>({});
    const { setPage: setGlobalPage } = useContext(GlobalStateContext)!;

    const navigate = useCallback((pageName: string, pageParams: Record<string, any> = {}) => {
        setCurrentPage(pageName);
        setCurrentParams(pageParams);
        if (pageName === 'api_key') {
            setGlobalPage('api_key', { ...pageParams, isApiKeyModalOpen: true });
        } else {
            setGlobalPage(pageName, { ...pageParams, isApiKeyModalOpen: false });
        }
    }, [setGlobalPage]);

    const value = useMemo(() => ({ page: currentPage, params: currentParams, navigate }), [currentPage, currentParams, navigate]);
    return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};