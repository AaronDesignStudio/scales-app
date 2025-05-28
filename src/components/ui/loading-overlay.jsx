'use client';

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import LoadingSpinner from "./loading-spinner";
import PianoLoading from "./piano-loading";

const LoadingOverlay = ({ 
  isVisible = false,
  message = "Loading...",
  variant = "default",
  className = "",
  onTransitionComplete,
  fadeIn = true,
  fadeOut = true,
  children,
  usePianoAnimation = true,
  ...props 
}) => {
  const [mounted, setMounted] = useState(false);
  const [animationState, setAnimationState] = useState('hidden');

  useEffect(() => {
    if (isVisible) {
      setMounted(true);
      if (fadeIn) {
        // Small delay to ensure mounting animation
        requestAnimationFrame(() => {
          setAnimationState('visible');
        });
      } else {
        setAnimationState('visible');
      }
    } else {
      if (fadeOut && mounted) {
        setAnimationState('hiding');
        // Wait for animation to complete before unmounting
        const timer = setTimeout(() => {
          setMounted(false);
          setAnimationState('hidden');
          onTransitionComplete?.();
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setMounted(false);
        setAnimationState('hidden');
        onTransitionComplete?.();
      }
    }
  }, [isVisible, fadeIn, fadeOut, mounted, onTransitionComplete]);

  if (!mounted) return null;

  const overlayClasses = cn(
    "fixed inset-0 z-50 flex items-center justify-center",
    "bg-white/90 backdrop-blur-sm",
    "transition-all duration-300 ease-in-out",
    animationState === 'visible' && "opacity-100",
    animationState === 'hiding' && "opacity-0",
    animationState === 'hidden' && "opacity-0 pointer-events-none",
    className
  );

  const contentClasses = cn(
    "flex flex-col items-center justify-center gap-4 p-8",
    "bg-white rounded-2xl shadow-lg border border-gray-200",
    "transform transition-all duration-300 ease-in-out",
    animationState === 'visible' && "scale-100 opacity-100",
    animationState === 'hiding' && "scale-95 opacity-0",
    "max-w-sm mx-4"
  );

  return (
    <div className={overlayClasses} {...props}>
      <div className={contentClasses}>
        {children || (
          <>
            {usePianoAnimation ? (
              <PianoLoading 
                size="lg" 
                message=""
                showMessage={false}
                speed={1.2}
              />
            ) : (
              <LoadingSpinner 
                size="lg" 
                variant={variant === "primary" ? "primary" : "default"}
                usePianoAnimation={false}
              />
            )}
            {message && (
              <div className="text-lg font-medium text-gray-700 text-center">
                {message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay; 