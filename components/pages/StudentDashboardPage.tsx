import React, { useContext, useMemo, useState } from 'react';
import { AuthContext, DataContext, GlobalStateContext, PageContext } from '../../contexts/AppProviders';
import { useFeatureFlag } from '../../hooks/useAppHooks';
import Modal from '../common/Modal';

const ShopModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { db, buyShopItem, equipShopItem } = useContext(DataContext)!;
    const { points, diamonds, inventory, equippedSkin } = db.GAMIFICATION;

    const handleBuy = (itemId: string) => {
        try {
            buyShopItem(itemId);
            alert("Mua thành công!");
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleEquip = (itemId: string) => {
        try {
            equipShopItem(itemId);
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cửa Hàng & Kho Đồ" size="xl">
            <div className="space-y-6">
                <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-xs text-gray-400">XP</p>
                            <p className="text-xl font-bold text-yellow-400">{points}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-600"></div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400">Kim cương</p>
                            <p className="text-xl font-bold text-blue-400">💎 {diamonds}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-400 italic">Dùng XP mua Skin, dùng Kim cương mua Hiệu ứng VIP</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {db.SHOP_ITEMS.map(item => {
                        const isOwned = inventory.includes(item.id);
                        const isEquipped = equippedSkin === item.id;
                        const canAfford = item.currency === 'diamond' ? diamonds >= item.cost : points >= item.cost;

                        return (
                            <div key={item.id} className={`card p-4 relative group ${isEquipped ? 'border-green-500 bg-green-900/10' : ''}`}>
                                {isEquipped && <span className="absolute top-2 right-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Đang dùng</span>}
                                <div className="text-4xl mb-3 text-center filter drop-shadow-md">{item.icon}</div>
                                <h3 className="text-lg font-bold text-white text-center">{item.name}</h3>
                                <p className="text-xs text-gray-400 text-center mb-4 min-h-[32px]">{item.description}</p>
                                
                                {isOwned ? (
                                    <button 
                                        onClick={() => handleEquip(item.id)}
                                        disabled={isEquipped}
                                        className={`btn w-full text-sm ${isEquipped ? 'btn-secondary cursor-default opacity-50' : 'btn-primary'}`}
                                    >
                                        {isEquipped ? 'Đã trang bị' : 'Trang bị'}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleBuy(item.id)}
                                        className={`btn w-full text-sm flex justify-center items-center gap-2 ${canAfford ? 'btn-secondary border-blue-400 text-blue-300 hover:bg-blue-900/20' : 'opacity-50 cursor-not-allowed border border-gray-600'}`}
                                        disabled={!canAfford}
                                    >
                                        <span>{item.currency === 'diamond' ? '💎' : 'XP'}</span>
                                        <span>{item.cost}</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
};

const StudentDashboardPage: React.FC = () => {
    const { user } = useContext(AuthContext)!;
    const { db } = useContext(DataContext)!;
    const { navigate } = useContext(PageContext)!;
    const [isShopOpen, setIsShopOpen] = useState(false);

    const courses = useMemo(() => db.COURSES.map(course => ({
        ...course,
        progress: db.ANALYTICS[course.id]?.progress || 0,
        grade: db.ANALYTICS[course.id]?.grade || 'N/A',
    })), [db.COURSES, db.ANALYTICS]);

    const gamification = db.GAMIFICATION;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 0 && hour <= 10) return "Chào buổi sáng";
        if (hour >= 11 && hour <= 12) return "Chào buổi trưa";
        if (hour >= 13 && hour <= 17) return "Chào buổi chiều";
        return "Chào buổi tối";
    };
    
    const greeting = getGreeting();

    if (!user) return null;

    return (
        <div className="space-y-12">
            {/* HERO ISLAND */}
            <div id="dashboard-hero" className="relative rounded-[3rem] p-12 overflow-hidden bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/30 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] group hover:scale-[1.01] transition-transform duration-700">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-pink-400/20 to-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-6 max-w-2xl">
                         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-bold tracking-widest shadow-inner">
                            <span>🚀</span> PHI HÀNH GIA CẤP ĐỘ 1
                         </div>
                         <h1 className="text-6xl font-black text-white leading-tight drop-shadow-lg">
                            {greeting}, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-pink-300 filter drop-shadow-sm">
                                {user.name}
                            </span>
                         </h1>
                         <p className="text-blue-100 text-xl font-light">
                            Bầu trời tri thức đang chờ bạn khám phá. Hãy bắt đầu hành trình hôm nay!
                         </p>
                         <div className="flex gap-4 pt-4">
                            <button id="hero-continue-btn" onClick={() => navigate('assignment_hub')} className="btn btn-primary px-10 py-4 text-lg rounded-full shadow-[0_10px_30px_rgba(59,130,246,0.4)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.6)]">
                                🌟 Tiếp Tục Hành Trình
                            </button>
                         </div>
                    </div>
                    
                    {/* Floating 3D Element */}
                    <div className="hidden lg:block relative w-80 h-80 animate-float">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full opacity-20 blur-3xl"></div>
                        <div className="absolute inset-10 bg-white/10 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center shadow-2xl">
                             <span className="text-9xl filter drop-shadow-2xl">🪐</span>
                        </div>
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-300 rounded-full blur-xl opacity-60 animate-pulse"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: COURSES */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="text-4xl">🔭</span> Các Điểm Đến (Khóa học)
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/30 to-transparent"></div>
                    </div>
                    
                    <div id="course-list" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courses.map(course => (
                            <div 
                                key={course.id} 
                                onClick={() => navigate('course_detail', { courseId: course.id })}
                                className="card p-8 group cursor-pointer hover:bg-white/10 transition-all duration-500"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/20 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                                        📚
                                    </div>
                                    <span className="px-3 py-1 rounded-lg bg-black/20 text-xs font-mono text-blue-200">{course.id}</span>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-sky-300 transition-colors">{course.name}</h3>
                                <p className="text-sm text-gray-300 mb-6 flex items-center gap-2">
                                    <span>👨‍🏫</span> {course.teacher}
                                </p>
                                
                                <div className="relative pt-2">
                                    <div className="flex justify-between text-xs font-bold mb-2 text-blue-200">
                                        <span>TIẾN ĐỘ HOÀN THÀNH</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-sky-400 to-purple-400 relative shadow-[0_0_10px_rgba(56,189,248,0.5)]" 
                                            style={{ width: `${course.progress}%` }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: STATS & DATA */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Gamification Treasure Chest */}
                    <div id="treasure-chest" className="card p-8 border-yellow-400/30 bg-gradient-to-b from-yellow-900/10 to-transparent relative overflow-hidden group">
                        <div className="absolute -right-12 -top-12 w-40 h-40 bg-yellow-500/30 rounded-full blur-[60px] group-hover:blur-[80px] transition-all"></div>
                        
                        <h3 className="text-xl font-bold text-yellow-100 mb-6 flex items-center gap-3">
                            <span className="text-2xl">🏆</span> KHO BÁU CỦA BẠN
                        </h3>
                        
                        {/* Stats Row */}
                        <div className="flex items-stretch gap-4 mb-6">
                            <div className="flex-1 bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col justify-center">
                                <p className="text-[10px] text-yellow-200/70 uppercase font-bold tracking-wider mb-1">TỔNG KINH NGHIỆM</p>
                                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-orange-400 drop-shadow-sm">
                                    {gamification.points} XP
                                </p>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-yellow-400 h-full w-3/4"></div>
                                </div>
                            </div>
                            <div className="flex-1 bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="text-4xl mb-1 animate-float">💎</div>
                                <p className="text-2xl font-black text-blue-300">{gamification.diamonds}</p>
                                <div className="absolute inset-0 bg-blue-500/10 blur-xl"></div>
                            </div>
                        </div>
                        
                        {/* Shop Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => setIsShopOpen(true)} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 hover:scale-105 transition-all cursor-pointer shadow-lg group/btn">
                                <span className="text-2xl mb-1 group-hover/btn:scale-110 transition-transform">🚀</span>
                                <span className="text-[10px] font-bold text-gray-400">Hiệu ứng</span>
                            </button>
                            <button onClick={() => setIsShopOpen(true)} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 hover:scale-105 transition-all cursor-pointer shadow-lg group/btn">
                                <span className="text-2xl mb-1 group-hover/btn:scale-110 transition-transform">📚</span>
                                <span className="text-[10px] font-bold text-gray-400">Giao diện</span>
                            </button>
                            <button onClick={() => setIsShopOpen(true)} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center hover:bg-white/10 hover:scale-105 transition-all cursor-pointer shadow-lg group/btn">
                                <span className="text-2xl mb-1 group-hover/btn:scale-110 transition-transform">🦉</span>
                                <span className="text-[10px] font-bold text-gray-400">Trang phục</span>
                            </button>
                        </div>
                    </div>

                    {/* Magic Portals */}
                    <div className="space-y-4">
                         <button id="btn-portal-ai" onClick={() => navigate('gemini_student')} className="w-full p-5 rounded-3xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/30 text-left hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(192,132,252,0.3)] transition-all group backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🔮</span>
                                    <span className="font-bold text-purple-100 text-lg">Hỏi Nhà Tiên Tri AI</span>
                                </div>
                                <span className="text-purple-300 group-hover:translate-x-2 transition-transform bg-white/10 p-2 rounded-full">➔</span>
                            </div>
                            <p className="text-sm text-purple-200/60 mt-2 pl-10">Giải đáp mọi bí ẩn vũ trụ</p>
                         </button>
                         
                         <button id="btn-portal-tree" onClick={() => navigate('assignment_hub')} className="w-full p-5 rounded-3xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-400/30 text-left hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all group backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🌳</span>
                                    <span className="font-bold text-emerald-100 text-lg">Cây Tri Thức</span>
                                </div>
                                <span className="text-emerald-300 group-hover:translate-x-2 transition-transform bg-white/10 p-2 rounded-full">➔</span>
                            </div>
                            <p className="text-sm text-emerald-200/60 mt-2 pl-10">Leo lên đỉnh cao học vấn</p>
                         </button>
                    </div>
                </div>
            </div>
            
            <ShopModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />
        </div>
    );
};
export default StudentDashboardPage;