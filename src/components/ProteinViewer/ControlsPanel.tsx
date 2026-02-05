"use client";

import React from "react";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3d,
  Eye,
  EyeOff,
  Palette,
} from "lucide-react";
import { getAminoAcidTypeColor, getAminoAcidsByType } from "@/lib/proteinViewer/aminoAcidData";

interface ControlsPanelProps {
  aminoAcidFilter: AminoAcidTypeFilter;
  onFilterChange: (filter: AminoAcidTypeFilter) => void;
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const aminoAcidTypes: { key: keyof AminoAcidTypeFilter; label: string }[] = [
  { key: "hydrophobic", label: "hydrophobic" },
  { key: "polar", label: "polar" },
  { key: "positive", label: "positive" },
  { key: "negative", label: "negative" },
  { key: "special", label: "special" },
];

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  aminoAcidFilter,
  onFilterChange,
  onResetView,
  onZoomIn,
  onZoomOut,
}) => {
  const handleFilterToggle = (key: keyof AminoAcidTypeFilter) => {
    onFilterChange({
      ...aminoAcidFilter,
      [key]: !aminoAcidFilter[key],
    });
  };

  const handleSelectAll = () => {
    onFilterChange({
      hydrophobic: true,
      polar: true,
      positive: true,
      negative: true,
      special: true,
    });
  };

  const handleClearAll = () => {
    onFilterChange({
      hydrophobic: false,
      polar: false,
      positive: false,
      negative: false,
      special: false,
    });
  };

  const activeCount = Object.values(aminoAcidFilter).filter(Boolean).length;

  return (
    <div className="bg-gray-900/50 dark:bg-boxdark/50 backdrop-blur-md rounded-2xl border border-gray-700/30 overflow-hidden">
      {/* header */}
      <div className="px-5 py-4 border-b border-gray-700/30">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Move3d size={18} className="text-primary" />
          viewer controls
        </h3>
      </div>

      {/* view controls */}
      <div className="px-5 py-4 border-b border-gray-700/30">
        <p className="text-gray-400 text-xs mb-3 uppercase tracking-wider">
          camera
        </p>
        <div className="flex gap-2">
          <button
            onClick={onZoomIn}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-200 text-gray-300 hover:text-white group"
          >
            <ZoomIn
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-xs">zoom in</span>
          </button>
          <button
            onClick={onZoomOut}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all duration-200 text-gray-300 hover:text-white group"
          >
            <ZoomOut
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-xs">zoom out</span>
          </button>
        </div>
        <button
          onClick={onResetView}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all duration-200 text-primary group"
        >
          <RotateCcw
            size={16}
            className="group-hover:rotate-[-360deg] transition-transform duration-500"
          />
          <span className="text-xs font-medium">reset view</span>
        </button>
      </div>

      {/* amino acid filter */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-xs uppercase tracking-wider flex items-center gap-2">
            <Palette size={14} />
            amino acid filter
          </p>
          <span className="text-primary text-xs font-medium">
            {activeCount}/5 active
          </span>
        </div>

        {/* filter buttons */}
        <div className="space-y-2">
          {aminoAcidTypes.map(({ key, label }) => {
            const isActive = aminoAcidFilter[key];
            const color = getAminoAcidTypeColor(key as AminoAcidInfo["type"]);
            const aminoAcids = getAminoAcidsByType(key as AminoAcidInfo["type"]);

            return (
              <button
                key={key}
                onClick={() => handleFilterToggle(key)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "bg-gray-700/50"
                      : "bg-gray-800/30 hover:bg-gray-800/50"
                  }
                `}
              >
                <div
                  className={`
                    w-5 h-5 rounded flex items-center justify-center transition-all duration-200
                    ${isActive ? "" : "opacity-40"}
                  `}
                  style={{ backgroundColor: isActive ? color : `${color}40` }}
                >
                  {isActive ? (
                    <Eye size={12} className="text-white" />
                  ) : (
                    <EyeOff size={12} className="text-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <span
                    className={`text-sm ${
                      isActive ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-gray-500 text-xs">
                  {aminoAcids.length} aa
                </span>
              </button>
            );
          })}
        </div>

        {/* quick actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSelectAll}
            className="flex-1 px-3 py-2 text-xs text-gray-400 hover:text-white bg-gray-800/30 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            show all
          </button>
          <button
            onClick={handleClearAll}
            className="flex-1 px-3 py-2 text-xs text-gray-400 hover:text-white bg-gray-800/30 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            hide all
          </button>
        </div>
      </div>

      {/* controls hint */}
      <div className="px-5 py-3 bg-gray-800/30 border-t border-gray-700/30">
        <p className="text-gray-500 text-xs">
          <span className="text-gray-400">tip:</span> drag to rotate, scroll to
          zoom, shift+drag to pan
        </p>
      </div>
    </div>
  );
};

export default ControlsPanel;
