import React from 'react';
import { ThemeColor } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  themeColor: ThemeColor;
}

export const Layout: React.FC<LayoutProps> = ({ children, darkMode, themeColor }) => {
  return (
    <div className={`min-h-screen w-full flex justify-center bg-slate-900 md:py-4 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div 
        className={`w-full max-w-lg md:max-w-xl h-screen md:h-[94vh] flex flex-col relative md:rounded-[2.5rem] shadow-2xl overflow-hidden border-0 md:border md:border-slate-800/60 transition-all duration-300 ${
          darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

