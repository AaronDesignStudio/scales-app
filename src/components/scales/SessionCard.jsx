import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SessionCard({ session, onStart }) {
  return (
    <Card className="py-1.5 px-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <p className="text-blue-600 dark:text-blue-400 font-medium text-sm truncate">
            {session.scale}
          </p>
          <span className="text-xs text-muted-foreground truncate">
            {session.practiceType || session.hand || session.pattern}, {session.octaves} Oct, {session.bpm} BPM
          </span>
        </div>
        
        <Button 
          onClick={() => onStart && onStart(session)}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full px-2 py-0.5 text-xs h-5 ml-1.5 flex-shrink-0"
        >
          Start
        </Button>
      </div>
    </Card>
  );
} 