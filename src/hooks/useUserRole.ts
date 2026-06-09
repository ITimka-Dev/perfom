import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

export type UserRole = "admin" | "teacher" | "student" | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('auth_token');
      let storedUser: { role?: string } = {};
      try {
        storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      } catch {
        storedUser = {};
      }
      const fallbackRole = (user?.role || storedUser?.role || "student") as UserRole;
      
      if (!token) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await usersApi.getProfile();
        setRole(profile?.role as UserRole || fallbackRole);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setRole(fallbackRole);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.role]);

  return { 
    role, 
    loading, 
    isTeacher: role === "teacher" || role === "admin", 
    isStudent: role === "student",
    isAdmin: role === "admin"
  };
};
