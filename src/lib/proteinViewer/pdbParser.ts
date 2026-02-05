// pdb file parsing utilities

export interface PdbAtom {
  serial: number;
  name: string;
  altLoc: string;
  resName: string;
  chainId: string;
  resSeq: number;
  iCode: string;
  x: number;
  y: number;
  z: number;
  occupancy: number;
  tempFactor: number;
  element: string;
}

export interface PdbResidue {
  resSeq: number;
  resName: string;
  chainId: string;
  atoms: PdbAtom[];
}

export interface PdbChain {
  chainId: string;
  residues: PdbResidue[];
}

export interface PdbStructure {
  atoms: PdbAtom[];
  residues: PdbResidue[];
  chains: PdbChain[];
  helices: { start: number; end: number; chainId: string }[];
  sheets: { start: number; end: number; chainId: string }[];
}

// parse atom record from pdb line
const parseAtomLine = (line: string): PdbAtom | null => {
  if (!line.startsWith('atom') && !line.startsWith('hetatm')) {
    return null;
  }

  try {
    return {
      serial: parseInt(line.substring(6, 11).trim()),
      name: line.substring(12, 16).trim().toLowerCase(),
      altLoc: line.substring(16, 17).trim().toLowerCase(),
      resName: line.substring(17, 20).trim().toLowerCase(),
      chainId: line.substring(21, 22).trim().toLowerCase(),
      resSeq: parseInt(line.substring(22, 26).trim()),
      iCode: line.substring(26, 27).trim().toLowerCase(),
      x: parseFloat(line.substring(30, 38).trim()),
      y: parseFloat(line.substring(38, 46).trim()),
      z: parseFloat(line.substring(46, 54).trim()),
      occupancy: parseFloat(line.substring(54, 60).trim()) || 1.0,
      tempFactor: parseFloat(line.substring(60, 66).trim()) || 0.0,
      element: line.substring(76, 78).trim().toLowerCase() || line.substring(12, 14).trim().toLowerCase(),
    };
  } catch {
    return null;
  }
};

// parse helix record from pdb line
const parseHelixLine = (line: string): { start: number; end: number; chainId: string } | null => {
  if (!line.startsWith('helix')) {
    return null;
  }

  try {
    return {
      chainId: line.substring(19, 20).trim().toLowerCase(),
      start: parseInt(line.substring(21, 25).trim()),
      end: parseInt(line.substring(33, 37).trim()),
    };
  } catch {
    return null;
  }
};

// parse sheet record from pdb line
const parseSheetLine = (line: string): { start: number; end: number; chainId: string } | null => {
  if (!line.startsWith('sheet')) {
    return null;
  }

  try {
    return {
      chainId: line.substring(21, 22).trim().toLowerCase(),
      start: parseInt(line.substring(22, 26).trim()),
      end: parseInt(line.substring(33, 37).trim()),
    };
  } catch {
    return null;
  }
};

// parse complete pdb content
export const parsePdb = (pdbContent: string): PdbStructure => {
  const lines = pdbContent.split('\n');
  const atoms: PdbAtom[] = [];
  const helices: { start: number; end: number; chainId: string }[] = [];
  const sheets: { start: number; end: number; chainId: string }[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    const atom = parseAtomLine(lowerLine);
    if (atom) {
      atoms.push(atom);
      continue;
    }

    const helix = parseHelixLine(lowerLine);
    if (helix) {
      helices.push(helix);
      continue;
    }

    const sheet = parseSheetLine(lowerLine);
    if (sheet) {
      sheets.push(sheet);
    }
  }

  // group atoms into residues
  const residueMap = new Map<string, PdbResidue>();
  for (const atom of atoms) {
    const key = `${atom.chainId}_${atom.resSeq}`;
    if (!residueMap.has(key)) {
      residueMap.set(key, {
        resSeq: atom.resSeq,
        resName: atom.resName,
        chainId: atom.chainId,
        atoms: [],
      });
    }
    residueMap.get(key)!.atoms.push(atom);
  }
  const residues = Array.from(residueMap.values());

  // group residues into chains
  const chainMap = new Map<string, PdbChain>();
  for (const residue of residues) {
    if (!chainMap.has(residue.chainId)) {
      chainMap.set(residue.chainId, {
        chainId: residue.chainId,
        residues: [],
      });
    }
    chainMap.get(residue.chainId)!.residues.push(residue);
  }
  const chains = Array.from(chainMap.values());

  // sort residues within each chain
  for (const chain of chains) {
    chain.residues.sort((a, b) => a.resSeq - b.resSeq);
  }

  return { atoms, residues, chains, helices, sheets };
};

// validate pdb file content
export const validatePdb = (content: string): { valid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'empty file content' };
  }

  const lines = content.split('\n');
  let hasAtomRecords = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    if (lowerLine.startsWith('atom') || lowerLine.startsWith('hetatm')) {
      hasAtomRecords = true;
      break;
    }
  }

  if (!hasAtomRecords) {
    return { valid: false, error: 'no atom records found in pdb file' };
  }

  return { valid: true };
};

// extract protein name from pdb content
export const extractProteinName = (pdbContent: string): string => {
  const lines = pdbContent.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().startsWith('header')) {
      return line.substring(10, 50).trim().toLowerCase() || 'unknown protein';
    }
    if (line.toLowerCase().startsWith('title')) {
      return line.substring(10).trim().toLowerCase() || 'unknown protein';
    }
  }
  
  return 'unknown protein';
};
