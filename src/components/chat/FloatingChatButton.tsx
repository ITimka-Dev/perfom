import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatWidget } from './ChatWidget';

export const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 w-96 h-[600px] bg-background border border-border rounded-lg shadow-2xl z-40 animate-in slide-in-from-bottom-5">
          <ChatWidget onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
};
