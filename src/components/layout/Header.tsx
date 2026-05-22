import { Button } from "@/components/ui/button";
import { Menu, User, LogOut, Settings as SettingsIcon, Shield, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { WebSocketIndicator } from "@/components/layout/WebSocketIndicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isWebSocketConnected?: boolean;
  connectionError?: string | null;
}

const Header = ({ isWebSocketConnected = false, connectionError = null }: HeaderProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const { isTeacher, isAdmin } = useUserRole();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.userId,
          email: payload.email,
          fullName: payload.fullName || payload.email,
        });
      } catch (error) {
        console.error('Failed to parse token:', error);
        setUser(null);
      }
    }
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    navigate("/");
  };
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-white font-bold">🌱</span>
            </div>
            <span className="text-xl font-bold gradient-text">Умная ферма</span>
          </div>
        </div>

        {user && (
          <nav className="hidden md:flex items-center gap-6">
            {isAdmin ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/admin")}
                  className="text-sm font-medium"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Админ-панель
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/teacher")}
                  className="text-sm font-medium"
                >
                  Кабинет учителя
                </Button>
              </>
            ) : isTeacher ? (
              <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/teacher")}
                    className="text-sm font-medium"
                  >
                    Кабинет учителя
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/teacher/groups")}
                    className="text-sm font-medium"
                  >
                    Группы учеников
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/tasks")}
                    className="text-sm font-medium"
                  >
                    Управление заданиями
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate("/teacher/reports")}
                    className="text-sm font-medium"
                  >
                    Отчеты
                  </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/dashboard")}
                  className="text-sm font-medium"
                >
                  Дашборд
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/leaderboard")}
                  className="text-sm font-medium"
                >
                  Рейтинг
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/farm")}
                  className="text-sm font-medium"
                >
                  Ферма
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/pet")}
                  className="text-sm font-medium"
                >
                  Питомец
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/tasks")}
                  className="text-sm font-medium"
                >
                  Задания
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/achievements")}
                  className="text-sm font-medium"
                >
                  <Trophy className="mr-1 h-4 w-4" />
                  Достижения
                </Button>
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user && (
            <WebSocketIndicator 
              isConnected={isWebSocketConnected} 
              connectionError={connectionError}
            />
          )}
          
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden md:flex">
                  <User className="h-4 w-4 mr-2" />
                  {user.fullName || user.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.email}
                  {user.fullName && (
                    <div className="text-xs font-normal text-muted-foreground">
                      {user.fullName}
                    </div>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Профиль
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Настройки
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="h-4 w-4 mr-2" />
                      Админ-панель
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/teacher")}>
                      Кабинет учителя
                    </DropdownMenuItem>
                  </>
                ) : isTeacher ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/teacher")}>
                      Кабинет учителя
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/tasks")}>
                      Управление заданиями
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/teacher/reports")}>
                      Отчеты
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      Дашборд
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/farm")}>
                      Интерактивная ферма
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/pet")}>
                      Мой тамагочи
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/tasks")}>
                      Задания
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/achievements")}>
                      <Trophy className="h-4 w-4 mr-2" />
                      Достижения
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" className="hidden md:flex" onClick={() => navigate("/auth")}>
                <User className="h-4 w-4 mr-2" />
                Войти
              </Button>
              <Button className="hidden md:flex" onClick={() => navigate("/auth")}>
                Начать
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
