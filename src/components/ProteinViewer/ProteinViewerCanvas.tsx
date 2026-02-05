"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { parsePdb, PdbAtom } from "@/lib/proteinViewer/pdbParser";
import { getAminoAcidFromThreeLetter, getAminoAcidTypeColor } from "@/lib/proteinViewer/aminoAcidData";
import AminoAcidTooltip from "./AminoAcidTooltip";

interface ProteinViewerCanvasProps {
  pdbData: string | null;
  bindingSites: BindingSite[];
  highlightedSites: string[];
  aminoAcidFilter: AminoAcidTypeFilter;
  onResidueHover?: (residue: { index: number; name: string } | null) => void;
  onResidueSelect?: (residue: { index: number; name: string } | null) => void;
}

// atom colors based on element
const getAtomColor = (element: string): number => {
  const colors: Record<string, number> = {
    c: 0x808080,  // carbon - gray
    n: 0x3050f8,  // nitrogen - blue
    o: 0xff0d0d,  // oxygen - red
    s: 0xffff30,  // sulfur - yellow
    p: 0xff8000,  // phosphorus - orange
    h: 0xffffff,  // hydrogen - white
    fe: 0xe06633, // iron - rust
    ca: 0x3dff00, // calcium - green
    mg: 0x8aff00, // magnesium - lime
    zn: 0x7d80b0, // zinc - slate
  };
  return colors[element.toLowerCase()] || 0xff69b4; // default pink
};

// atom radii (van der waals)
const getAtomRadius = (element: string): number => {
  const radii: Record<string, number> = {
    c: 0.77,
    n: 0.75,
    o: 0.73,
    s: 1.02,
    p: 1.06,
    h: 0.37,
    fe: 1.26,
    ca: 1.97,
    mg: 1.45,
    zn: 1.35,
  };
  return radii[element.toLowerCase()] || 0.77;
};

