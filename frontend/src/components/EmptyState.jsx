import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = "No items found", 
  description = "No database records match this view.",
  actionButton = null 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white rounded-card border border-brand-border shadow-sm my-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-emerald mb-4 border border-brand-border">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-brand-text mb-2">{title}</h3>
      <p className="text-brand-muted text-sm max-w-md mb-6">{description}</p>
      {actionButton && <div>{actionButton}</div>}
    </motion.div>
  );
}
