import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_collapsed', String(next));
        } catch (e) {}
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <Navbar 
        onToggleSidebar={handleToggleSidebar} 
        isSidebarOpen={mobileSidebarOpen}
        isSidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex-1 flex w-full mx-auto px-2 sm:px-4 lg:px-6 transition-all duration-300">
        {isAuthenticated && (
          <Sidebar 
            isOpen={mobileSidebarOpen} 
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            onClose={() => setMobileSidebarOpen(false)} 
          />
        )}

        <main className="flex-1 p-2 sm:p-4 lg:p-6 w-full min-w-0 transition-all duration-300">
          <Outlet context={{ sidebarCollapsed, toggleSidebar: handleToggleSidebar }} />
        </main>
      </div>
    </div>
  );
};
