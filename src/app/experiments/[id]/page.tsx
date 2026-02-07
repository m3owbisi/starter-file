"use client";

import React from "react";
import { useParams } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { ExperimentDetail } from "@/components/ExperimentsTracker";

const ExperimentDetailPage = () => {
  const params = useParams();
  const experimentId = params.id as string;

  return (
    <DefaultLayout>
      <div className="p-4 md:p-6 2xl:p-10">
        <ExperimentDetail experimentId={experimentId} />
      </div>
    </DefaultLayout>
  );
};

export default ExperimentDetailPage;