const ProteinViewerCanvas: React.FC<ProteinViewerCanvasProps> = ({
  pdbData,
  bindingSites,
  highlightedSites,
  aminoAcidFilter,
  onResidueHover,
  onResidueSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const atomMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; atom: PdbAtom }>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // initialize three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a2e);
      sceneRef.current = scene;

      // create camera
      const camera = new THREE.PerspectiveCamera(
        60,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        2000
      );
      camera.position.set(0, 0, 100);
      cameraRef.current = camera;

      // create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // create orbit controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.8;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.8;
      controlsRef.current = controls;

      // add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      // add directional lights
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight1.position.set(50, 50, 50);
      scene.add(directionalLight1);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight2.position.set(-50, -50, -50);
      scene.add(directionalLight2);

      // animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // handle resize
      const handleResize = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
        controls.dispose();
      };
    } catch (err) {
      console.error("failed to initialize 3d viewer:", err);
      setError("failed to initialize 3d viewer");
    }
  }, []);

  // load protein structure when pdb data changes
  useEffect(() => {
    if (!pdbData || !sceneRef.current || !cameraRef.current || !controlsRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const controls = controlsRef.current;

      // remove old atoms
      atomMeshesRef.current.forEach(({ mesh }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      atomMeshesRef.current.clear();

      // parse pdb
      const structure = parsePdb(pdbData);

      if (structure.atoms.length === 0) {
        setError("no atoms found in pdb file");
        setIsLoading(false);
        return;
      }

      // calculate center of mass
      let centerX = 0, centerY = 0, centerZ = 0;
      structure.atoms.forEach((atom) => {
        centerX += atom.x;
        centerY += atom.y;
        centerZ += atom.z;
      });
      centerX /= structure.atoms.length;
      centerY /= structure.atoms.length;
      centerZ /= structure.atoms.length;

      // create atom spheres (only show backbone atoms for performance)
      const backboneAtoms = ["ca", "c", "n", "o"];
      const atomsToRender = structure.atoms.filter(
        (atom) => backboneAtoms.includes(atom.name.toLowerCase()) || atom.name === "ca"
      );

      // if too few backbone atoms, show all
      const finalAtoms = atomsToRender.length > 10 ? atomsToRender : structure.atoms;

      // create optimized geometry
      const sphereGeometry = new THREE.SphereGeometry(1, 16, 12);

      finalAtoms.forEach((atom, index) => {
        // get amino acid info for color
        const aminoAcid = getAminoAcidFromThreeLetter(atom.resName);
        let color: number;

        if (aminoAcid) {
          const typeColor = getAminoAcidTypeColor(aminoAcid.type);
          color = parseInt(typeColor.replace("#", ""), 16);
        } else {
          color = getAtomColor(atom.element);
        }

        const material = new THREE.MeshPhongMaterial({
          color: color,
          shininess: 100,
          specular: 0x444444,
        });

        const mesh = new THREE.Mesh(sphereGeometry.clone(), material);
        const radius = atom.name.toLowerCase() === "ca" ? 1.0 : getAtomRadius(atom.element) * 0.5;
        mesh.scale.setScalar(radius);
        mesh.position.set(
          atom.x - centerX,
          atom.y - centerY,
          atom.z - centerZ
        );

        scene.add(mesh);
        atomMeshesRef.current.set(`${atom.chainId}_${atom.resSeq}_${atom.serial}`, {
          mesh,
          atom,
        });
      });

      // create bonds between consecutive ca atoms
      const caAtoms = finalAtoms.filter((a) => a.name.toLowerCase() === "ca");
      const bondMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });

      for (let i = 0; i < caAtoms.length - 1; i++) {
        const atom1 = caAtoms[i];
        const atom2 = caAtoms[i + 1];

        // check if atoms are in same chain and sequential
        if (atom1.chainId === atom2.chainId && Math.abs(atom1.resSeq - atom2.resSeq) <= 1) {
          const points = [
            new THREE.Vector3(atom1.x - centerX, atom1.y - centerY, atom1.z - centerZ),
            new THREE.Vector3(atom2.x - centerX, atom2.y - centerY, atom2.z - centerZ),
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, bondMaterial);
          scene.add(line);
        }
      }

      // calculate bounding box and adjust camera
      let maxDist = 0;
      finalAtoms.forEach((atom) => {
        const dist = Math.sqrt(
          Math.pow(atom.x - centerX, 2) +
          Math.pow(atom.y - centerY, 2) +
          Math.pow(atom.z - centerZ, 2)
        );
        maxDist = Math.max(maxDist, dist);
      });

      camera.position.set(0, 0, maxDist * 2.5);
      controls.target.set(0, 0, 0);
      controls.update();

      setIsLoading(false);
    } catch (err) {
      console.error("failed to load protein structure:", err);
      setError("failed to load protein structure");
      setIsLoading(false);
    }
  }, [pdbData]);

  // handle mouse move for hover effects
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || !sceneRef.current || !cameraRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const meshes = Array.from(atomMeshesRef.current.values()).map((v) => v.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const entry = Array.from(atomMeshesRef.current.values()).find(
          (v) => v.mesh === hitMesh
        );

        if (entry) {
          const aminoAcid = getAminoAcidFromThreeLetter(entry.atom.resName);
          if (aminoAcid) {
            setTooltip({
              aminoAcid,
              residueIndex: entry.atom.resSeq,
              position: { x: e.clientX, y: e.clientY },
              visible: true,
            });
            onResidueHover?.({ index: entry.atom.resSeq, name: entry.atom.resName });
            return;
          }
        }
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

  // reset view
  const resetView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      const atoms = Array.from(atomMeshesRef.current.values());
      if (atoms.length > 0) {
        let maxDist = 0;
        atoms.forEach(({ mesh }) => {
          const dist = mesh.position.length();
          maxDist = Math.max(maxDist, dist);
        });
        cameraRef.current.position.set(0, 0, maxDist * 2.5);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* viewer container */}
      <div
        ref={containerRef}
        className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]"
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
              please try uploading a different pdb file
            </p>
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
                pan: right-click drag
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

export default ProteinViewerCanvas;
