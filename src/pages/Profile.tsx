import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/layout/Header";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { usersApi, zonesApi } from "@/lib/api-client";

interface Profile {
  id: string;
  fullName: string | null;
  schoolName: string | null;
  grade: number | null;
  bio: string | null;
  avatarUrl: string | null;
}

interface Zone {
  id: string;
  name: string;
  zoneType: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // WebSocket connection
  const { isConnected, connectionError } = useRealtimeUpdates({
    userId: user?.id || null,
    enableToasts: false,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      await loadProfile(user.id);
      await loadZones();
      if (role === "teacher" || role === "admin") {
        await loadTeacherSubjects(user.id);
      }
    };

    loadData();
  }, [user, role]);

  const loadProfile = async (userId: string) => {
    try {
      const data = await usersApi.getProfile();
      setProfile({
        id: data.id,
        fullName: data.fullName || data.full_name,
        schoolName: data.schoolName || data.school_name,
        grade: data.grade,
        bio: data.bio,
        avatarUrl: data.avatarUrl || data.avatar_url,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      const data = await zonesApi.getAllZones();
      setZones(data.map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        zoneType: zone.zoneType || zone.zone_type,
      })));
    } catch (error) {
      console.error("Error loading zones:", error);
    }
  };

  const loadTeacherSubjects = async (userId: string) => {
    try {
      const subjects = await usersApi.getTeacherSubjects();
      setSelectedSubjects(subjects);
    } catch (error) {
      console.error("Error loading teacher subjects:", error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    try {
      // Update profile via API
      await usersApi.updateProfile({
        fullName: profile.fullName,
        schoolName: profile.schoolName,
        grade: profile.grade,
      });

      // Update teacher subjects if teacher
      if (role === "teacher" || role === "admin") {
        await usersApi.updateTeacherSubjects(selectedSubjects);
      }

      toast({
        title: "Успешно",
        description: "Профиль сохранен",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить профиль",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleSubject = (zoneId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(zoneId)
        ? prev.filter((id) => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isWebSocketConnected={isConnected} connectionError={connectionError} />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Полное имя</Label>
              <Input
                id="full_name"
                value={profile?.fullName || ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, fullName: e.target.value } : null
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_name">Школа</Label>
              <Input
                id="school_name"
                value={profile?.schoolName || ""}
                onChange={(e) =>
                  setProfile((prev) =>
                    prev ? { ...prev, schoolName: e.target.value } : null
                  )
                }
              />
            </div>

            {role === "student" && (
              <div className="space-y-2">
                <Label htmlFor="grade">Класс</Label>
                <Input
                  id="grade"
                  type="number"
                  min="1"
                  max="11"
                  value={profile?.grade || ""}
                  onChange={(e) =>
                    setProfile((prev) =>
                      prev
                        ? { ...prev, grade: parseInt(e.target.value) || null }
                        : null
                    )
                  }
                />
              </div>
            )}

            {(role === "teacher" || role === "admin") && (
              <div className="space-y-2">
                <Label>Преподаваемые предметы</Label>
                <div className="space-y-2">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={zone.id}
                        checked={selectedSubjects.includes(zone.id)}
                        onCheckedChange={() => toggleSubject(zone.id)}
                      />
                      <Label htmlFor={zone.id} className="cursor-pointer">
                        {zone.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
