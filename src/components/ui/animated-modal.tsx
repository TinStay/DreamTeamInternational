"use client";

import { cn } from "@/lib/utils";
import { MODAL_BACKDROP_Z, MODAL_CONTENT_Z, MODAL_CONTROL_Z, MODAL_LAYER_Z } from "@/lib/modal-layer";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { AnimatePresence, motion } from "motion/react";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return <ModalContext.Provider value={{ open, setOpen }}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export function Modal({ children }: { children: ReactNode }) {
  return <ModalProvider>{children}</ModalProvider>;
}

export const ModalTrigger = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { setOpen } = useModal();
  return (
    <button
      type="button"
      className={cn("relative overflow-hidden text-left", className)}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
};

export const ModalBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { open, setOpen } = useModal();
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const handleOutside = useCallback(() => setOpen(false), [setOpen]);
  useOutsideClick(modalRef, handleOutside);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className={cn(
            "fixed inset-0 flex h-full w-full items-center justify-center [perspective:800px] [transform-style:preserve-3d]",
            MODAL_LAYER_Z
          )}
        >
          <Overlay />

          <motion.div
            ref={modalRef}
            className={cn(
              "relative flex max-h-[95vh] w-[94vw] max-w-[94vw] shrink-0 flex-col overflow-hidden rounded-2xl border border-transparent bg-white dark:border-neutral-800 dark:bg-neutral-950 md:w-[60vw] md:max-w-[60vw]",
              MODAL_CONTENT_Z,
              className
            )}
            initial={{ opacity: 0, scale: 0.5, rotateX: 40, y: 40 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 15 }}
          >
            <CloseIcon />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const ModalContent = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8", className)}>{children}</div>;
};

export const ModalFooter = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex justify-end gap-3 bg-gray-100 p-4 dark:bg-neutral-900", className)}>{children}</div>
  );
};

export const ModalClose = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { setOpen } = useModal();
  return (
    <button type="button" onClick={() => setOpen(false)} className={className}>
      {children}
    </button>
  );
};

const Overlay = ({ className }: { className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      className={cn("fixed inset-0 h-full w-full bg-black/50", MODAL_BACKDROP_Z, className)}
    />
  );
};

const CloseIcon = () => {
  const { setOpen } = useModal();
  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className={cn("group absolute top-4 right-4 cursor-pointer", MODAL_CONTROL_Z)}
      aria-label="Close"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-black transition duration-200 group-hover:scale-125 group-hover:rotate-3 dark:text-white"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
};
