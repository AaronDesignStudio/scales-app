import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SessionCard({ session, onStart }) {
  return (
    <Card className="p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-600 font-medium">
            {session.scale}
            {session.hand && `, ${session.hand}`}
            {session.pattern && `, ${session.pattern}`}
            , {session.octaves} Octaves, {session.bpm} BPM
          </p>
        </div>
        <Button 
          onClick={() => onStart && onStart(session)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2"
        >
          Start
        </Button>
      </div>
    </Card>
  );
} 