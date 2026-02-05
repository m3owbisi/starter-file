// amino acid reference data with properties and classifications

export const aminoAcids: Record<string, AminoAcidInfo> = {
  'a': { code: 'a', threeLetter: 'ala', fullName: 'alanine', type: 'hydrophobic', molecularWeight: 89.09 },
  'r': { code: 'r', threeLetter: 'arg', fullName: 'arginine', type: 'positive', molecularWeight: 174.20 },
  'n': { code: 'n', threeLetter: 'asn', fullName: 'asparagine', type: 'polar', molecularWeight: 132.12 },
  'd': { code: 'd', threeLetter: 'asp', fullName: 'aspartic acid', type: 'negative', molecularWeight: 133.10 },
  'c': { code: 'c', threeLetter: 'cys', fullName: 'cysteine', type: 'special', molecularWeight: 121.16 },
  'e': { code: 'e', threeLetter: 'glu', fullName: 'glutamic acid', type: 'negative', molecularWeight: 147.13 },
  'q': { code: 'q', threeLetter: 'gln', fullName: 'glutamine', type: 'polar', molecularWeight: 146.15 },
  'g': { code: 'g', threeLetter: 'gly', fullName: 'glycine', type: 'special', molecularWeight: 75.07 },
  'h': { code: 'h', threeLetter: 'his', fullName: 'histidine', type: 'positive', molecularWeight: 155.16 },
  'i': { code: 'i', threeLetter: 'ile', fullName: 'isoleucine', type: 'hydrophobic', molecularWeight: 131.17 },
  'l': { code: 'l', threeLetter: 'leu', fullName: 'leucine', type: 'hydrophobic', molecularWeight: 131.17 },
  'k': { code: 'k', threeLetter: 'lys', fullName: 'lysine', type: 'positive', molecularWeight: 146.19 },
  'm': { code: 'm', threeLetter: 'met', fullName: 'methionine', type: 'hydrophobic', molecularWeight: 149.21 },
  'f': { code: 'f', threeLetter: 'phe', fullName: 'phenylalanine', type: 'hydrophobic', molecularWeight: 165.19 },
  'p': { code: 'p', threeLetter: 'pro', fullName: 'proline', type: 'special', molecularWeight: 115.13 },
  's': { code: 's', threeLetter: 'ser', fullName: 'serine', type: 'polar', molecularWeight: 105.09 },
  't': { code: 't', threeLetter: 'thr', fullName: 'threonine', type: 'polar', molecularWeight: 119.12 },
  'w': { code: 'w', threeLetter: 'trp', fullName: 'tryptophan', type: 'hydrophobic', molecularWeight: 204.23 },
  'y': { code: 'y', threeLetter: 'tyr', fullName: 'tyrosine', type: 'polar', molecularWeight: 181.19 },
  'v': { code: 'v', threeLetter: 'val', fullName: 'valine', type: 'hydrophobic', molecularWeight: 117.15 },
};

// three letter to single letter code mapping
export const threeLetterToSingle: Record<string, string> = {
  'ala': 'a',
  'arg': 'r',
  'asn': 'n',
  'asp': 'd',
  'cys': 'c',
  'glu': 'e',
  'gln': 'q',
  'gly': 'g',
  'his': 'h',
  'ile': 'i',
  'leu': 'l',
  'lys': 'k',
  'met': 'm',
  'phe': 'f',
  'pro': 'p',
  'ser': 's',
  'thr': 't',
  'trp': 'w',
  'tyr': 'y',
  'val': 'v',
};

// get amino acid info from three letter code
export const getAminoAcidFromThreeLetter = (threeLetter: string): AminoAcidInfo | undefined => {
  const code = threeLetterToSingle[threeLetter.toLowerCase()];
  return code ? aminoAcids[code] : undefined;
};

// get amino acid color by type
export const getAminoAcidTypeColor = (type: AminoAcidInfo['type']): string => {
  const colors: Record<AminoAcidInfo['type'], string> = {
    hydrophobic: '#f59e0b', // amber
    polar: '#10b981',       // emerald
    positive: '#3b82f6',    // blue
    negative: '#ef4444',    // red
    special: '#8b5cf6',     // violet
  };
  return colors[type];
};

// get amino acids by type
export const getAminoAcidsByType = (type: AminoAcidInfo['type']): AminoAcidInfo[] => {
  return Object.values(aminoAcids).filter(aa => aa.type === type);
};
