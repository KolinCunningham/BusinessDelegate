import { getAdminSession, loginAction } from "./actions";
import AdminDashboard from "./_components/AdminDashboard";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAdminSession();
  const params = await searchParams;

  if (!session) {
    return <LoginGate error={!!params.error} />;
  }

  // Full powerful trust & safety dashboard delivered by the Admin subagent
  return <AdminDashboard />;
}

/* ---------------- Login Gate (Server-rendered, posts to Server Action) ---------------- */
function LoginGate({ error }: { error?: boolean }) {
  return (
    <div className="flex items-center justify-center min-h-[72vh] py-12">
      <div className="w-full max-w-md">
        <div className="admin-card p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#2f5d3d] flex items-center justify-center">
              <span className="text-white text-xl font-bold tracking-[-1.5px]">C</span>
            </div>
            <div>
              <div className="font-semibold text-3xl tracking-[-1.5px]">CragTrails</div>
              <div className="text-[#5c6666] -mt-1">Admin &amp; Moderation</div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight mb-2">Sign in to Trust Console</h1>
          <p className="text-[#5c6666] mb-8 text-[15px]">
            This is a protected moderation environment. Only authorized admins may approve content that will be seen by families and children.
          </p>

          <form action={loginAction} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[#1f2525]">Email</label>
              <input
                type="email"
                name="email"
                defaultValue="admin@cragtrails.app"
                className="admin-input"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 text-[#1f2525]">Password</label>
              <input
                type="password"
                name="password"
                defaultValue="demo"
                className="admin-input"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm font-medium -mt-1">Invalid credentials. Use admin@cragtrails.app / demo</p>
            )}
            <button
              type="submit"
              className="admin-btn admin-btn-primary w-full h-12 text-base mt-2"
            >
              Sign in to Admin Console
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#e5e2d9] text-sm">
            <div className="font-mono text-xs uppercase tracking-[1px] text-[#5c6666] mb-2">Demo Credentials</div>
            <div className="bg-[#f8f7f4] rounded-lg p-3 font-mono text-sm">
              <div><span className="text-[#5c6666]">Email:</span> admin@cragtrails.app</div>
              <div><span className="text-[#5c6666]">Password:</span> demo</div>
            </div>
            <p className="mt-3 text-[#8a908a] text-xs leading-snug">
              This simulates a production-grade role guard. All moderation actions are logged and require explicit human review.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#8a908a] mt-6">CragTrails Trust &amp; Safety • All actions audited</p>
      </div>
    </div>
  );
}

// Note: The full powerful AdminDashboard (Photos, Routes, Moderation, Health, Audit Log, Stats)
// was delivered by the dedicated Admin/Trust subagent. It lives in _components/AdminDashboard.tsx.
// The Sponsorship Pipeline content above was valuable revenue work and can be re-integrated
// as a tab inside the main dashboard or a separate /admin/revenue route in a future CEO-approved iteration.
