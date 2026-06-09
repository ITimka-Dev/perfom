export type AppRole = "admin" | "teacher" | "student";

export const getDefaultRouteForRole = (role?: string | null) => {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/dashboard";
};
