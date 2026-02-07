"use client";

import React from "react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { ExperimentsList } from "@/components/ExperimentsTracker";

const ExperimentsPage = () => {
  return (
    <DefaultLayout>
      <div className="p-4 md:p-6 2xl:p-10">
        <ExperimentsList />
      </div>
    </DefaultLayout>
  );
};

export default ExperimentsPage;
