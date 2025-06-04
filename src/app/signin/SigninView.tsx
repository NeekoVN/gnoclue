"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthCookie, setAuthCookie, login } from "../utils/auth";

export default function SigninView() {
  const router = useRouter();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    console.log("Signin page: Component mounted");
    // If already authenticated, redirect to home
    const authToken = getAuthCookie();
    console.log("Signin page: Checking auth token:", authToken);
    if (authToken) {
      console.log(
        "Signin page: User already authenticated, redirecting to home"
      );
      router.push("/");
    } else {
      console.log("Signin page: No auth token found, showing signin form");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log("Signin page: Attempting login with email:", email);

    try {
      console.log("Signin page: Sending login request to API...");
      const response = await login(email, password);
      console.log(
        "Signin page: Login successful, received token:",
        response.token
      );
      console.log("Signin page: User data:", response.user);

      setAuthCookie(response.token);
      console.log("Signin page: Auth cookie set, redirecting to home");
      router.push("/");
    } catch (err) {
      console.error("Signin page: Login failed:", err);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="w-full max-w-md p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
        <p className="text-surface-2">Please sign in to continue</p>
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
          <label htmlFor="password">Password</label>
          <input type="password" name="password" id="password" required />
        </div>

        <div className="flex items-center justify-between !mb-2">
          <label className="checkbox">
            <input type="checkbox" />
            <span>Remember me</span>
          </label>

          <a href="#" className="link">
            Forgot password?
          </a>
        </div>

        <button type="submit" className="responsive large !m-0">
          Sign In
        </button>

        <div className="text-center">
          <p className="text-surface-2">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="link">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
