import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

const getLevelColor = (level) => {
  switch (level) {
    case "Easy":
      return "bg-green-500 hover:bg-green-600";
    case "Intermediate":
      return "bg-yellow-500 hover:bg-yellow-600";
    case "Advanced":
      return "bg-red-500 hover:bg-red-600";
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
};

export default function ScaleCard({ scale, onClick }) {
  return (
    <Card 
      className="p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick && onClick(scale)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-gray-600" />
          <span className="text-lg font-medium text-gray-900">{scale.name}</span>
        </div>
        <Badge className={`text-white px-3 py-1 rounded-full text-sm ${getLevelColor(scale.level)}`}>
          {scale.level}
        </Badge>
      </div>
    </Card>
  );
} 