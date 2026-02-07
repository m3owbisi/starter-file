"use client";
import React, { useState } from "react";
import Link from "next/link";
import { LoaderCircle, LockIcon, MailIcon } from "lucide-react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ComponentHeader from "@/components/ComponentHeader/ComponentHeader";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import ErrorModal from "@/components/modals/ErrorModal";
import InlineError from "@/components/auth/InlineError";

interface FormErrors {
  email?: string;
  password?: string;
}

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const router = useRouter();

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!email) {
      errors.email = "email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "please enter a valid email address";
    }

    if (!password) {
      errors.password = "password is required";
    } else if (password.length < 6) {
      errors.password = "password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setModalError("invalid email or password. please try again.");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setModalError("something went wrong. please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <ComponentHeader pageName="sign in" />

      <ErrorModal
        isOpen={!!modalError}
        onClose={() => setModalError(null)}
        title="login failed"
        message={modalError || ""}
      />

      <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-center">
          <div className="mx-auto w-full xl:w-4/6">
            <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
              <span className="mb-1.5 block font-medium">start for free</span>
              <h2 className="mb-9 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
                sign in to protein bind
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formErrors.email) {
                          setFormErrors({ ...formErrors, email: undefined });
                        }
                      }}
                      placeholder="enter your email"
                      className={`w-full rounded-lg border ${
                        formErrors.email ? "border-red-500" : "border-stroke"
                      } bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                      disabled={isLoading}
                    />
                    <span className="absolute right-4 top-4">
                      <MailIcon />
                    </span>
                  </div>
                  <InlineError message={formErrors.email} />
                </div>

                <div className="mb-6">
                  <label className="mb-2.5 block font-medium text-black dark:text-white">
                    password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formErrors.password) {
                          setFormErrors({ ...formErrors, password: undefined });
                        }
                      }}
                      placeholder="6+ characters, 1 capital letter"
                      className={`w-full rounded-lg border ${
                        formErrors.password ? "border-red-500" : "border-stroke"
                      } bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                      disabled={isLoading}
                    />
                    <span className="absolute right-4 top-4">
                      <LockIcon />
                    </span>
                  </div>
                  <InlineError message={formErrors.password} />
                </div>

                <div className="mb-5">
                  <button
                    type="submit"
                    className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <LoaderCircle className="mr-2 animate-spin" /> signing
                        in...
                      </span>
                    ) : (
                      "sign in"
                    )}
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <p>
                    don&apos;t have an account?{" "}
                    <Link href="/auth-page/signup" className="text-primary">
                      sign up
                    </Link>
                  </p>
                  <p>
                    forgot password?{" "}
                    <Link href="/forget-password" className="text-primary">
                      reset
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default SignIn;