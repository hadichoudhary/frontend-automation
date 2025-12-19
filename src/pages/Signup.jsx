import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import style from "../css/signup.module.css";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";

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

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the form errors");
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
        {
          name: form.name,
          email: form.email,
          password: form.password,
        }
      );

      if (res.data.success) {
        toast.success("Account created successfully");
        navigate("/login");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Signup failed. Please try again.";

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
          <h1>Create Account</h1>
          <p>Start scheduling your posts in minutes</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={style.inputWrapper}>
            <label className={style.inputLabel}>Full Name</label>
            <input
              type="text"
              name="name"
              className={`${style.input} ${
                errors.name ? style.inputError : ""
              }`}
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.name && <span>{errors.name}</span>}
          </div>

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
            {errors.email && <span>{errors.email}</span>}
          </div>

          <div className={style.inputWrapper}>
            <label className={style.inputLabel}>Password</label>
            <input
              type="password"
              name="password"
              className={`${style.input} ${
                errors.password ? style.inputError : ""
              }`}
              value={form.password}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.password && <span>{errors.password}</span>}
          </div>

          <div className={style.inputWrapper}>
            <label className={style.inputLabel}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className={`${style.input} ${
                errors.confirmPassword ? style.inputError : ""
              }`}
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
            {errors.confirmPassword && (
              <span>{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p className={style.footerText}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
