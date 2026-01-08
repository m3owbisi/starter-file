import * as React from "react";

interface ResetPasswordTemplateProps {
  firstName: string;
  resetUrl: string;
}

export const ResetPasswordTemplate: React.FC<
  Readonly<ResetPasswordTemplateProps>
> = ({ firstName, resetUrl }) => (
  <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
    <h1>hello, {firstName}!</h1>
    <p>
      it looks like you requested a password reset. click the link below to
      reset your password:
    </p>
    <a href={resetUrl} style={{ color: "#007bff", textDecoration: "none" }}>
      reset your password
    </a>
    <p>if you did not request a password reset, please ignore this email.</p>
    <p>thank you!</p>
  </div>
);