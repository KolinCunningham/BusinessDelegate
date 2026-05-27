import { getAdminSession, logoutAction } from "./actions";
import { Shield, LogOut, Users } from "lucide-react";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#1f2525] flex flex-col">
      {/* Top Trust & Safety Banner - ALWAYS visible */}
      <div className="trust-banner px-6 py-3 text-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4" />
          <span className="font-medium tracking-tight">
            CragTrails Trust &amp; Safety • Admin Console
          </span>
          <span className="text-[#8a908a] hidden sm:inline">• Kids climb here. Every photo and route is reviewed.</span>
        </div>
        <div className="text-xs text-[#8a908a] font-mono hidden md:block">
          NON-NEGOTIABLE FOR SCALE
        </div>
      </div>

      {/* Admin Header */}
      <header className="border-b border-[#e5e2d9] bg-white sticky top-0 z-50">
        <div className="max-w-[1480px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2f5d3d] flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <div className="font-semibold tracking-tighter text-xl">CragTrails</div>
                <div className="text-[10px] text-[#5c6666] -mt-1">ADMIN</div>
              </div>
            </Link>
            <div className="ml-3 px-3 py-1 rounded-full bg-[#f0f4f0] text-[#2f5d3d] text-xs font-semibold tracking-wide">
              MODERATION + DATA TRUST
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {session ? (
              <>
                <div className="flex items-center gap-2 text-[#5c6666]">
                  <Users className="w-4 h-4" />
                  <span className="font-medium text-[#1f2525]">{session.email}</span>
                  <span className="text-xs px-1.5 py-px rounded bg-emerald-100 text-emerald-700">ADMIN</span>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-secondary text-sm h-9 px-4 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <div className="text-sm text-[#5c6666] font-medium">Demo access only • Session expires after 4h</div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 max-w-[1480px] mx-auto w-full px-6 pb-12">
        {children}
      </div>

      {/* Persistent Trust Footer Message */}
      <footer className="border-t border-[#e5e2d9] bg-white py-8 mt-auto">
        <div className="max-w-[1480px] mx-auto px-6">
          <div className="safety-callout rounded-lg p-5 text-sm max-w-3xl">
            <p className="font-semibold text-[#2f5d3d] mb-1">Why this admin console exists</p>
            <p className="text-[#3f4f3f]">
              Without strong admin tools, bad data and photos will drive away serious climbers and parents. 
              This is non-negotiable for scale. Every user-generated photo is reviewed before appearing publicly. 
              Routes can be instantly corrected. Flagged content receives human review within minutes. 
              Trust &amp; safety is our #1 product feature.
            </p>
          </div>
          <p className="text-center text-xs text-[#8a908a] mt-6">CragTrails • Protecting the vertical world for the next generation of climbers</p>
        </div>
      </footer>
    </div>
  );
}
