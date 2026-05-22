import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from '@/hooks/use-toast';

interface TaskNotificationsConfig {
  userId: string | null;
  onCommentReceived?: (data: any) => void;
  onSubmissionStatusChanged?: (data: any) => void;
  enableToasts?: boolean;
}

export function useTaskNotifications(config: TaskNotificationsConfig) {
  const { userId, onCommentReceived, onSubmissionStatusChanged, enableToasts = true } = config;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('token');

    if (!token) return;

    const socket = io(`${API_URL}/tasks`, {
      transports: ['websocket'],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to tasks WebSocket');
      socket.emit('joinUserRoom', userId);
    });

    socket.on('comment:new', (data) => {
      console.log('New comment notification:', data);
      
      if (enableToasts) {
        toast({
          title: "Новый комментарий",
          description: `Учитель оставил комментарий к вашей работе`,
        });
      }
      
      if (onCommentReceived) {
        onCommentReceived(data);
      }
    });

    socket.on('submission:statusChanged', (data) => {
      console.log('Submission status changed:', data);
      
      if (enableToasts) {
        const statusText = data.status === 'reviewed' ? 'проверена' : 'обновлена';
        toast({
          title: "Статус работы изменен",
          description: `Ваша работа ${statusText}`,
        });
      }
      
      if (onSubmissionStatusChanged) {
        onSubmissionStatusChanged(data);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Tasks socket connection error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, onCommentReceived, onSubmissionStatusChanged, enableToasts]);

  return socketRef.current;
}
