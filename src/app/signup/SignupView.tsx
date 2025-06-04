"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthCookie, register } from "../utils/auth";

export default function SignupView() {
  const router = useRouter();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    console.log("Signup page: Component mounted");
    // If already authenticated, redirect to home
    const authToken = getAuthCookie();
    console.log("Signup page: Checking auth token:", authToken);
    if (authToken) {
      console.log(
        "Signup page: User already authenticated, redirecting to home"
      );
      router.push("/");
    } else {
      console.log("Signup page: No auth token found, showing signup form");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    console.log("Signup page: Attempting registration with email:", email);

    try {
      console.log("Signup page: Sending registration request to API...");
      const response = await register(email, username, password);
      console.log(
        "Signup page: Registration successful, user created:",
        response.user
      );

      // After successful registration, log the user in
      console.log("Signup page: Redirecting to signin page");
      router.push("/signin");
    } catch (err) {
      console.error("Signup page: Registration failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again."
      );
    }
  };

  return (
    <div className="w-full max-w-md p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-surface-2">Join GnoClue today</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="field border round fill">
          <label htmlFor="email">Email</label>
          <input type="email" name="email" id="email" required />
        </div>

        <div className="field border round fill">
          <label htmlFor="username">Username</label>
          <input type="text" name="username" id="username" required />
        </div>

        <div className="field border round fill">
          <label htmlFor="password">Password</label>
          <input type="password" name="password" id="password" required />
        </div>

        <div className="field border round fill">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            required
          />
        </div>

        <button type="submit" className="responsive large !mt-6 !mx-0">
          Create Account
        </button>

        <div className="text-center">
          <p className="text-surface-2">
            Already have an account?{" "}
            <Link href="/signin" className="link">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
