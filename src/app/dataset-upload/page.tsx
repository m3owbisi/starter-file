"use client";

import ComponentHeader from "@/components/ComponentHeader/ComponentHeader";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { ProteinDatasetUploader } from "@/components/proteindatasetuploader";
import { Metadata } from "next";

const Page = () => {
  return (
    <DefaultLayout>
      <ComponentHeader pageName="dataset upload" containActionButton={false} />
      <div className="flex flex-col gap-6">
        <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              upload protein datasets
            </h2>
            <p className="mt-2 text-sm text-body dark:text-bodydark">
              upload your protein structure files for analysis. supported formats include pdb, csv, and fasta files.
            </p>
          </div>
          <ProteinDatasetUploader />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Page;
