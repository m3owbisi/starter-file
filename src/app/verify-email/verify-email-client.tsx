"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/actions/user.actions";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { CircleCheckBig } from "lucide-react";

const VerifyEmailClient: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  useEffect(() => {
    const verifyUserEmail = async () => {
      if (token) {
        try {
          await verifyEmail(token);
          setStatus("success");
        } catch (error) {
          console.error("error verifying email:", error);
          setStatus("error");
        }
      } else {
        setStatus("error");
      }
    };

    verifyUserEmail();
  }, [token]);

  return (
    <DefaultLayout>
      <div className="mt-20 h-screen  text-center">
        <span className="mt-15 inline-block">
          <CircleCheckBig size={60} />
        </span>
        {status === "loading" && <p>verifying your email, please wait...</p>}
        {status === "success" && (
          <p>your email has been successfully verified!</p>
        )}
        {status === "error" && (
          <p>there was an error verifying your email. please try again.</p>
        )}
        {status === "success" && (
          <button
            onClick={() => router.push("/auth-page/signin")}
            className="mt-4 rounded-lg bg-primary p-3 text-white"
          >
            go to sign in
          </button>
        )}
      </div>
    </DefaultLayout>
  );
};

export default VerifyEmailClient;
