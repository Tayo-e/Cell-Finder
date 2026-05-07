// src/pages/Signup.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase/config";
import { createUserProfile } from "../firebase/firestore";

export default function Signup({ onSwitch }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await createUserProfile(user.uid, { name, email });
      // onAuthStateChanged in App.jsx handles the redirect
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3 fade-up">
        <img
          src="/logo.png"
          alt="Harvesters"
          className="w-20 h-20 object-contain rounded-2xl"
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Harvesters</h1>
          <p className="text-gold text-sm font-medium">CellFinder</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card-dark p-6 fade-up">
        <h2 className="text-lg font-semibold text-white mb-1">Create your account</h2>
        <p className="text-sm text-muted mb-6">Join and find your nearest cell</p>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Okafor"
              required
              className="input-dark w-full px-4 py-3 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="input-dark w-full px-4 py-3 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              className="input-dark w-full px-4 py-3 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              className="input-dark w-full px-4 py-3 rounded-lg text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-center text-muted mt-6">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-gold hover:text-gold-light font-medium transition-colors">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    default:
      return "Something went wrong. Please try again.";
  }
}
