import { Resend } from "resend";
import { VerifyEmailTemplate } from "@/components/EmailTemplates/verify-email";
import { ResetPasswordTemplate } from "@/components/EmailTemplates/reset-email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationUrl: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "protein bind <onboarding@resend.dev>",
      to: [email],
      subject: "verify your email",
      react: VerifyEmailTemplate({ firstName, verificationUrl }),
    });

    if (error) {
      console.error("resend error:", error);
      throw new Error(error.message || "failed to send verification email");
    }

    return data;
  } catch (error: any) {
    console.error("send verification email error:", error);
    throw new Error(error.message || "failed to send verification email");
  }
}

export async function sendResetPasswordEmail(
  email: string,
  firstName: string,
  resetUrl: string,
) {
  try {
    const { data, error } = await resend.emails.send({
      from: "protein bind <support@resend.dev>",
      to: [email],
      subject: "reset your password",
      react: ResetPasswordTemplate({ firstName, resetUrl }),
    });

    if (error) {
      console.error("resend error:", error);
      throw new Error(error.message || "failed to send reset password email");
    }

    return data;
  } catch (error: any) {
    console.error("send reset password email error:", error);
    throw new Error(error.message || "failed to send reset password email");
  }
}