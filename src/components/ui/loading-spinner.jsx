import { cn } from "@/lib/utils";
import PianoLoading from "./piano-loading";

const LoadingSpinner = ({ 
  size = "default", 
  variant = "default",
  className = "",
  usePianoAnimation = true,
  ...props 
}) => {
  // If piano animation is requested, use it
  if (usePianoAnimation) {
    const pianoSizeMap = {
      sm: "xs",
      default: "sm",
      lg: "default", 
      xl: "lg"
    };

    return (
      <PianoLoading
        size={pianoSizeMap[size] || "sm"}
        showMessage={false}
        className={className}
        {...props}
      />
    );
  }

  // Fallback to original spinner
  const baseClasses = "animate-spin rounded-full border-2 border-solid";
  
  const sizeClasses = {
    sm: "h-4 w-4 border-[1.5px]",
    default: "h-6 w-6",
    lg: "h-8 w-8 border-[3px]",
    xl: "h-12 w-12 border-[3px]"
  };

  const variantClasses = {
    default: "border-gray-300 border-t-blue-600",
    white: "border-white/30 border-t-white",
    primary: "border-blue-200 border-t-blue-600",
    muted: "border-gray-200 border-t-gray-500"
  };

  return (
    <div
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
};

export default LoadingSpinner; 