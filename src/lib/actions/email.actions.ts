"use server";

import { Resend } from "resend";
import { VerifyEmailTemplate } from "@/components/EmailTemplates/verify-email";
import { ResetPasswordTemplate } from "@/components/EmailTemplates/reset-email";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export async function sendVerificationEmail(
  firstName: string,
  email: string,
  verificationUrl: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: `protein bind <${fromEmail}>`,
      to: [email],
      subject: "verify your email",
      react: VerifyEmailTemplate({ firstName, verificationUrl }),
    });

    if (error) {
      console.error("[email] failed to send verification email:", error);
      throw new Error(error.message);
    }

    console.log("[email] verification email sent successfully:", data);
    return data;
  } catch (error: any) {
    console.error("[email] error sending verification email:", error);
    throw new Error(
      error.message || "failed to send verification email",
    );
  }
}

export async function sendResetPasswordEmail(
  firstName: string,
  email: string,
  resetUrl: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: `protein bind <${fromEmail}>`,
      to: [email],
      subject: "reset your password",
      react: ResetPasswordTemplate({ firstName, resetUrl }),
    });

    if (error) {
      console.error("[email] failed to send reset password email:", error);
      throw new Error(error.message);
    }

    console.log("[email] reset password email sent successfully:", data);
    return data;
  } catch (error: any) {
    console.error("[email] error sending reset password email:", error);
    throw new Error(
      error.message || "failed to send reset password email",
    );
  }
}
