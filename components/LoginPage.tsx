import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Label from "./ui/Label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/Card";
import { KeyRound, Loader2 } from "./icons";

const LoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const { login, register } = useAuth();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // CAPTCHA state
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaAnswer("");
  };

  useEffect(() => {
    if (isRegistering) {
      generateCaptcha();
    }
  }, [isRegistering]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (parseInt(captchaAnswer, 10) !== captchaNum1 + captchaNum2) {
      setError("Jawaban CAPTCHA salah. Silakan coba lagi.");
      generateCaptcha(); // Generate new numbers
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      await register(regName, regEmail, regPassword);
      setSuccessMessage("Registration successful! Please log in.");
      setIsRegistering(false);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegConfirmPassword("");
    } catch (err) {
      setError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleView = () => {
    setIsRegistering(!isRegistering);
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
          <CardTitle>
            {isRegistering ? "Create an Account" : "Welcome to Licenser"}
          </CardTitle>
          <CardDescription>
            {isRegistering
              ? "Fill in your details to register."
              : "Enter your credentials to access your dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRegistering ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="captcha">
                  Berapa {captchaNum1} + {captchaNum2}?
                </Label>
                <Input
                  id="captcha"
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Register
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email anda"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password anda"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {successMessage && (
                <p className="text-sm text-green-600">{successMessage}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Login
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <button onClick={toggleView} className="text-primary hover:underline">
            {isRegistering
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
