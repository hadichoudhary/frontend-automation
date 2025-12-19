import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import style from "../css/signin.module.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear field error when user types
  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      email: form.email ? "" : prev.email,
      password: form.password ? "" : prev.password,
    }));
  }, [form]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the form errors");
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        form
      );

      if (res.data.success) {
        localStorage.setItem("authToken", res.data.authToken);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        toast.success("Login successful");
        navigate("/");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Invalid credentials. Please try again.";

      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={style.signupBody}>
      <div className={style.signupContainer}>
        <div className={style.signupText}>
          <h1>Welcome Back</h1>
          <p>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className={style.inputWrapper}>
            <label className={style.inputLabel}>Email</label>
            <input
              type="email"
              name="email"
              className={`${style.input} ${
                errors.email ? style.inputError : ""
              }`}
              value={form.email}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.email && (
              <span className={style.errorText}>{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className={style.inputWrapper}>
            <div className={style.passwordHeader}>
              <label className={style.inputLabel}>Password</label>
              <button
                type="button"
                className={style.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className={`${style.input} ${
                errors.password ? style.inputError : ""
              }`}
              value={form.password}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.password && (
              <span className={style.errorText}>{errors.password}</span>
            )}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className={style.footerText}>
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
