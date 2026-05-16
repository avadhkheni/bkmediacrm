"use client";

import { useUIStore } from "@/store/uiStore";
import { CheckCircle2, XCircle, AlertCircle, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UIProvider() {
  const { toasts, removeToast, confirmConfig, hideConfirm } = useUIStore();

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[300px] ${
                toast.type === 'success' ? 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-900/50' :
                toast.type === 'error' ? 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-900/50' :
                'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900/50'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
              {toast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />}
              
              <p className="text-sm font-semibold text-slate-800 dark:text-white flex-1">{toast.message}</p>
              
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmConfig.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideConfirm}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    confirmConfig.isDestructive ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    {confirmConfig.isDestructive ? <AlertTriangle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{confirmConfig.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 pl-16 leading-relaxed">
                  {confirmConfig.message}
                </p>
              </div>
              
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button
                  onClick={hideConfirm}
                  className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  {confirmConfig.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    hideConfirm();
                    confirmConfig.onConfirm();
                  }}
                  className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors shadow-sm ${
                    confirmConfig.isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmConfig.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
