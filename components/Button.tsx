
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  themeColor?: string; // We expect 'emerald', 'blue', etc.
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '',
  themeColor = 'emerald',
  ...props 
}) => {
  const baseStyle = "font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  // Helper to get color classes based on themeColor string.
  // Note: Tailwind classes must be complete strings to be detected by JIT compiler unless safelisted.
  // Since we can't easily safe-list all dynamic colors in this setup without config access,
  // we will map the most common ones or rely on inline styles for specific colors if strictly needed.
  // HOWEVER, for this specific request, we will use a mapping approach for the themes defined in config.
  
  const getColorClasses = () => {
     // Default fallback to emerald if match fails (though config ensures match)
     const map: any = {
        emerald: {
           primary: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30 text-white',
           outline: 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50'
        },
        blue: {
           primary: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 text-white',
           outline: 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50'
        },
        violet: {
           primary: 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/30 text-white',
           outline: 'border-2 border-violet-500 text-violet-600 hover:bg-violet-50'
        },
        rose: {
           primary: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30 text-white',
           outline: 'border-2 border-rose-500 text-rose-600 hover:bg-rose-50'
        },
        amber: {
           primary: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 text-white',
           outline: 'border-2 border-amber-500 text-amber-600 hover:bg-amber-50'
        },
        cyan: {
           primary: 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/30 text-white',
           outline: 'border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50'
        },
        slate: {
           primary: 'bg-slate-700 hover:bg-slate-800 shadow-slate-500/30 text-white',
           outline: 'border-2 border-slate-600 text-slate-700 hover:bg-slate-50'
        }
     };

     return map[themeColor] || map.emerald;
  };

  const themeClasses = getColorClasses();

  const getVariantClasses = () => {
    switch(variant) {
      case 'primary':
        return themeClasses.primary;
      case 'secondary':
        return "bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300";
      case 'danger':
        return "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30";
      case 'outline':
        return themeClasses.outline;
      case 'ghost':
        return "bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100";
      default:
        return "";
    }
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button 
      className={`${baseStyle} ${getVariantClasses()} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
