"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import AdminDashboard from "@/components/Analytics/AdminDashboard";
import UserDashboard from "@/components/Analytics/UserDashboard";
import GuestDashboard from "@/components/Analytics/GuestDashboard";
import { Loader2 } from "lucide-react";

type UserRole = "admin" | "researcher" | "guest";

const AnalyticsPage = () => {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<UserRole>("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "authenticated" && session?.user) {
      // get role from session user data
      // assuming the role is stored in session.user
      const role = (session.user as any)?.role || "researcher";
      setUserRole(role as UserRole);
    } else {
      setUserRole("guest");
    }
    setLoading(false);
  }, [session, status]);

  const renderDashboard = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard dateRange={30} />;
      case "researcher":
        return <UserDashboard userId={(session?.user as any)?.id} dateRange={30} />;
      case "guest":
      default:
        return <GuestDashboard />;
    }
  };

  if (loading || status === "loading") {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="text-[#3c50e0] animate-spin" />
            <p className="text-gray-500 dark:text-gray-400 lowercase">loading analytics...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      {renderDashboard()}
    </DefaultLayout>
  );
};

export default AnalyticsPage;
