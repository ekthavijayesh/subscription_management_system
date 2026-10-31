import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/types/database.types";

// Workaround: supabase-js v2 + postgrest-js type inference resolves .from() rows
// to `never` when the Schema generic is not propagated correctly. We cast
// explicitly so that the rest of the file remains strictly typed.
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface CurrentUserSession {
  user: {
    id: string;
    email: string;
  };
  profile: {
    id: string;
    role: UserRole;
    full_name: string | null;
    email: string;
    is_active: boolean;
  };
}

/**
 * Ensures the request is authenticated and has an active profile.
 * Throws a redirect to /login if unauthenticated or inactive.
 */
export async function requireAuth(): Promise<CurrentUserSession> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profileRaw, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, is_active")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as Pick<
    ProfileRow,
    "id" | "role" | "full_name" | "email" | "is_active"
  > | null;

  if (profileError || !profile || !profile.is_active) {
    redirect("/login?error=account_inactive");
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? profile.email,
    },
    profile: {
      id: profile.id,
      role: profile.role as UserRole,
      full_name: profile.full_name,
      email: profile.email,
      is_active: profile.is_active,
    },
  };
}

/**
 * Ensures the authenticated user has one of the allowed roles.
 * Redirects to their appropriate role home if unauthorized.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<CurrentUserSession> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.profile.role)) {
    // Redirect to their own dashboard
    redirect(`/${session.profile.role}`);
  }

  return session;
}
