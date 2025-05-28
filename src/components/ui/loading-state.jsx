import { Card } from "./card";
import LoadingSpinner from "./loading-spinner";
import PianoLoading from "./piano-loading";
import { cn } from "@/lib/utils";

const LoadingState = ({ 
  message = "Loading...", 
  variant = "default",
  size = "default",
  className = "",
  showCard = true,
  icon,
  children,
  usePianoAnimation = true,
  ...props 
}) => {
  const pianoSizeMap = {
    sm: "sm",
    default: "default",
    lg: "lg",
    xl: "xl"
  };

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      size === "sm" && "gap-2 py-4",
      size === "lg" && "gap-4 py-8",
      size === "xl" && "gap-6 py-12",
      !showCard && "p-6"
    )}>
      {icon || (
        usePianoAnimation ? (
          <PianoLoading 
            size={pianoSizeMap[size] || "default"}
            message=""
            showMessage={false}
            speed={1}
          />
        ) : (
          <LoadingSpinner 
            size={size === "sm" ? "default" : size === "lg" ? "lg" : size === "xl" ? "xl" : "default"}
            variant={variant === "muted" ? "muted" : "primary"}
            usePianoAnimation={false}
          />
        )
      )}
      
      {message && (
        <div className={cn(
          "text-center font-medium",
          size === "sm" && "text-sm",
          size === "lg" && "text-lg",
          size === "xl" && "text-xl",
          variant === "muted" ? "text-gray-500" : "text-gray-700"
        )}>
          {message}
        </div>
      )}
      
      {children}
    </div>
  );

  if (!showCard) {
    return (
      <div className={cn("w-full", className)} {...props}>
        {content}
      </div>
    );
  }

  return (
    <Card className={cn(
      "w-full",
      size === "sm" && "p-4",
      size === "lg" && "p-8", 
      size === "xl" && "p-12",
      className
    )} {...props}>
      {content}
    </Card>
  );
};

// Specialized loading components for common use cases
export const PageLoading = ({ message = "Loading page..." }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingState 
      message={message}
      size="lg"
      showCard={true}
      className="max-w-md mx-4"
      usePianoAnimation={true}
    />
  </div>
);

export const SectionLoading = ({ message = "Loading..." }) => (
  <LoadingState 
    message={message}
    size="default"
    showCard={true}
    usePianoAnimation={true}
  />
);

export const InlineLoading = ({ message = "Loading..." }) => (
  <LoadingState 
    message={message}
    size="sm"
    variant="muted"
    showCard={false}
    className="py-4"
    usePianoAnimation={true}
  />
);

export const ButtonLoading = ({ message = "Loading..." }) => (
  <div className="flex items-center gap-2">
    <LoadingSpinner size="sm" variant="white" usePianoAnimation={false} />
    <span>{message}</span>
  </div>
);

export default LoadingState; 