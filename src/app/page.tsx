import Index from "@/components/Dashboard";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title: "proteinbind — scientific research dashboard",
  description:
    "a leading research platform for drug discovery. access molecule banks, generate compounds, search databases, and collaborate with researchers.",
};

export default function Home() {
  return (
    <>
      <DefaultLayout>
        <Index />
      </DefaultLayout>
    </>
  );
}