"use client";

import ComponentHeader from "@/components/ComponentHeader/ComponentHeader";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { BindingPrediction } from "@/components/BindingPrediction";

const Page = () => {
  return (
    <DefaultLayout>
      <ComponentHeader pageName="binding prediction" containActionButton={false} />
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              ai-powered protein binding prediction
            </h2>
            <p className="mt-2 text-sm text-body dark:text-bodydark">
              predict binding affinities using your uploaded protein datasets. our ml models analyze
              protein interactions to estimate binding strength and identify key binding sites.
              no need to re-upload — your dataset from the protein viewer is automatically available.
            </p>
          </div>
          
          {/* feature highlights */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-primary/5 p-4">
              <h3 className="text-sm font-semibold text-primary">dataset integration</h3>
              <p className="mt-1 text-xs text-body dark:text-bodydark">
                automatically uses your active protein dataset — zero re-uploads
              </p>
            </div>
            <div className="rounded-xl bg-green-500/5 p-4">
              <h3 className="text-sm font-semibold text-green-600 dark:text-green-400">model selection</h3>
              <p className="mt-1 text-xs text-body dark:text-bodydark">
                choose from multiple ml models for different prediction strategies
              </p>
            </div>
            <div className="rounded-xl bg-purple-500/5 p-4">
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400">parameter tuning</h3>
              <p className="mt-1 text-xs text-body dark:text-bodydark">
                fine-tune temperature, confidence threshold, and iterations
              </p>
            </div>
            <div className="rounded-xl bg-blue-500/5 p-4">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">run history</h3>
              <p className="mt-1 text-xs text-body dark:text-bodydark">
                compare predictions across different parameter configurations
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
