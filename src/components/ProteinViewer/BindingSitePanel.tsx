"use client";

import React, { useState } from "react";
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Crosshair,
} from "lucide-react";

interface BindingSitePanelProps {
  bindingSites: BindingSite[];
  highlightedSites: string[];
  onSiteToggle: (siteId: string) => void;
  onSiteAdd: (site: Omit<BindingSite, "id">) => void;
  onSiteDelete: (siteId: string) => void;
  onSiteEdit: (site: BindingSite) => void;
}

// affinity color scale: low (red) -> medium (yellow) -> high (green)
const getAffinityColor = (affinity: number): string => {
  // assuming affinity is kd in nanomolar - lower is better
  if (affinity <= 1) return "#10b981"; // excellent - green
  if (affinity <= 10) return "#22c55e"; // very good
  if (affinity <= 100) return "#84cc16"; // good
  if (affinity <= 1000) return "#eab308"; // moderate - yellow
  if (affinity <= 10000) return "#f59e0b"; // weak
  return "#ef4444"; // very weak - red
};

const getAffinityLabel = (affinity: number): string => {
  if (affinity <= 1) return "excellent";
  if (affinity <= 10) return "strong";
  if (affinity <= 100) return "moderate";
  if (affinity <= 1000) return "weak";
  return "very weak";
};

