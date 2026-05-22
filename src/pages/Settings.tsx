import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SettingsSkeleton } from "@/components/ui/loading-skeleton";
import { Bell, Sprout, Heart, Boxes } from "lucide-react";

interface NotificationSettings {
  enableToasts: boolean;
  farmNotifications: boolean;
  petNotifications: boolean;
  productionNotifications: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    enableToasts: true,
    farmNotifications: true,
    petNotifications: true,
    productionNotifications: true,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/auth");
        return;
      }
      loadSettings();
    }
  }, [authLoading, isAuthenticated, navigate]);

  const loadSettings = () => {
    const saved = localStorage.getItem("notification-settings");
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    setLoading(false);
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("notification-settings", JSON.stringify(newSettings));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 max-w-3xl">
          <SettingsSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 max-w-3xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="gradient-text">Настройки</span>
            </h1>
            <p className="text-muted-foreground">
              Управляйте уведомлениями и другими параметрами приложения
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Уведомления
              </CardTitle>
              <CardDescription>
                Настройте, какие уведомления вы хотите получать
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Global Toast Setting */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="enable-toasts" className="text-base">
                    Показывать уведомления
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Включить или отключить все toast-уведомления
                  </p>
                </div>
                <Switch
                  id="enable-toasts"
                  checked={settings.enableToasts}
                  onCheckedChange={(checked) => updateSetting("enableToasts", checked)}
                />
              </div>

              <Separator />

              {/* Farm Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-green-500" />
                    <Label htmlFor="farm-notifications" className="text-base">
                      Уведомления фермы
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Уведомления о растениях, животных и урожае
                  </p>
                </div>
                <Switch
                  id="farm-notifications"
                  checked={settings.farmNotifications}
                  onCheckedChange={(checked) => updateSetting("farmNotifications", checked)}
                  disabled={!settings.enableToasts}
                />
              </div>

              {/* Pet Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <Label htmlFor="pet-notifications" className="text-base">
                      Уведомления питомца
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Уведомления о действиях с питомцем
                  </p>
                </div>
                <Switch
                  id="pet-notifications"
                  checked={settings.petNotifications}
                  onCheckedChange={(checked) => updateSetting("petNotifications", checked)}
                  disabled={!settings.enableToasts}
                />
              </div>

              {/* Production Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-blue-500" />
                    <Label htmlFor="production-notifications" className="text-base">
                      Уведомления производства
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Уведомления о запуске и завершении производства
                  </p>
                </div>
                <Switch
                  id="production-notifications"
                  checked={settings.productionNotifications}
                  onCheckedChange={(checked) => updateSetting("productionNotifications", checked)}
                  disabled={!settings.enableToasts}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>О приложении</CardTitle>
              <CardDescription>
                Информация о версии и функциях
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Версия:</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">WebSocket статус:</span>
                <span className="font-medium text-green-500">Активен</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Real-time обновления:</span>
                <span className="font-medium text-green-500">Включены</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
