import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle } from "lucide-react";

export default function AllSessionsModal({ isOpen, onClose, sessions, onStartSession }) {
  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    
    const now = new Date();
    const sessionTime = new Date(timestamp);
    const diffInHours = Math.floor((now - sessionTime) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return sessionTime.toLocaleDateString();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>All Practice Sessions</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-3 mt-4">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg font-medium mb-2">No practice sessions yet</div>
              <div className="text-sm">Start practicing to see your sessions here!</div>
            </div>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-blue-600 font-medium">
                        {session.scale}
                      </p>
                      {session.completed && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        {session.practiceType || session.hand || session.pattern}, {session.octaves} Octave{session.octaves > 1 ? 's' : ''}, {session.bpm} BPM
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {session.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDuration(session.duration)}</span>
                          </div>
                        )}
                        
                        {session.timestamp && (
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(session.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => onStartSession && onStartSession(session)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 ml-4"
                  >
                    Start
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button 
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 