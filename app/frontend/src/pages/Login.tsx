import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, demoLogin, customLogin, registerUser, DEMO_ACCOUNTS, UserInfo } from "@/lib/auth";
import { UserPlus, LogIn } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"demo" | "login" | "register">("demo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const check = async () => {
      const user = await getCurrentUser();
      if (user) {
        sessionStorage.removeItem("atoms_logged_out");
        navigate("/projects");
      } else {
        setChecking(false);
      }
    };
    check();
  }, [navigate]);

  const handleDemoLogin = (account: UserInfo) => {
    demoLogin(account);
    navigate("/projects");
  };

  const handleCustomLogin = () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("请填写邮箱和密码");
      return;
    }
    const result = customLogin(email.trim(), password.trim());
    if (result.success && result.user) {
      demoLogin(result.user);
      navigate("/projects");
    } else {
      setError(result.error || "登录失败");
    }
  };

  const handleRegister = () => {
    setError("");
    if (!email.trim() || !password.trim() || !name.trim()) {
      setError("请填写所有字段");
      return;
    }
    if (password.length < 4) {
      setError("密码至少4位");
      return;
    }
    const result = registerUser(email.trim(), password.trim(), name.trim());
    if (result.success && result.user) {
      demoLogin(result.user);
      navigate("/projects");
    } else {
      setError(result.error || "注册失败");
    }
  };

  if (checking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e2e]">
        <div className="w-6 h-6 rounded bg-[#7c3aed] animate-pulse flex items-center justify-center">
          <span className="text-white text-xs font-bold">A</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#1e1e2e]">
      <div className="flex flex-col items-center gap-6 p-8 rounded-xl border border-[#3d3d5c] bg-[#2a2a3e] w-[400px]">
        <div className="w-14 h-14 rounded-lg bg-[#7c3aed] flex items-center justify-center">
          <span className="text-white text-2xl font-bold">A</span>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[#e2e8f0]">Atoms 多人共创 Demo</h1>
          <p className="text-sm text-[#94a3b8] mt-1">选择 Demo 账号或注册新账号</p>
        </div>

        {/* Mode tabs */}
        <div className="w-full flex rounded-lg bg-[#1e1e2e] p-1">
          <button
            onClick={() => { setMode("demo"); setError(""); }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              mode === "demo" ? "bg-[#7c3aed] text-white" : "text-[#94a3b8] hover:text-[#e2e8f0]"
            }`}
          >
            Demo 账号
          </button>
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              mode === "login" ? "bg-[#7c3aed] text-white" : "text-[#94a3b8] hover:text-[#e2e8f0]"
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              mode === "register" ? "bg-[#7c3aed] text-white" : "text-[#94a3b8] hover:text-[#e2e8f0]"
            }`}
          >
            注册
          </button>
        </div>

        {/* Demo accounts */}
        {mode === "demo" && (
          <div className="w-full flex flex-col gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.id}
                onClick={() => handleDemoLogin(account)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#3d3d5c] hover:border-[#7c3aed] hover:bg-[#7c3aed]/10 transition-all text-left group"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                  style={{ backgroundColor: account.color }}
                >
                  {account.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#e2e8f0]">{account.name}</div>
                  <div className="text-xs text-[#64748b] truncate">{account.email}</div>
                </div>
                <span className="text-xs text-[#64748b] group-hover:text-[#7c3aed]">登录 →</span>
              </button>
            ))}
            <p className="text-[11px] text-[#64748b] text-center mt-2">
              每位参与者选择不同账号，即可体验多人协作
            </p>
          </div>
        )}

        {/* Custom Login */}
        {mode === "login" && (
          <div className="w-full space-y-3">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱地址"
                className="w-full px-3 py-2.5 bg-[#1e1e2e] border border-[#3d3d5c] rounded-lg text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
                onKeyDown={(e) => e.key === "Enter" && handleCustomLogin()}
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full px-3 py-2.5 bg-[#1e1e2e] border border-[#3d3d5c] rounded-lg text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
                onKeyDown={(e) => e.key === "Enter" && handleCustomLogin()}
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleCustomLogin}
              className="w-full py-2.5 bg-[#7c3aed] text-white text-sm font-medium rounded-lg hover:bg-[#6d28d9] transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              登录
            </button>
            <p className="text-[11px] text-[#64748b] text-center">
              没有账号？<button onClick={() => setMode("register")} className="text-[#7c3aed] hover:underline">去注册</button>
            </p>
          </div>
        )}

        {/* Register */}
        {mode === "register" && (
          <div className="w-full space-y-3">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="昵称"
                className="w-full px-3 py-2.5 bg-[#1e1e2e] border border-[#3d3d5c] rounded-lg text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
              />
            </div>
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱地址"
                className="w-full px-3 py-2.5 bg-[#1e1e2e] border border-[#3d3d5c] rounded-lg text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码（至少4位）"
                className="w-full px-3 py-2.5 bg-[#1e1e2e] border border-[#3d3d5c] rounded-lg text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={handleRegister}
              className="w-full py-2.5 bg-[#7c3aed] text-white text-sm font-medium rounded-lg hover:bg-[#6d28d9] transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              注册并登录
            </button>
            <p className="text-[11px] text-[#64748b] text-center">
              已有账号？<button onClick={() => setMode("login")} className="text-[#7c3aed] hover:underline">去登录</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}