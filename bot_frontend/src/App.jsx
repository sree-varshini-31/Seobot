import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Audit from './pages/Audit';
import Keywords from './pages/Keywords';
import Articles from './pages/Articles';
import InternalLinks from './pages/InternalLinks';
import ContentPlan from './pages/ContentPlan';
import Tools from './pages/Tools';

// Protect private routes
const PrivateRoute = ({ children }) => {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Layout component handles the App shell
const AppLayout = () => {
    return (
        <div className="bg-surface text-on-surface min-h-screen flex selection:bg-primary-fixed selection:text-primary">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 bg-background">
               <TopNav />
               {/* Child Page Rendering */}
               <div className="flex-1 overflow-y-auto w-full">
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
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Protected Application Routes */}
                    <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="audit" element={<Audit />} />
                        <Route path="keywords" element={<Keywords />} />
                        <Route path="articles" element={<Articles />} />
                        <Route path="links" element={<InternalLinks />} />
                        <Route path="plan" element={<ContentPlan />} />
                        <Route path="tools" element={<Tools />} />
                        <Route path="projects" element={<Dashboard />} />
                        {/* More routes will be added as built */}
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
