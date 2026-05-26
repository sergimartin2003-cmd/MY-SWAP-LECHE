import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useStore } from '../store/useStore';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: { bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.25)', icon: '#00FF88' },
  error: { bg: 'rgba(255,45,120,0.08)', border: 'rgba(255,45,120,0.25)', icon: '#FF2D78' },
  warning: { bg: 'rgba(255,184,0,0.08)', border: 'rgba(255,184,0,0.25)', icon: '#FFB800' },
  info: { bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.25)', icon: '#00D4FF' },
};

export default function NotificationToast() {
  const { notifications, removeNotification } = useStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => {
          const Icon = icons[n.type];
          const c = colors[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 80, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.85 }}
              transition={{ type: 'spring', bounce: 0.3 }}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl w-80"
              style={{ background: c.bg, border: `1px solid ${c.border}`, backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
            >
              <Icon size={18} style={{ color: c.icon, flexShrink: 0, marginTop: 1 }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{n.title}</p>
                <p className="text-xs text-white/50 mt-0.5 truncate">{n.message}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeNotification(n.id)}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={14} />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
