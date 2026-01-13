"use client";
import Breadcrumb from "@/components/ComponentHeader/ComponentHeader";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import MoleculeStructure from "../../components/MoleculeStructure/index";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  createMoleculeGenerationHistory,
  getMoleculeGenerationHistoryByUser,
} from "@/lib/actions/molecule-generation.action";
import { getUserByEmail } from "@/lib/actions/user.actions";

const ModalLayout = () => {
  const { data: session } = useSession();
  const [smiles, setSmiles] = useState(
    "CCN(CC)C(=O)[C@@]1(C)Nc2c(ccc3ccccc23)C[C@H]1N(C)C",
  );
  const [numMolecules, setNumMolecules] = useState("10");
  const [minSimilarity, setMinSimilarity] = useState("0.3");
  const [particles, setParticles] = useState("30");
  const [iterations, setIterations] = useState("10");
  const [molecules, setMolecules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.email) {
        try {
          const user = await getUserByEmail(session.user.email);
          setUserId(user._id);
          const historyFromServer = await getMoleculeGenerationHistoryByUser(
            user._id,
          );
          setHistory(historyFromServer);
        } catch (error) {
          console.error("error fetching user or history:", error);
        }
      }
    };

    fetchUserData();
  }, [session?.user?.email]);

const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    // CHANGED: Point to your new local API route
    const invokeUrl = "/api/generate";

    const payload = {
      algorithm: "CMA-ES",
      num_molecules: parseInt(numMolecules),
      property_name: "QED",
      minimize: false,
      min_similarity: parseFloat(minSimilarity),
      particles: parseInt(particles),
      iterations: parseInt(iterations),
      smi: smiles,
    };

    try {
      const response = await fetch(invokeUrl, {
        method: "POST",
        headers: {
          // REMOVED: Authorization header is handled on the server now
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      // ... rest of your code (JSON.parse(data.molecules), etc.) remains the same
            const generatedMolecules = JSON.parse(data.molecules).map((mol: any) => ({
        structure: mol.sample,
        score: mol.score,
      }));

      setMolecules(generatedMolecules);

      if (userId) {
        await createMoleculeGenerationHistory(
          {
            smiles,
            numMolecules: parseInt(numMolecules),
            minSimilarity: parseFloat(minSimilarity),
            particles: parseInt(particles),
            iterations: parseInt(iterations),
            generatedMolecules,
          },
          userId,
        );

        const updatedHistory = await getMoleculeGenerationHistoryByUser(userId);
        setHistory(updatedHistory);
      } else {
        console.error("user ID is not available.");
      }

      console.log(generatedMolecules);
    } catch (error) {
      console.error("error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <Breadcrumb pageName="generate molecules" />

      <div className="grid grid-cols-1 gap-9 sm:grid-cols-3">
        <div className="flex flex-col gap-9 sm:col-span-2">
          <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-[#121212] dark:bg-[#181818]">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                SMILES to molecule generator
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6.5">
                <div className="mb-4.5 flex flex-col gap-6 xl:flex-row">
                  <div className="w-full xl:w-1/2">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      SMILES string
                    </label>
                    <input
                      type="text"
                      value={smiles}
                      onChange={(e) => setSmiles(e.target.value)}
                      placeholder="enter SMILES string"
                      className="w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-gray-2 dark:bg-[#181818] dark:text-white dark:focus:border-primary"
                    />
                  </div>

                  <div className="w-full xl:w-1/2">
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      number of molecules
                    </label>
                    <input
                      type="text"
                      value={numMolecules}
                      onChange={(e) => setNumMolecules(e.target.value)}
                      placeholder="enter number of molecules"
                      className="w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-gray-2 dark:bg-[#181818] dark:text-white dark:focus:border-primary"
                    />
                  </div>
                </div>

                <div className="mb-4.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    minimum similarity
                  </label>
                  <input
                    type="text"
                    value={minSimilarity}
                    onChange={(e) => setMinSimilarity(e.target.value)}
                    placeholder="enter minimum similarity"
                    className="w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-gray-2 dark:bg-[#181818] dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="mb-4.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    particles
                  </label>
                  <input
                    type="text"
                    value={particles}
                    onChange={(e) => setParticles(e.target.value)}
                    placeholder="enter number of particles"
                    className="w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-gray-2 dark:bg-[#181818] dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="mb-4.5">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    iterations
                  </label>
                  <input
                    type="text"
                    value={iterations}
                    onChange={(e) => setIterations(e.target.value)}
                    placeholder="enter number of iterations"
                    className="w-full rounded-lg border-[1.5px] bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary dark:border-gray-2 dark:bg-[#181818] dark:text-white dark:focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full justify-center rounded-lg bg-primary p-3 font-medium text-gray hover:bg-opacity-90"
                  disabled={loading}
                >
                  {loading ? "generating..." : "generate molecules"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-9">
          <div className="rounded-lg border border-stroke bg-white p-3 shadow-default dark:border-[#121212] dark:bg-[#181818]">
            <h3 className="font-medium text-black dark:text-white">
              molecule generation history
            </h3>
            <div className="mt-4 max-h-96 overflow-y-auto">
              {history.map((entry: any, index) => (
                <div key={index} className="border-b border-stroke py-3">
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-bold">SMILES:</span> {entry.smiles}
                  </p>
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-bold">molecules:</span>{" "}
                    {entry.numMolecules}
                  </p>
                  <p className="text-sm text-black dark:text-white">
                    <span className="font-bold">date:</span>{" "}
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3">
                    <button
                      className="text-primary hover:underline"
                      onClick={() => setMolecules(entry.generatedMolecules)}
                    >
                      view molecules
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {molecules.length > 0 && (
        <div className="mt-8 rounded-lg bg-white p-2">
          <div className="mt-8 flex flex-col  gap-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {molecules.map((mol: any, index) => (
                <MoleculeStructure
                  key={index}
                  id={`mol-${index + 1}`}
                  structure={mol.structure}
                  scores={mol.score}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default ModalLayout;