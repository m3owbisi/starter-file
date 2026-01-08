import * as React from "react";

interface VerifyEmailTemplateProps {
  firstName: string;
  verificationUrl: string;
}

export const VerifyEmailTemplate: React.FC<
  Readonly<VerifyEmailTemplateProps>
> = ({ firstName, verificationUrl }) => (
  <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
    <h1>welcome, {firstName}!</h1>
    <p>
      thanks for signing up! please verify your email address by clicking the
      link below:
    </p>
    <a
      href={verificationUrl}
      style={{ color: "#007bff", textDecoration: "none" }}
    >
      verify your email
    </a>
    <p>if you did not sign up for this account, please ignore this email.</p>
    <p>thank you!</p>
  </div>
  );