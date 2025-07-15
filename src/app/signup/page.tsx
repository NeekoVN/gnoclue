/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { IRegisterRequest } from "../types/auth";
import { useAuth } from "../contexts/AuthContext";
import Link from "next/link";
import { API_BASE_URL } from "../config/api";

const BASE_URL = `${API_BASE_URL}/auth`;

export default function SignUpPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<IRegisterRequest>({
    username: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await axios.post(`${BASE_URL}/register`, form);
      router.replace("/signin");
    } catch (err) {
      // Show full error details for debugging
      const errorMessage =
        (err as any)?.response?.data?.message ||
        (err as any)?.message ||
        "Registration failed";
      const fullError = `Error: ${errorMessage}\nStatus: ${
        (err as any)?.response?.status
      }\nResponse: ${JSON.stringify((err as any)?.response?.data, null, 2)}`;
      setError(fullError);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-surface-2">Join GnoClue today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            <pre className="whitespace-pre-wrap text-sm">{error}</pre>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="field border round fill">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="field border round fill">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              required
              value={form.username}
              onChange={handleChange}
            />
          </div>

          <div className="field border round fill">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              name="password"
              id="password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="field border round fill">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="responsive large !mt-6 !mx-0"
            disabled={submitting}>
            {submitting ? "Creating..." : "Create Account"}
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
    </div>
  );
}
