"use client";

/**
 * PageSkeleton – a universal shimmer skeleton loader.
 *
 * Usage:
 *   import PageSkeleton from "@/components/PageSkeleton";
 *   if (loading) return <PageSkeleton />;
 *
 * Props:
 *   variant?: "page" (default) | "card" | "form" | "table" | "report"
 */

type Variant = "page" | "card" | "form" | "table" | "report";

interface Props {
  variant?: Variant;
}

function SkeletonBlock({ w = "w-full", h = "h-4", className = "" }: { w?: string; h?: string; className?: string }) {
  return (
    <div
      className={`${w} ${h} ${className} rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 space-y-3 shadow-sm">
      <SkeletonBlock h="h-5" w="w-2/5" />
      <SkeletonBlock h="h-3" w="w-full" />
      <SkeletonBlock h="h-3" w="w-4/5" />
      <SkeletonBlock h="h-3" w="w-3/5" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <div className="flex gap-4 py-3 px-4 border-b border-slate-100 dark:border-slate-700/60">
      <SkeletonBlock w="w-1/4" h="h-4" />
      <SkeletonBlock w="w-1/4" h="h-4" />
      <SkeletonBlock w="w-1/5" h="h-4" />
      <SkeletonBlock w="w-1/5" h="h-4" />
      <SkeletonBlock w="w-16" h="h-6" className="rounded-full" />
    </div>
  );
}

export default function PageSkeleton({ variant = "page" }: Props) {
  if (variant === "card") {
    return (
      <div className="p-6 w-full space-y-4">
        <SkeletonBlock w="w-48" h="h-7" />
        <SkeletonCard />
      </div>
    );
  }

  if (variant === "report") {
    return (
      <div className="py-8 space-y-6 w-full">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 space-y-2">
              <SkeletonBlock h="h-3" w="w-2/3" />
              <SkeletonBlock h="h-8" w="w-1/2" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <SkeletonBlock h="h-5" w="w-1/3" className="mb-4" />
          <SkeletonBlock h="h-40" w="w-full" />
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="p-6 w-full space-y-6 max-w-4xl mx-auto">
        {/* Page title */}
        <SkeletonBlock w="w-48" h="h-8" />

        {/* Form card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 space-y-5">
          <SkeletonBlock w="w-32" h="h-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <SkeletonBlock w="w-24" h="h-3" />
                <SkeletonBlock h="h-10" />
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <SkeletonBlock w="w-24" h="h-10" />
          <SkeletonBlock w="w-32" h="h-10" />
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="p-6 w-full space-y-4">
        {/* Header row */}
        <div className="flex justify-between items-center">
          <SkeletonBlock w="w-40" h="h-7" />
          <SkeletonBlock w="w-28" h="h-9" />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {/* Table header */}
          <div className="flex gap-4 py-3 px-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} w="flex-1" h="h-3" />
            ))}
          </div>
          {/* Rows */}
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <SkeletonTableRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Default: "page" — for detail/dashboard pages
  return (
    <div className="p-6 w-full space-y-5">
      {/* Breadcrumb / title row */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBlock w="w-56" h="h-7" />
          <SkeletonBlock w="w-36" h="h-3" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock w="w-24" h="h-9" />
          <SkeletonBlock w="w-24" h="h-9" />
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 space-y-2">
            <SkeletonBlock h="h-3" w="w-2/3" />
            <SkeletonBlock h="h-7" w="w-1/2" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Wide card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 space-y-3">
        <SkeletonBlock h="h-5" w="w-1/4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    </div>
  );
}
