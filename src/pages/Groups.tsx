import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, UserPlus, BookOpen, TrendingUp } from 'lucide-react';
import { apiClient, usersApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';

interface Group {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface GroupDetails {
  id: string;
  name: string;
  description: string;
  members: Array<{
    id: string;
    email: string;
    fullName: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    assignedAt: string;
    dueDate?: string;
  }>;
}

export default function Groups() {
  const navigate = useNavigate();
  const { isTeacher, loading: roleLoading } = useUserRole();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!roleLoading && !isTeacher) {
      toast.error('Доступ запрещен');
      navigate('/dashboard');
    }
  }, [isTeacher, roleLoading, navigate]);

  useEffect(() => {
    if (isTeacher) {
      loadGroups();
      loadStudents();
    }
  }, [isTeacher]);

  const loadGroups = async () => {
    try {
      const response = await apiClient.get('/groups');
      setGroups(response);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Не удалось загрузить группы');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await usersApi.getStudentsList({ limit: 100 });
      setStudents(response.data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Введите название группы');
      return;
    }

    try {
      await apiClient.post('/groups', newGroup);
      toast.success('Группа создана');
      setCreateDialogOpen(false);
      setNewGroup({ name: '', description: '' });
      loadGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Не удалось создать группу');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту группу?')) {
      return;
    }

    try {
      await apiClient.delete(`/groups/${groupId}`);
      toast.success('Группа удалена');
      loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Не удалось удалить группу');
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Управление группами
            </h1>
            <p className="text-muted-foreground">Создавайте группы и назначайте задания</p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Создать группу
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая группа</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="name">Название группы</Label>
                  <Input
                    id="name"
                    placeholder="Например: Группа 10А"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Описание (необязательно)</Label>
                  <Textarea
                    id="description"
                    placeholder="Краткое описание группы..."
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateGroup} className="w-full">
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Нет групп</p>
              <p className="text-muted-foreground mb-4">Создайте первую группу для начала работы</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Создать группу
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card key={group.id} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{group.name}</CardTitle>
                      {group.description && (
                        <CardDescription className="mt-2">{group.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Управление учениками
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/groups/${group.id}/tasks`)}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Назначить задания
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/groups/${group.id}/stats`)}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Статистика группы
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
