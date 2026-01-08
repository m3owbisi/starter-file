import Index from "@/components/Dashboard";
import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title:
    "next.js e-commerce dashboard | tailadmin - next.js dashboard template",
  description: "this is next.js home for tailadmin dashboard template",
  //   title:
  //   "protein bind",
  // description: "a leading research platform for drug discovery, this is a desc for pb",
};

export default function Home() {
  return (
    <>
      <DefaultLayout>
        <Index />
      </DefaultLayout>
      {/* <div className="h-screen">
        <p>default layout</p>
      </div> */}
      {/* <DefaultLayout>
        <p>default layout, hello dashboard | home page</p>
      </DefaultLayout> */}
    </>
  );
}