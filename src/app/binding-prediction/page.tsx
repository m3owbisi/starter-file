"use client";

import ComponentHeader from "@/components/ComponentHeader/ComponentHeader";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { BindingPrediction } from "@/components/BindingPrediction";

const Page = () => {
  return (
    <DefaultLayout>
      <ComponentHeader pageName="binding prediction" containActionButton={false} />
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              ai-powered protein binding prediction
            </h2>
            <p className="mt-2 text-sm text-body dark:text-bodydark">
              predict binding affinities using amino acid sequences, 3d structures, and chemical properties. 
              our ml model analyzes protein interactions to estimate binding strength and identify key binding sites.
            </p>
          </div>
          
          {/* feature highlights */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-primary/5 p-4">
              <h3 className="text-sm font-semibold text-primary">sequence analysis</h3>
              <p className="mt-1 text-xs text-body dark:text-bodydark">
                analyze amino acid sequences to predict binding properties
              </p>
            </div>
            <div className="rounded-lg bg-green-500/5 p-4">
              <h3 className="text-sm font-semibold text-green-600 dark:text-green-400">structure integration</h3>
              <p className="mt-1 text-xs text-body dark:text-bodydark">
                enhance predictions with 3d pdb structure data
              </p>
            </div>
            <div className="rounded-lg bg-purple-500/5 p-4">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400">confidence scores</h3>
              <p className="mt-1 text-xs text-body dark:text-bodydark">
                get reliability metrics with every prediction
              </p>
            </div>
          </div>
        </div>
        
        <BindingPrediction />
      </div>
    </DefaultLayout>
  );
};

export default Page;
