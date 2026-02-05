"use client";

import React, { useEffect, useState } from "react";
import { getAminoAcidTypeColor } from "@/lib/proteinViewer/aminoAcidData";

interface AminoAcidTooltipProps {
  aminoAcid: AminoAcidInfo | null;
  residueIndex: number | null;
  position: { x: number; y: number };
  visible: boolean;
}

const AminoAcidTooltip: React.FC<AminoAcidTooltipProps> = ({
  aminoAcid,
  residueIndex,
  position,
  visible,
}) => {
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (!visible) return;

    // adjust position to stay within viewport
    const tooltipWidth = 220;
    const tooltipHeight = 160;
    const padding = 16;

    let x = position.x + 16;
    let y = position.y + 16;

    if (typeof window !== "undefined") {
      if (x + tooltipWidth > window.innerWidth - padding) {
        x = position.x - tooltipWidth - 16;
      }
      if (y + tooltipHeight > window.innerHeight - padding) {
        y = position.y - tooltipHeight - 16;
      }
      if (x < padding) x = padding;
      if (y < padding) y = padding;
    }

    setAdjustedPosition({ x, y });
  }, [position, visible]);

  if (!visible || !aminoAcid) return null;

  const typeColor = getAminoAcidTypeColor(aminoAcid.type);

  return (
    <div
      className="fixed z-50 pointer-events-none animate-fadeIn"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <div className="bg-gray-900/95 dark:bg-boxdark/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden min-w-[200px]">
        {/* header with amino acid name */}
        <div
          className="px-4 py-3 border-b border-gray-700/50"
          style={{ backgroundColor: `${typeColor}20` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: typeColor }}
            />
            <span className="text-white font-semibold text-sm">
              {aminoAcid.fullName}
            </span>
          </div>
          <div className="text-gray-400 text-xs mt-1">
            residue #{residueIndex}
          </div>
        </div>

        {/* details */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">code</span>
            <span className="text-white font-mono text-sm">
              {aminoAcid.code.toUpperCase()} / {aminoAcid.threeLetter.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">type</span>
            <span
              className="text-sm font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: typeColor }}
            >
              {aminoAcid.type}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">molecular weight</span>
            <span className="text-white text-sm">
              {aminoAcid.molecularWeight.toFixed(2)} da
            </span>
          </div>
        </div>

        {/* footer hint */}
        <div className="px-4 py-2 bg-gray-800/50 dark:bg-boxdark-2/50">
          <span className="text-gray-500 text-xs">click to select</span>
        </div>
      </div>
    </div>
  );
};

export default AminoAcidTooltip;
