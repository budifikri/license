
import React from 'react';
import { X } from '../icons';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onMouseDown={() => onOpenChange(false)}
    >
        {children}
    </div>
  );
};

const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div 
    onMouseDown={(e) => e.stopPropagation()}
    className={`relative z-10 w-full rounded-lg border bg-background shadow-lg sm:w-auto sm:min-w-[30rem] ${className || 'sm:max-w-lg'}`}
  >
    {children}
  </div>
);

const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left p-6 ${className || ''}`}>
    {children}
  </div>
);

const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}>{children}</h2>
);

const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={`text-sm text-muted-foreground ${className || ''}`}>{children}</p>
);

const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0 ${className || ''}`}>
    {children}
  </div>
);

interface DialogCloseProps {
    onClose: () => void;
}

const DialogClose: React.FC<DialogCloseProps> = ({ onClose }) => (
    <button onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </button>
);


export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose };