
'use client';

import React from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Loader2,
  Trash2,
  ExternalLink,
  Check
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function NotificationsPopover({ isAdmin = false }: { isAdmin?: boolean }) {
  const { user } = useUser();
  const firestore = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (isAdmin) {
      return query(
        collection(firestore, 'adminNotifications'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
    }
    return query(
      collection(firestore, 'notifications', user.uid, 'userNotifications'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore, user, isAdmin]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const unreadCount = React.useMemo(() => {
    return notifications?.filter(n => !n.read).length || 0;
  }, [notifications]);

  const markAsRead = (id: string) => {
    if (!firestore || !user) return;
    const path = isAdmin 
      ? doc(firestore, 'adminNotifications', id)
      : doc(firestore, 'notifications', user.uid, 'userNotifications', id);
    updateDocumentNonBlocking(path, { read: true });
  };

  const markAllAsRead = () => {
    if (!firestore || !user || !notifications) return;
    notifications.forEach(notif => {
      if (!notif.read) {
        const path = isAdmin 
          ? doc(firestore, 'adminNotifications', notif.id)
          : doc(firestore, 'notifications', user.uid, 'userNotifications', notif.id);
        updateDocumentNonBlocking(path, { read: true });
      }
    });
  };

  const deleteNotification = (id: string) => {
    if (!firestore || !user) return;
    const path = isAdmin 
      ? doc(firestore, 'adminNotifications', id)
      : doc(firestore, 'notifications', user.uid, 'userNotifications', id);
    deleteDocumentNonBlocking(path);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl bg-slate-50 relative group">
          <Bell className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-3 right-3 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 rounded-[2rem] border-slate-100 shadow-2xl overflow-hidden" align="end">
        <div className="bg-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest">Registry Intelligence</h3>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">
                {isAdmin ? 'Official Command Alerts' : 'Operational Status Updates'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-[9px] font-black uppercase tracking-widest h-8 px-4 text-white hover:bg-white/10"
              >
                <Check className="w-3 h-3 mr-2" /> Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-10 flex flex-col items-center justify-center space-y-4 opacity-40">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-[9px] font-black uppercase tracking-widest">Syncing Feed...</p>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "p-5 transition-all hover:bg-slate-50 relative group cursor-pointer",
                    !notif.read && "bg-blue-50/30"
                  )}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      notif.type === 'success' ? "bg-emerald-50 text-emerald-600" :
                      notif.type === 'alert' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                       notif.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-black text-primary uppercase truncate">{notif.title}</p>
                        <span className="text-[8px] font-bold text-slate-400 uppercase whitespace-nowrap">
                          {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      {notif.link && (
                        <Link href={notif.link}>
                          <Button variant="ghost" className="h-6 px-0 text-[9px] font-black text-accent hover:text-primary uppercase tracking-widest mt-2">
                            Access Node <ExternalLink className="w-2.5 h-2.5 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center opacity-30 px-10 text-center">
              <Bell className="w-10 h-10 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Operational Feed Empty</p>
              <p className="text-[9px] font-bold uppercase mt-2">No registry events recorded at this time.</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">SHLCS Intelligence Node</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