const BindingSitePanel: React.FC<BindingSitePanelProps> = ({
  bindingSites,
  highlightedSites,
  onSiteToggle,
  onSiteAdd,
  onSiteDelete,
  onSiteEdit,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [expandedSite, setExpandedSite] = useState<string | null>(null);
  const [newSite, setNewSite] = useState({
    name: "",
    residues: "",
    color: "#3b82f6",
    affinity: "",
  });

  const handleAddSite = () => {
    if (!newSite.name.trim() || !newSite.residues.trim()) return;

    const residues = newSite.residues
      .split(",")
      .map((r) => parseInt(r.trim()))
      .filter((r) => !isNaN(r));

    if (residues.length === 0) return;

    onSiteAdd({
      name: newSite.name.toLowerCase(),
      residues,
      color: newSite.color,
      affinity: newSite.affinity ? parseFloat(newSite.affinity) : undefined,
    });

    setNewSite({ name: "", residues: "", color: "#3b82f6", affinity: "" });
    setIsAddingNew(false);
  };

  return (
    <div className="bg-gray-900/50 dark:bg-boxdark/50 backdrop-blur-md rounded-2xl border border-gray-700/30 overflow-hidden">
      {/* header */}
      <div className="px-5 py-4 border-b border-gray-700/30 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Target size={18} className="text-secondary" />
          binding sites
        </h3>
        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isAddingNew
              ? "bg-red/20 text-red"
              : "bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-600/50"
          }`}
        >
          <Plus
            size={16}
            className={`transition-transform duration-200 ${
              isAddingNew ? "rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* add new site form */}
      {isAddingNew && (
        <div className="px-5 py-4 border-b border-gray-700/30 bg-primary/5">
          <p className="text-gray-400 text-xs mb-3 uppercase tracking-wider">
            add new binding site
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="site name"
              value={newSite.name}
              onChange={(e) =>
                setNewSite({ ...newSite, name: e.target.value.toLowerCase() })
              }
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50"
            />
            <input
              type="text"
              placeholder="residue indices (e.g., 10, 15, 20)"
              value={newSite.residues}
              onChange={(e) =>
                setNewSite({ ...newSite, residues: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-gray-500 text-xs block mb-1">
                  color
                </label>
                <input
                  type="color"
                  value={newSite.color}
                  onChange={(e) =>
                    setNewSite({ ...newSite, color: e.target.value })
                  }
                  className="w-full h-9 rounded-lg cursor-pointer bg-gray-800/50 border border-gray-700/50"
                />
              </div>
              <div className="flex-1">
                <label className="text-gray-500 text-xs block mb-1">
                  kd (nm)
                </label>
                <input
                  type="number"
                  placeholder="optional"
                  value={newSite.affinity}
                  onChange={(e) =>
                    setNewSite({ ...newSite, affinity: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <button
              onClick={handleAddSite}
              disabled={!newSite.name.trim() || !newSite.residues.trim()}
              className="w-full py-2.5 bg-primary hover:bg-primary/80 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              add binding site
            </button>
          </div>
        </div>
      )}

      {/* binding sites list */}
      <div className="max-h-80 overflow-y-auto">
        {bindingSites.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800/50 flex items-center justify-center">
              <Crosshair size={24} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">no binding sites defined</p>
            <p className="text-gray-600 text-xs mt-1">
              click + to add a binding site
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/30">
            {bindingSites.map((site) => {
              const isHighlighted = highlightedSites.includes(site.id);
              const isExpanded = expandedSite === site.id;
              const affinityColor = site.affinity
                ? getAffinityColor(site.affinity)
                : null;

              return (
                <div key={site.id} className="relative">
                  {/* main row */}
                  <div
                    className={`
                      px-5 py-3 flex items-center gap-3 cursor-pointer transition-colors
                      ${isHighlighted ? "bg-gray-700/30" : "hover:bg-gray-800/30"}
                    `}
                    onClick={() => onSiteToggle(site.id)}
                  >
                    {/* color indicator */}
                    <div
                      className={`
                        w-4 h-4 rounded-full transition-all duration-200 ring-2
                        ${isHighlighted ? "ring-white/50 scale-110" : "ring-transparent"}
                      `}
                      style={{ backgroundColor: site.color }}
                    />

                    {/* site info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isHighlighted ? "text-white" : "text-gray-300"
                        }`}
                      >
                        {site.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {site.residues.length} residues
                      </p>
                    </div>

                    {/* affinity badge */}
                    {site.affinity && (
                      <div
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${affinityColor}20`,
                          color: affinityColor!,
                        }}
                      >
                        {site.affinity < 1
                          ? `${(site.affinity * 1000).toFixed(0)} pm`
                          : site.affinity >= 1000
                          ? `${(site.affinity / 1000).toFixed(1)} µm`
                          : `${site.affinity.toFixed(1)} nm`}
                      </div>
                    )}

                    {/* expand button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSite(isExpanded ? null : site.id);
                      }}
                      className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>

                  {/* expanded details */}
                  {isExpanded && (
                    <div className="px-5 py-3 bg-gray-800/30 border-t border-gray-700/20">
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-500 text-xs">
                            residues:{" "}
                          </span>
                          <span className="text-gray-300 text-xs font-mono">
                            {site.residues.join(", ")}
                          </span>
                        </div>
                        {site.affinity && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">
                              binding affinity:{" "}
                            </span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: affinityColor! }}
                            >
                              {getAffinityLabel(site.affinity)}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => onSiteEdit(site)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded text-gray-400 hover:text-white text-xs transition-colors"
                          >
                            <Edit2 size={12} />
                            edit
                          </button>
                          <button
                            onClick={() => onSiteDelete(site.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red/10 hover:bg-red/20 rounded text-red/70 hover:text-red text-xs transition-colors"
                          >
                            <Trash2 size={12} />
                            delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* affinity legend */}
      {bindingSites.some((s) => s.affinity) && (
        <div className="px-5 py-3 bg-gray-800/30 border-t border-gray-700/30">
          <p className="text-gray-500 text-xs mb-2">affinity scale (kd)</p>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            <div className="flex-1 bg-emerald-500" title="<1 nm" />
            <div className="flex-1 bg-lime-500" title="<10 nm" />
            <div className="flex-1 bg-yellow-500" title="<100 nm" />
            <div className="flex-1 bg-amber-500" title="<1 µm" />
            <div className="flex-1 bg-red-500" title=">1 µm" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-600 text-[10px]">strong</span>
            <span className="text-gray-600 text-[10px]">weak</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BindingSitePanel;
