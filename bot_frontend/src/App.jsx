import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';

import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Audit from './pages/Audit';
import KeywordsReal from './pages/KeywordsReal';
import ArticlesReal from './pages/ArticlesReal';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Protect private routes
const PrivateRoute = ({ children }) => {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const AppLayout = () => {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    return (
        <div className="bg-surface text-on-surface min-h-screen flex selection:bg-primary-fixed selection:text-primary">
            <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
            <main className="flex-1 flex flex-col min-w-0 bg-background min-h-screen w-0">
                <TopNav onMenuClick={() => setMobileNavOpen(true)} />
                <div className="flex-1 overflow-y-auto w-full overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ProjectProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        {/* Protected Application Routes */}
                        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="audit" element={<Audit />} />
                            <Route path="keywords" element={<KeywordsReal />} />
                            <Route path="articles" element={<ArticlesReal />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="links" element={<Navigate to="/dashboard" replace />} />
                            <Route path="plan" element={<Navigate to="/dashboard" replace />} />
                            <Route path="tools" element={<Navigate to="/dashboard" replace />} />
                            <Route path="projects" element={<Navigate to="/dashboard" replace />} />
                        </Route>
                    </Routes>
                </ProjectProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
