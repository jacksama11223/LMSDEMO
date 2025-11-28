
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext, DataContext } from '../../contexts/AppProviders';
import type { UserRole } from '../../types';

type AuthMode = 'STUDENT' | 'TEACHER' | 'ADMIN';
type PageMode = 'login' | 'register';

interface TabButtonProps {
    text: string;
    value: AuthMode;
    current: AuthMode;
    setter: React.Dispatch<React.SetStateAction<AuthMode>>;
}

const TabButton: React.FC<TabButtonProps> = ({ text, value, current, setter }) => (
    <button
        type="button"
        onClick={() => setter(value)}
        className={`py-3 px-4 w-full font-semibold rounded-t-lg focus:outline-none transition-colors duration-200
        ${current === value
            ? 'border-b-2 border-blue-400 text-blue-400'
            : 'text-gray-500 hover:text-gray-300'
        }`}
    >
        {text}
    </button>
);


const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<PageMode>('login');
    const [authMode, setAuthMode] = useState<AuthMode>('STUDENT');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [registerError, setRegisterError] = useState<string | null>(null);

    const { login, error: authError } = useContext(AuthContext)!;
    const { registerUser } = useContext(DataContext)!;

    const getRoleFromMode = useCallback((): UserRole => {
        if (authMode === 'STUDENT') return 'STUDENT';
        if (authMode === 'TEACHER') return 'TEACHER';
        return 'STUDENT';
    }, [authMode]);

    const handleLogin = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (authMode === 'ADMIN') {
            if (username === 'admin' && password === '1') {
                login('qt001', '1');
            } else if (username === 'qt001') {
                login('qt001', password);
            } else {
                login('admin_wrong', 'wrong');
            }
        } else {
            login(username, password);
        }
    }, [authMode, username, password, login]);

    const handleRegister = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterError(null);
        if (password.length < 1) {
            setRegisterError("Mật khẩu quá ngắn (demo).");
            return;
        }

        try {
            const role = getRoleFromMode();
            registerUser(username, password, name, role);
            alert("Đăng ký thành công! Đang đăng nhập...");
            login(username, password);
        } catch (err) {
            setRegisterError(err instanceof Error ? err.message : "Lỗi đăng ký không xác định.");
        }
    }, [username, password, name, getRoleFromMode, registerUser, login]);

    useEffect(() => {
        if (authMode === 'ADMIN' && mode === 'register') {
            setMode('login');
        }
    }, [authMode, mode]);

    return (
        <div id="auth-page" className="flex items-center justify-center min-h-screen p-4">
            <div className="card w-full max-w-md p-0 overflow-hidden">
                <div className="flex bg-gray-900 border-b border-gray-700">
                    <TabButton text="Sinh viên" value="STUDENT" current={authMode} setter={setAuthMode} />
                    <TabButton text="Giáo viên" value="TEACHER" current={authMode} setter={setAuthMode} />
                    <TabButton text="Quản trị viên" value="ADMIN" current={authMode} setter={setAuthMode} />
                </div>

                <div className="p-8 space-y-6">
                    <h1 className="text-3xl font-bold text-center text-gradient">
                        {authMode === 'ADMIN' ? 'Admin Login' : (mode === 'login' ? 'Đăng nhập' : 'Đăng ký')}
                    </h1>

                    {authMode !== 'ADMIN' && (
                        <div className="flex justify-center space-x-2">
                            <button type="button" onClick={() => setMode('login')} className={`font-medium ${mode === 'login' ? 'text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}>Đăng nhập</button>
                            <span className="text-gray-600">|</span>
                            <button type="button" onClick={() => setMode('register')} className={`font-medium ${mode === 'register' ? 'text-blue-400 font-bold' : 'text-gray-500 hover:text-gray-300'}`}>Đăng ký</button>
                        </div>
                    )}

                    <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-6">
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="register-name">Họ và Tên</label>
                                <input id="register-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Nguyễn Văn A" required />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="auth-username">
                                {authMode === 'ADMIN' ? 'Username (admin / qt001)' : 'User ID (Mã số SV/GV)'}
                            </label>
                            <input id="auth-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="form-input" placeholder={authMode === 'ADMIN' ? 'admin' : (authMode === 'STUDENT' ? 'sv001' : 'gv001')} required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="auth-password">Mật khẩu</label>
                            <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-input" placeholder="••••••••" required />
                        </div>

                        {authError && mode === 'login' && <p className="text-sm text-red-500 text-center">{authError}</p>}
                        {registerError && mode === 'register' && <p className="text-sm text-red-500 text-center">{registerError}</p>}

                        <button type="submit" className="btn btn-primary w-full">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
