import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { SessionManager } from "@/lib/sessionService";

const getLevelColor = (level) => {
  switch (level) {
    case "Easy":
      return "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700";
    case "Intermediate":
      return "bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700";
    case "Advanced":
      return "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700";
    default:
      return "bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700";
  }
};

export default function ScaleCard({ scale, onClick }) {
  const [hasBeenPracticed, setHasBeenPracticed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPracticeHistory = async () => {
      try {
        const exercises = await SessionManager.getPracticedExercisesForScale(scale.name);
        setHasBeenPracticed(exercises.length > 0);
      } catch (error) {
        console.error('Error checking practice history:', error);
        setHasBeenPracticed(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPracticeHistory();
  }, [scale.name]);
  
  return (
    <Card 
      className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:shadow-md dark:hover:shadow-lg transition-shadow hover:bg-accent"
      onClick={() => onClick && onClick(scale)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isLoading && hasBeenPracticed && (
            <Eye className="w-5 h-5 text-muted-foreground" />
          )}
          {(!hasBeenPracticed || isLoading) && (
            <div className="w-5 h-5" /> // Placeholder to maintain spacing
          )}
          <span className="text-lg font-medium text-foreground">{scale.name}</span>
        </div>
        <Badge className={`text-white px-3 py-1 rounded-full text-sm ${getLevelColor(scale.level)}`}>
          {scale.level}
        </Badge>
      </div>
    </Card>
  );
} 