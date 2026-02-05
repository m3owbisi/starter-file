"use client";

import React, { useState, useCallback, useMemo } from "react";
import PdbUploader from "./PdbUploader";
import ProteinViewerCanvas from "./ProteinViewerCanvas";
import ControlsPanel from "./ControlsPanel";
import BindingSitePanel from "./BindingSitePanel";
import { parsePdb, extractProteinName } from "@/lib/proteinViewer/pdbParser";

const ProteinViewer: React.FC = () => {
  // protein data state
  const [pdbData, setPdbData] = useState<string | null>(null);
  const [proteinName, setProteinName] = useState<string>("upload a protein");
  const [isLoading, setIsLoading] = useState(false);

  // binding sites state
  const [bindingSites, setBindingSites] = useState<BindingSite[]>([]);
  const [highlightedSites, setHighlightedSites] = useState<string[]>([]);

  // amino acid filter state
  const [aminoAcidFilter, setAminoAcidFilter] = useState<AminoAcidTypeFilter>({
    hydrophobic: true,
    polar: true,
    positive: true,
    negative: true,
    special: true,
  });

  // selected/hovered residue state
  const [hoveredResidue, setHoveredResidue] = useState<{
    index: number;
    name: string;
  } | null>(null);

  // generate unique id for binding sites
  const generateId = useCallback(() => {
    return `site-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // handle pdb file load
  const handleFileLoad = useCallback((content: string, fileName: string) => {
    setIsLoading(true);
    
    // slight delay for visual feedback
    setTimeout(() => {
      setPdbData(content);
      const name = extractProteinName(content) || fileName.replace(/\.(pdb|ent)$/i, '').toLowerCase();
      setProteinName(name);
      setBindingSites([]); // clear previous binding sites
      setHighlightedSites([]);
      setIsLoading(false);
    }, 500);
  }, []);

  // handle residue hover
  const handleResidueHover = useCallback(
    (residue: { index: number; name: string } | null) => {
      setHoveredResidue(residue);
    },
    []
  );

  // handle residue selection
  const handleResidueSelect = useCallback(
    (residue: { index: number; name: string } | null) => {
      // could be used to add residue to a new binding site
      console.log("selected residue:", residue);
    },
    []
  );

  // binding site handlers
  const handleSiteToggle = useCallback((siteId: string) => {
    setHighlightedSites((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  }, []);

  const handleSiteAdd = useCallback(
    (siteData: Omit<BindingSite, "id">) => {
      const newSite: BindingSite = {
        ...siteData,
        id: generateId(),
      };
      setBindingSites((prev) => [...prev, newSite]);
      setHighlightedSites((prev) => [...prev, newSite.id]);
    },
    [generateId]
  );

  const handleSiteDelete = useCallback((siteId: string) => {
    setBindingSites((prev) => prev.filter((s) => s.id !== siteId));
    setHighlightedSites((prev) => prev.filter((id) => id !== siteId));
  }, []);

  const handleSiteEdit = useCallback((site: BindingSite) => {
    // for now, just log - could open an edit modal
    console.log("edit site:", site);
  }, []);

  // viewer control handlers
  const handleResetView = useCallback(() => {
    // this would call the viewer's reset method
    console.log("reset view");
  }, []);

  const handleZoomIn = useCallback(() => {
    console.log("zoom in");
  }, []);

  const handleZoomOut = useCallback(() => {
    console.log("zoom out");
  }, []);

  // protein info
  const proteinInfo = useMemo(() => {
    if (!pdbData) return null;
    const structure = parsePdb(pdbData);
    return {
      chains: structure.chains.length,
      residues: structure.residues.length,
      atoms: structure.atoms.length,
      helices: structure.helices.length,
      sheets: structure.sheets.length,
    };
  }, [pdbData]);

  return (
    <div className="w-full">
      {/* top section: upload + protein info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* pdb uploader */}
        <div>
          <PdbUploader onFileLoad={handleFileLoad} isLoading={isLoading} />
        </div>

        {/* protein info card */}
        <div className="bg-gray-900/50 dark:bg-boxdark/50 backdrop-blur-md rounded-2xl border border-gray-700/30 p-6">
          <h3 className="text-white font-semibold text-lg mb-4">{proteinName}</h3>
          
          {proteinInfo ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-primary text-2xl font-bold">{proteinInfo.chains}</p>
                <p className="text-gray-400 text-sm">chains</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-secondary text-2xl font-bold">{proteinInfo.residues}</p>
                <p className="text-gray-400 text-sm">residues</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-meta-3 text-2xl font-bold">{proteinInfo.atoms}</p>
                <p className="text-gray-400 text-sm">atoms</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-meta-6 text-2xl font-bold">{proteinInfo.helices}</p>
                <p className="text-gray-400 text-sm">helices</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-meta-5 text-2xl font-bold">{proteinInfo.sheets}</p>
                <p className="text-gray-400 text-sm">sheets</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-meta-7 text-2xl font-bold">{bindingSites.length}</p>
                <p className="text-gray-400 text-sm">binding sites</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p className="text-sm">upload a pdb file to view protein details</p>
            </div>
          )}
        </div>
      </div>

      {/* main viewer section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 3d viewer - takes 3 columns on xl */}
        <div className="xl:col-span-3">
          <div className="bg-gray-900/50 dark:bg-boxdark/50 backdrop-blur-md rounded-2xl border border-gray-700/30 overflow-hidden">
            {/* viewer header */}
            <div className="px-5 py-4 border-b border-gray-700/30 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                  />
                </svg>
                3d structure viewer
              </h3>
              {hoveredResidue && (
                <span className="text-gray-400 text-sm">
                  hovering: {hoveredResidue.name} {hoveredResidue.index}
                </span>
              )}
            </div>

            {/* viewer container */}
            <div className="relative" style={{ height: "600px" }}>
              <ProteinViewerCanvas
                pdbData={pdbData}
                bindingSites={bindingSites}
                highlightedSites={highlightedSites}
                aminoAcidFilter={aminoAcidFilter}
                onResidueHover={handleResidueHover}
                onResidueSelect={handleResidueSelect}
              />
            </div>
          </div>
        </div>

        {/* side panels - takes 1 column on xl */}
        <div className="xl:col-span-1 space-y-6">
          {/* controls panel */}
          <ControlsPanel
            aminoAcidFilter={aminoAcidFilter}
            onFilterChange={setAminoAcidFilter}
            onResetView={handleResetView}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />

          {/* binding sites panel */}
          <BindingSitePanel
            bindingSites={bindingSites}
            highlightedSites={highlightedSites}
            onSiteToggle={handleSiteToggle}
            onSiteAdd={handleSiteAdd}
            onSiteDelete={handleSiteDelete}
            onSiteEdit={handleSiteEdit}
          />
        </div>
      </div>

      {/* responsive layout for tablet */}
      <style jsx>{`
        @media (max-width: 1279px) and (min-width: 768px) {
          .grid.xl\\:grid-cols-4 {
            grid-template-columns: 1fr 300px;
          }
          .xl\\:col-span-3 {
            grid-column: span 1;
          }
          .xl\\:col-span-1 {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ProteinViewer;
