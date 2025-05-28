'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PianoLoading from "@/components/ui/piano-loading";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { SectionLoading, InlineLoading, ButtonLoading } from "@/components/ui/loading-state";

export default function LoadingDemo() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const handleButtonLoading = () => {
    setIsButtonLoading(true);
    setTimeout(() => setIsButtonLoading(false), 3000);
  };

  const handleOverlayDemo = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
      <div className="mb-8 pt-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Piano Loading Animations</h1>
        <p className="text-gray-600">Beautiful piano-themed loading animations across the app</p>
      </div>

      <div className="mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Different Sizes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <PianoLoading size="sm" message="Small" />
            <PianoLoading size="default" message="Default" />
            <PianoLoading size="lg" message="Large" />
            <PianoLoading size="xl" message="Extra Large" />
          </div>
        </Card>
      </div>

      <div className="mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
          <div className="space-y-4">
            <Button 
              onClick={handleButtonLoading}
              disabled={isButtonLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isButtonLoading ? (
                <ButtonLoading message="Loading..." />
              ) : (
                "Test Button Loading"
              )}
            </Button>
            
            <Button 
              onClick={handleOverlayDemo}
              className="bg-green-600 hover:bg-green-700 text-white ml-4"
            >
              Show Overlay Demo
            </Button>
          </div>
        </Card>
      </div>

      <LoadingOverlay 
        isVisible={showOverlay} 
        message="Loading your scales..."
      />
    </div>
  );
} 