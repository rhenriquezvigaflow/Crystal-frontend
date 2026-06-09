import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { ApiError } from "../auth/authApi";
import loginBackgroundUrl from "../assets/login-background.webp";
import { getDefaultDashboardPathForCurrentUser } from "../modules/shared/auth/productAccess";

export default function Login() {
  const navigate = useNavigate();
  const { login, verifyTwoFactor, isAuthenticated } = useAuth();

  const [step, setStep] = useState<"credentials" | "twoFactor">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultDashboardPathForCurrentUser(), { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      if ("requires_2fa" in response && response.requires_2fa) {
        setStep("twoFactor");
        setChallengeId(response.challenge_id);
        setChallengeMessage(response.message);
        setTwoFactorCode("");
        setPassword("");
        return;
      }

      navigate(getDefaultDashboardPathForCurrentUser(), { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Invalid credentials");
        } else if (err.status === 403) {
          setError("Access not allowed");
        } else {
          setError("Error signing in");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error signing in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!challengeId) {
      setError("Start sign in again to generate a new code");
      setStep("credentials");
      return;
    }

    setLoading(true);
    try {
      await verifyTwoFactor(
        {
          challenge_id: challengeId,
          code: twoFactorCode.trim(),
        },
        email.trim(),
      );

      navigate(getDefaultDashboardPathForCurrentUser(), { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError(err.message || "Code expired. Sign in again to request a new code");
        } else if (err.status === 401) {
          setError("Invalid code");
        } else if (err.status === 429) {
          setError("Too many attempts. Sign in again to request a new code");
        } else {
          setError("Error verifying code");
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error verifying code");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetTwoFactor = () => {
    setStep("credentials");
    setChallengeId(null);
    setChallengeMessage(null);
    setTwoFactorCode("");
    setError(null);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url('${loginBackgroundUrl}')` }}
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white/18 backdrop-blur-[6px] border border-white/25 shadow-2xl p-8 text-white">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold tracking-wide">SCADA Platform</h1>
              <p className="text-sm opacity-80 mt-1">Crystal and Small Lagoons</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200/40 bg-red-500/20 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div>
                  <label className="text-sm opacity-85">Email</label>
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-lg bg-white/90 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user@company.com"
                  />
                </div>

                <div>
                  <label className="text-sm opacity-85">Password</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-lg bg-white/90 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="********"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition-all font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
                <div className="rounded-lg border border-white/25 bg-white/12 px-4 py-3 text-sm">
                  {challengeMessage || "Introduzca el numero de 4 digitos"}
                </div>

                <div>
                  <label className="text-sm opacity-85">Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    required
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full mt-1 px-4 py-3 rounded-lg bg-white/90 text-center text-xl font-semibold tracking-[0.45em] text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 4}
                  className="w-full py-3 rounded-lg bg-linear-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 transition-all font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify code"}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={resetTwoFactor}
                  className="w-full rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-60"
                >
                  Sign in again
                </button>
              </form>
            )}

            <div className="text-center text-xs opacity-60 mt-6">v1.0.0 · PROD</div>
          </div>
        </div>
      </div>
    </div>
  );
}
