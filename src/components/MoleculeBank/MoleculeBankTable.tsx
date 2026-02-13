"use client";
import React, { useState, useEffect, useCallback } from "react";
import MoleculeStructure from "../MoleculeStructure/index";

type MoleculeBankItem = {
  moleculeName: string;
  smilesStructure: string;
  molecularWeight: number;
  categoryUsage: string;
};

const defaultMoleculeBank: MoleculeBankItem[] = [
  {
    moleculeName: "aspirin",
    smilesStructure: "CC(=O)OC1=CC=CC=C1C(O)=O",
    molecularWeight: 180.16,
    categoryUsage: "pain reliever/NSAID",
  },
  {
    moleculeName: "caffeine",
    smilesStructure: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    molecularWeight: 194.19,
    categoryUsage: "stimulant",
  },
  {
    moleculeName: "benzene",
    smilesStructure: "C1=CC=CC=C1",
    molecularWeight: 78.11,
    categoryUsage: "industrial solvent",
  },
  {
    moleculeName: "glucose",
    smilesStructure: "C(C1C(C(C(C(O1)O)O)O)O)O",
    molecularWeight: 180.16,
    categoryUsage: "energy source/sugar",
  },
  {
    moleculeName: "penicillin",
    smilesStructure: "CC1(C2C(C(C(O2)N1C(=O)COC(=O)C)C)S)C=O",
    molecularWeight: 334.39,
    categoryUsage: "antibiotic",
  },
  {
    moleculeName: "ibuprofen",
    smilesStructure: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O",
    molecularWeight: 206.28,
    categoryUsage: "pain reliever/NSAID",
  },
  {
    moleculeName: "acetaminophen",
    smilesStructure: "CC(=O)NC1=CC=C(O)C=C1",
    molecularWeight: 151.16,
    categoryUsage: "pain reliever/antipyretic",
  },
  {
    moleculeName: "morphine",
    smilesStructure: "CN1CCC23C4C1CC(C2C3O)OC5=CC=CC=C45",
    molecularWeight: 285.34,
    categoryUsage: "pain reliever/opiate",
  },
  {
    moleculeName: "nicotine",
    smilesStructure: "CN1CCCC1C2=CN=CC=C2",
    molecularWeight: 162.23,
    categoryUsage: "stimulant",
  },
  {
    moleculeName: "ethanol",
    smilesStructure: "CCO",
    molecularWeight: 46.07,
    categoryUsage: "alcohol/disinfectant",
  },
];

const TableOne = () => {
  const [molecules, setMolecules] = useState<MoleculeBankItem[]>(defaultMoleculeBank);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMolecules, setFilteredMolecules] = useState<MoleculeBankItem[]>(defaultMoleculeBank);

  useEffect(() => {
    const filteredData = molecules.filter((molecule) =>
      molecule.moleculeName.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredMolecules(filteredData);
  }, [searchQuery, molecules]);

  const addMolecule = useCallback((newMolecule: MoleculeBankItem) => {
    setMolecules((prev) => [...prev, newMolecule]);
  }, []);

  return (
    <div className="rounded-lg border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-[#181818] dark:bg-[#181818] sm:px-7.5 xl:pb-1">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          molecules
        </h4>
        <AddMoleculeButton onAdd={addMolecule} totalCount={molecules.length} />
      </div>

      <input
        type="search"
        placeholder="search molecule"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border-gray-300 text-gray-700 placeholder-gray-400 dark:border-gray-600 dark:placeholder-gray-500 text-md mb-4 w-full rounded-lg border bg-white px-4 py-3 shadow-sm outline-none focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
      />
      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-lg bg-gray-2 dark:bg-[#121212] sm:grid-cols-4">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              molecule name
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              smile structure image
            </h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              molecular weights (g/mol)
            </h5>
          </div>
          <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">
              category usage
            </h5>
          </div>
        </div>

        {filteredMolecules.map((molecule, key) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-4 ${
              key === filteredMolecules.length - 1
                ? ""
                : "border-b border-stroke dark:border-strokedark"
            }`}
            key={`mol-${molecule.moleculeName}-${key}`}
          >
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">
                {molecule.moleculeName}
              </p>
            </div>

            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <div className="flex-shrink-0">
                <MoleculeStructure
                  id={`mol-struct-${key}`}
                  structure={molecule.smilesStructure}
                />
              </div>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">
                {molecule.molecularWeight}
              </p>
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">
                {molecule.categoryUsage}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────
   Inline Add-Molecule Button + Modal
   ────────────────────────────────────────────── */

function AddMoleculeButton({
  onAdd,
  totalCount,
}: {
  onAdd: (m: MoleculeBankItem) => void;
  totalCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [smiles, setSmiles] = useState("");
  const [weight, setWeight] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setSmiles("");
    setWeight("");
    setCategory("");
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // basic validation
    if (!name.trim() || !smiles.trim() || !weight.trim() || !category.trim()) {
      setError("all fields are required");
      return;
    }

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setError("molecular weight must be a positive number");
      return;
    }

    onAdd({
      moleculeName: name.trim().toLowerCase(),
      smilesStructure: smiles.trim(),
      molecularWeight: parsedWeight,
      categoryUsage: category.trim().toLowerCase(),
    });

    resetForm();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
      >
        add molecule
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => { setOpen(false); resetForm(); }}
        >
          <div
            className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-[#1e1e1e]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-5 text-lg font-bold text-black dark:text-white">
              add new molecule
            </h3>

            <form onSubmit={handleSubmit}>
              {error && (
                <p className="mb-4 rounded-md bg-red-100 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  molecule name
                </label>
                <input
                  type="text"
                  placeholder="e.g. aspirin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-gray-2 dark:bg-[#181818] dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  SMILES string
                </label>
                <input
                  type="text"
                  placeholder="e.g. CC(=O)OC1=CC=CC=C1C(O)=O"
                  value={smiles}
                  onChange={(e) => setSmiles(e.target.value)}
                  className="w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-gray-2 dark:bg-[#181818] dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-4 flex flex-col gap-4 xl:flex-row">
                <div className="w-full xl:w-1/2">
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    molecular weight (g/mol)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 180.16"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-gray-2 dark:bg-[#181818] dark:text-white dark:focus:border-primary"
                  />
                </div>
                <div className="w-full xl:w-1/2">
                  <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                    category usage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. pain reliever/NSAID"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-gray-2 dark:bg-[#181818] dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setOpen(false); resetForm(); }}
                  className="rounded-lg border border-stroke px-4 py-2 font-medium text-black hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-white/5"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-6 py-2 font-medium text-white hover:bg-opacity-90"
                >
                  add molecule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default TableOne;