"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { getAminoAcidFromThreeLetter } from "@/lib/proteinViewer/aminoAcidData";
import AminoAcidTooltip from "./AminoAcidTooltip";

interface MolstarViewerProps {
  pdbData: string | null;
  bindingSites: BindingSite[];
  highlightedSites: string[];
  aminoAcidFilter: AminoAcidTypeFilter;
  onResidueHover?: (residue: { index: number; name: string } | null) => void;
  onResidueSelect?: (residue: { index: number; name: string } | null) => void;
}

const MolstarViewer: React.FC<MolstarViewerProps> = ({
  pdbData,
  bindingSites,
  highlightedSites,
  aminoAcidFilter,
  onResidueHover,
  onResidueSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tooltip, setTooltip] = useState<{
    aminoAcid: AminoAcidInfo | null;
    residueIndex: number | null;
    position: { x: number; y: number };
    visible: boolean;
  }>({
    aminoAcid: null,
    residueIndex: null,
    position: { x: 0, y: 0 },
    visible: false,
  });

  // initialize molstar viewer
  useEffect(() => {
    let mounted = true;

    const initViewer = async () => {
      if (!containerRef.current || isInitialized) return;

      try {
        setIsLoading(true);
        setError(null);

        // dynamically import mol* viewer
        const molstar = await import("molstar/lib/apps/viewer/app");

        if (!mounted || !containerRef.current) return;

        // create viewer instance with minimal ui
        const viewer = await molstar.Viewer.create(containerRef.current, {
          layoutIsExpanded: false,
          layoutShowControls: false,
          layoutShowRemoteState: false,
          layoutShowSequence: false,
          layoutShowLog: false,
          layoutShowLeftPanel: false,
          viewportShowExpand: false,
          viewportShowSelectionMode: false,
          viewportShowAnimation: false,
          pdbProvider: "rcsb",
          emdbProvider: "rcsb",
        });

        if (!mounted) {
          viewer?.dispose();
          return;
        }

        viewerRef.current = viewer;
        setIsInitialized(true);
        setIsLoading(false);

        // load initial pdb data if available
        if (pdbData) {
          await loadPdbData(pdbData);
        }
      } catch (err) {
        console.error("failed to initialize molstar viewer:", err);
        if (mounted) {
          setError("failed to initialize molecular viewer");
          setIsLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      mounted = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.dispose();
        } catch (e) {
          console.error("error disposing viewer:", e);
        }
        viewerRef.current = null;
      }
    };
  }, []);

  // load pdb data
  const loadPdbData = async (pdbContent: string) => {
    if (!viewerRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // clear existing structures
      await viewerRef.current.plugin.clear();

      // load pdb string data
      const data = await viewerRef.current.plugin.builders.data.rawData({
        data: pdbContent,
        label: "uploaded protein",
      });

      const trajectory = await viewerRef.current.plugin.builders.structure.parseTrajectory(
        data,
        "pdb"
      );

      await viewerRef.current.plugin.builders.structure.hierarchy.applyPreset(
        trajectory,
        "default"
      );

      // reset camera
      viewerRef.current.plugin.canvas3d?.requestCameraReset();

      setIsLoading(false);
    } catch (err) {
      console.error("failed to load pdb:", err);
      setError("failed to load protein structure");
      setIsLoading(false);
    }
  };

  // load pdb when data changes
  useEffect(() => {
    if (pdbData && isInitialized) {
      loadPdbData(pdbData);
    }
  }, [pdbData, isInitialized]);

  // handle mouse move for tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !viewerRef.current?.plugin) return;

      try {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const pickResult = viewerRef.current.plugin.canvas3d?.identify(x, y);

        if (pickResult?.current?.loci) {
          const lociLabel = viewerRef.current.plugin.managers?.lociLabels?.get(
            pickResult.current.loci
          );

          if (lociLabel && lociLabel.length > 0) {
            const label = lociLabel[0];
            const match = label.match(/([a-z]{3})\s*(\d+)/i);

            if (match) {
              const resName = match[1].toLowerCase();
              const resIndex = parseInt(match[2]);
              const aminoAcid = getAminoAcidFromThreeLetter(resName);

              if (aminoAcid) {
                setTooltip({
                  aminoAcid,
                  residueIndex: resIndex,
                  position: { x: e.clientX, y: e.clientY },
                  visible: true,
                });
                onResidueHover?.({ index: resIndex, name: resName });
                return;
              }
            }
          }
        }
      } catch (err) {
        // ignore pick errors
      }

      setTooltip((prev) => ({ ...prev, visible: false }));
      onResidueHover?.(null);
    },
    [onResidueHover]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
    onResidueHover?.(null);
  }, [onResidueHover]);

  return (
    <div className="relative w-full h-full">
      {/* viewer container */}
      <div
        ref={containerRef}
        className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
        style={{ minHeight: "500px" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-xl z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/30 rounded-full" />
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-400 text-sm">loading structure...</p>
          </div>
        </div>
      )}

      {/* error overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm rounded-xl z-10">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-red text-lg font-medium mb-2">{error}</p>
            <p className="text-gray-400 text-sm mb-4">
              the molecular viewer could not be loaded. this may be due to browser
              compatibility or webgl issues.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm transition-colors"
            >
              reload page
            </button>
          </div>
        </div>
      )}

      {/* placeholder when no data */}
      {!pdbData && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
          <div className="text-center p-8">
            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              <svg
                className="w-14 h-14 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <p className="text-gray-400 text-xl font-medium mb-2">
              upload a pdb file to view
            </p>
            <p className="text-gray-600 text-sm">
              interactive 3d protein structure visualization
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-gray-500 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary/50" />
                rotate: drag
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary/50" />
                zoom: scroll
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-meta-3/50" />
                pan: shift+drag
              </span>
            </div>
          </div>
        </div>
      )}

      {/* amino acid tooltip */}
      <AminoAcidTooltip
        aminoAcid={tooltip.aminoAcid}
        residueIndex={tooltip.residueIndex}
        position={tooltip.position}
        visible={tooltip.visible}
      />
    </div>
  );
};

export default MolstarViewer;
