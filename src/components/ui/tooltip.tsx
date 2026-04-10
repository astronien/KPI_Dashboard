import * as React from "react";

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const Tooltip = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const TooltipTrigger = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export const TooltipContent = ({ children }: { children: React.ReactNode }) => (
  <div className="z-50 overflow-hidden rounded-md border bg-white px-3 py-1.5 text-sm text-gray-900 shadow-md animate-in fade-in-0 zoom-in-95">
    {children}
  </div>
);
