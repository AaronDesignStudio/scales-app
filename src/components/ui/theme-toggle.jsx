'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const ThemeToggle = ({ className = "", size = "default", variant = "default" }) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: "h-8 w-14",
    default: "h-10 w-[4.5rem]",
    lg: "h-12 w-20"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    default: "w-4 h-4", 
    lg: "w-5 h-5"
  };

  const paddingClasses = {
    sm: "p-1",
    default: "p-1.5",
    lg: "p-2"
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
        sizeClasses[size],
        paddingClasses[size],
        variant === "outline" 
          ? "border-2 border-gray-300 dark:border-gray-600 bg-transparent" 
          : "bg-gray-200 dark:bg-gray-700",
        "hover:bg-gray-300 dark:hover:bg-gray-600",
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Background slider */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-300 ease-in-out",
          variant === "outline" 
            ? "bg-gray-100 dark:bg-gray-800" 
            : "bg-white dark:bg-gray-800 shadow-sm"
        )}
      />
      
      {/* Sliding indicator */}
      <div
        className={cn(
          "relative rounded-full transition-all duration-300 ease-in-out transform shadow-sm",
          sizeClasses[size].replace('h-10 w-[4.5rem]', 'h-7 w-7').replace('h-8 w-14', 'h-6 w-6').replace('h-12 w-20', 'h-8 w-8'),
          "bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500",
          theme === 'dark' 
            ? size === 'sm' ? 'translate-x-6' : size === 'lg' ? 'translate-x-10' : 'translate-x-8'
            : 'translate-x-0'
        )}
      />

      {/* Sun icon (light mode) */}
      <Sun 
        className={cn(
          "absolute transition-all duration-300 ease-in-out text-yellow-500",
          iconSizes[size],
          size === 'sm' ? 'left-2' : size === 'lg' ? 'left-3' : 'left-2.5',
          "top-1/2 transform -translate-y-1/2",
          theme === 'light' 
            ? 'opacity-100 scale-100' 
            : 'opacity-30 scale-75'
        )}
      />
      
      {/* Moon icon (dark mode) */}
      <Moon 
        className={cn(
          "absolute transition-all duration-300 ease-in-out text-blue-400",
          iconSizes[size],
          size === 'sm' ? 'right-2' : size === 'lg' ? 'right-3' : 'right-2.5',
          "top-1/2 transform -translate-y-1/2",
          theme === 'dark' 
            ? 'opacity-100 scale-100' 
            : 'opacity-30 scale-75'
        )}
      />
    </button>
  );
};

export default ThemeToggle; 