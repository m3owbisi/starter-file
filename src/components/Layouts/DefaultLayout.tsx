"use client";
import React, { useState, useLayoutEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Breadcrumb from "@/components/navigation/Breadcrumb";
import PageTransition from "@/components/navigation/PageTransition";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const publicRoutes = [
    "/auth-page/signin",
    "/auth-page/signup",
    "/verify-email",
    "/reset-password",
    "/forget-password",
  ];

  useLayoutEffect(() => {
    if (status === "unauthenticated" && !publicRoutes.includes(pathname)) {
      router.push("/auth-page/signin");
    }
  }, [status, router, pathname]);

  return (
    <>
      <div className="flex">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-1 flex-col lg:ml-72.5">
          {/* Header */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main>
            {/* Content */}
            <div className="mx-auto max-w-screen-2xl p-4 dark:bg-[#121212] md:p-6 2xl:p-10">
              {/* Breadcrumb Navigation */}
              <Breadcrumb />
              {/* Page Transition Wrapper */}
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}