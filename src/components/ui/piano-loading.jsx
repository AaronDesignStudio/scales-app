import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import pianoAnimationData from '@/animations/piano-loading.json';
import { cn } from "@/lib/utils";

const PianoLoading = ({ 
  size = "default", 
  className = "",
  message = "Loading...",
  showMessage = true,
  speed = 1,
  autoplay = true,
  loop = true,
  ...props 
}) => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    // Load animation data on client side to prevent SSR issues
    setAnimationData(pianoAnimationData);
  }, []);

  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12", 
    default: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
    "2xl": "w-40 h-40"
  };

  const messageSizes = {
    xs: "text-xs",
    sm: "text-sm",
    default: "text-base",
    lg: "text-lg", 
    xl: "text-xl",
    "2xl": "text-2xl"
  };

  if (!animationData) {
    // Fallback while animation loads
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3", className)} {...props}>
        <div className={cn(
          "rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin",
          sizeClasses[size]
        )} />
        {showMessage && message && (
          <div className={cn("text-gray-700 text-center", messageSizes[size])}>
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)} {...props}>
      <div className={cn(sizeClasses[size])}>
        <Lottie
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          speed={speed}
          style={{
            width: '100%',
            height: '100%'
          }}
        />
      </div>
      
      {showMessage && message && (
        <div className={cn("text-gray-700 text-center font-medium", messageSizes[size])}>
          {message}
        </div>
      )}
    </div>
  );
};

export default PianoLoading; 