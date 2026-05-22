import { useEffect, useState } from "react";
import { usersApi } from "@/lib/api-client";

export type UserRole = "admin" | "teacher" | "student" | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const profile = await usersApi.getProfile();
        setRole(profile?.role as UserRole || "student");
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setRole("student");
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return { 
    role, 
    loading, 
    isTeacher: role === "teacher" || role === "admin", 
    isStudent: role === "student",
    isAdmin: role === "admin"
  };
};