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
import InternalLinksReal from './pages/InternalLinksReal';
import ToolsReal from './pages/ToolsReal';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

// ── Route guards ──────────────────────────────────────────────────────────────

function PrivateRoute({ children }) {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" replace />;
}

function RoleBasedIndex() {
    const { user } = useAuth();
    if (!user) return null; // Wait for user object to load
    const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;
    return isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
}

function AdminRoute({ children }) {
    const { token, user } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    if (!user) return null; // still loading
    const isAdmin = user?.role === 'admin' || user?.is_staff || user?.is_superuser;
    return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

function PublicRoute({ children }) {
    const { token } = useAuth();
    return token ? <Navigate to="/dashboard" replace /> : children;
}

// ── App layout ────────────────────────────────────────────────────────────────

function AppLayout() {
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    return (
        <div className="bg-surface text-on-surface h-screen overflow-hidden flex selection:bg-primary-fixed selection:text-primary">
            <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
            <main className="flex-1 flex flex-col min-w-0 bg-background h-screen w-0">
                <TopNav onMenuClick={() => setMobileNavOpen(true)} />
                <div className="flex-1 overflow-y-auto w-full overflow-x-hidden">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ProjectProvider>
                    <Routes>
                        {/* Public */}
                        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                        {/* Protected */}
                        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                            <Route index element={<RoleBasedIndex />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="audit" element={<Audit />} />
                            <Route path="keywords" element={<KeywordsReal />} />
                            <Route path="articles" element={<ArticlesReal />} />
                            {/* <Route path="links" element={<InternalLinksReal />} /> */}
                            {/* <Route path="tools" element={<ToolsReal />} /> */}
                            <Route path="profile" element={<Profile />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
                        </Route>

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </ProjectProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}