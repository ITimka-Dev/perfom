import { useEffect, useState } from "react";
import { Wifi, WifiOff, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface WebSocketIndicatorProps {
  isConnected: boolean;
  connectionError?: string | null;
}

interface EventLog {
  timestamp: number;
  message: string;
  type: 'connect' | 'disconnect' | 'error' | 'event';
}

const MAX_EVENTS = 10;

export function WebSocketIndicator({ isConnected, connectionError }: WebSocketIndicatorProps) {
  const [showError, setShowError] = useState(false);
  const [eventHistory, setEventHistory] = useState<EventLog[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);

  useEffect(() => {
    if (connectionError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      
      // Add error to history
      setEventHistory(prev => [
        {
          timestamp: Date.now(),
          message: `Ошибка: ${connectionError}`,
          type: 'error' as const
        },
        ...prev
      ].slice(0, MAX_EVENTS));
      
      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  useEffect(() => {
    if (isConnected) {
      setConnectionCount(prev => prev + 1);
      setEventHistory(prev => [
        {
          timestamp: Date.now(),
          message: 'Подключено к серверу',
          type: 'connect' as const
        },
        ...prev
      ].slice(0, MAX_EVENTS));
    } else {
      setEventHistory(prev => [
        {
          timestamp: Date.now(),
          message: 'Отключено от сервера',
          type: 'disconnect' as const
        },
        ...prev
      ].slice(0, MAX_EVENTS));
    }
  }, [isConnected]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventColor = (type: EventLog['type']) => {
    switch (type) {
      case 'connect':
        return 'text-green-500';
      case 'disconnect':
        return 'text-yellow-500';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          variant={isConnected ? "default" : "destructive"}
          className="cursor-pointer gap-1.5 transition-all hover:scale-105"
        >
          {isConnected ? (
            <Wifi className="h-3 w-3 animate-pulse" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span className="text-xs">
            {isConnected ? "Online" : "Offline"}
          </span>
          {isConnected && (
            <span className="text-xs opacity-70">
              ({connectionCount})
            </span>
          )}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              WebSocket статус
            </h4>
            <p className="text-xs text-muted-foreground">
              {isConnected ? "Real-time обновления активны" : "Подключение отсутствует"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <p className="text-muted-foreground">Статус</p>
              <p className="font-medium">{isConnected ? "Подключено" : "Отключено"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Подключений</p>
              <p className="font-medium">{connectionCount}</p>
            </div>
          </div>

          {showError && connectionError && (
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
              <p className="text-destructive font-medium">Ошибка подключения</p>
              <p className="text-destructive/80">{connectionError}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground">
              История событий
            </h5>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {eventHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Нет событий
                  </p>
                ) : (
                  eventHistory.map((event, index) => (
                    <div key={index} className="text-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className={getEventColor(event.type)}>
                          {event.message}
                        </span>
                        <span className="text-muted-foreground">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
