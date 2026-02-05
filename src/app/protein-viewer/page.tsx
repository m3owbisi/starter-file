"use client";

import ComponentHeader from "@/components/ComponentHeader/ComponentHeader";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { ProteinViewer } from "@/components/ProteinViewer";

const Page = () => {
  return (
    <DefaultLayout>
      <ComponentHeader pageName="protein viewer" containActionButton={false} />
      <div className="flex flex-col gap-6">
        <ProteinViewer />
      </div>
    </DefaultLayout>
  );
};

export default Page;
