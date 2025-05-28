'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Music, Check, Plus } from "lucide-react";
import { MAJOR_SCALES, MINOR_SCALES, isScaleInCollection } from "@/data/scales";

const AddScaleModal = ({ isOpen, onClose, userScales, onAddScale }) => {
  const [activeTab, setActiveTab] = useState('major');
  const [selectedScales, setSelectedScales] = useState([]);

  if (!isOpen) return null;

  const currentScales = activeTab === 'major' ? MAJOR_SCALES : MINOR_SCALES;

  const handleScaleToggle = (scale) => {
    if (isScaleInCollection(scale.name, userScales)) {
      return; // Can't select scales already in collection
    }

    setSelectedScales(prev => {
      const isSelected = prev.some(s => s.name === scale.name);
      if (isSelected) {
        return prev.filter(s => s.name !== scale.name);
      } else {
        return [...prev, scale];
      }
    });
  };

  const handleAddSelected = () => {
    // Pass all selected scales at once to prevent race conditions
    onAddScale(selectedScales);
    setSelectedScales([]);
    onClose();
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Advanced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Expert': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getAccidentalInfo = (scale) => {
    if (scale.sharps > 0) {
      return `${scale.sharps} sharp${scale.sharps > 1 ? 's' : ''}`;
    } else if (scale.flats > 0) {
      return `${scale.flats} flat${scale.flats > 1 ? 's' : ''}`;
    } else {
      return 'No accidentals';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[95vh] flex flex-col border dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-foreground">Add Scales</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full hover:bg-accent h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          <button
            onClick={() => setActiveTab('major')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'major'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Major ({MAJOR_SCALES.length})
          </button>
          <button
            onClick={() => setActiveTab('minor')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'minor'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Minor ({MINOR_SCALES.length})
          </button>
        </div>

        {/* Scales Grid */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="grid grid-cols-1 gap-3">
            {currentScales.map((scale, index) => {
              const isInCollection = isScaleInCollection(scale.name, userScales);
              const isSelected = selectedScales.some(s => s.name === scale.name);
              
              return (
                <Card
                  key={`${scale.name}-${index}`}
                  className={`p-3 cursor-pointer transition-all duration-200 ${
                    isInCollection
                      ? 'bg-muted border-border cursor-not-allowed opacity-60'
                      : isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'hover:bg-accent hover:border-border'
                  }`}
                  onClick={() => handleScaleToggle(scale)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground text-sm">{scale.name}</h3>
                    <div className="flex items-center gap-2">
                      {isInCollection ? (
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : isSelected ? (
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(scale.level)}`}>
                      {scale.level}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getAccidentalInfo(scale)}
                    </span>
                  </div>
                  
                  {isInCollection && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                      Already in your collection
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-muted-foreground">
              {selectedScales.length > 0 && (
                <span>
                  {selectedScales.length} scale{selectedScales.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 text-sm py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSelected}
              disabled={selectedScales.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 disabled:opacity-50"
            >
              Add {selectedScales.length > 0 ? `${selectedScales.length}` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddScaleModal; 