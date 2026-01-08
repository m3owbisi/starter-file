"use client";
import React, { useState, useEffect } from "react";
import {
  getUserByEmail,
  requestPasswordReset,
} from "@/lib/actions/user.actions";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useRouter } from "next/navigation";
import { MailIcon } from "lucide-react";
import { useSession } from "next-auth/react";

const ForgetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<string | any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (session?.user?.email) {
        try {
          const fetchedUser = await getUserByEmail(session.user.email);
          setUser(fetchedUser);
        } catch (error) {
          console.error("failed to fetch user:", error);
        }
      }
    };

    fetchUser();
  }, [session?.user?.email]);
  console.log(user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await requestPasswordReset(email);
      setStatus("success");
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "something went wrong.");
    }
  };

  return (
    <DefaultLayout>
      <div className="mt-20 h-screen text-center">
        {status === "idle" && (
          <>
            <h2 className="mb-4 text-title-md2 font-semibold text-black dark:text-white">
              forget password
            </h2>
            <p className="mb-6">
              enter your email to receive a password reset link.
            </p>
            <form onSubmit={handleSubmit} className="mx-auto max-w-md">
              <div className="mb-4">
                <label className="mb-2 block font-medium text-black dark:text-white">
                  email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="enter your email"
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    required
                  />
                  <span className="absolute right-4 top-4">
                    <MailIcon />
                  </span>
                </div>
              </div>

              {status === "idle" && (
                <p className="text-red-500 mb-4">{errorMessage}</p>
              )}

              <div className="mb-6">
                <input
                  type="submit"
                  value="send reset link"
                  className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
                />
              </div>
            </form>
          </>
        )}

        {status === "loading" && <p>sending reset link, please wait...</p>}

        {status === "success" && (
          <>
            <h2 className="mb-4 text-2xl font-bold">check your email</h2>
            <p className="mb-6">
              we have sent a password reset link to {email}. please check your
              inbox.
            </p>
            <button
              onClick={() => router.push("/auth-page/signin")}
              className="mt-4 rounded-lg bg-primary p-3 text-white"
            >
              go to sign in
            </button>
          </>
        )}

        {status === "error" && (
          <p>there was an error sending the reset link. please try again.</p>
        )}
      </div>
    </DefaultLayout>
  );
};

export default ForgetPasswordPage;