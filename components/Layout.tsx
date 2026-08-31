
import React from 'react';
import { ThemeColor } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  themeColor: ThemeColor;
}

export const Layout: React.FC<LayoutProps> = ({ children, darkMode, themeColor }) => {
  const getBackgroundClass = () => {
    return darkMode ? 'bg-slate-950' : 'bg-slate-100';
  };

  return (
    // h-[100dvh] ensures it fits mobile viewports correctly (handling address bars)
    <div className={`h-[100dvh] w-full flex justify-center overflow-hidden transition-colors duration-300 ${darkMode ? 'dark' : ''} ${getBackgroundClass()}`}>
      <div className={`w-full max-w-md h-full flex flex-col relative shadow-2xl transition-all duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
        {children}
      </div>
    </div>
  );
};
