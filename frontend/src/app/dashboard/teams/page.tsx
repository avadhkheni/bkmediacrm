"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VideoTeam from "../video/page";
import LedTeam from "../led/page";
import SoundTeam from "../sound/page";
import OfficeTeam from "../office/page";
import { Video, Monitor, Speaker, Briefcase, Users } from "lucide-react";

function WorkTeamsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Set tab based on search param or default to 'video'
  const paramTab = searchParams.get("tab");
  const initialTab = (paramTab === "video" || paramTab === "led" || paramTab === "sound" || paramTab === "office") 
    ? paramTab 
    : "video";

  const [activeTab, setActiveTab] = useState<"video" | "led" | "sound" | "office">(initialTab);

  // Keep search params in sync with tab change
  const handleTabChange = (tabId: "video" | "led" | "sound" | "office") => {
    setActiveTab(tabId);
    router.push(`/dashboard/teams?tab=${tabId}`);
  };

  useEffect(() => {
    if (paramTab && (paramTab === "video" || paramTab === "led" || paramTab === "sound" || paramTab === "office")) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const tabs = [
    { id: "video", name: "Video Team", icon: Video, component: VideoTeam },
    { id: "led", name: "LED Screen Team", icon: Monitor, component: LedTeam },
    { id: "sound", name: "Sound/Audio Team", icon: Speaker, component: SoundTeam },
    { id: "office", name: "Office Team", icon: Briefcase, component: OfficeTeam },
  ] as const;

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || VideoTeam;

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Modern High-End Glassmorphic Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl max-w-3xl shadow-sm backdrop-blur-sm">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold tracking-tight transition-all duration-200 ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-100 dark:shadow-none border border-gray-150 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/30"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2.25} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Render the Active Department Component */}
      <div className="bg-transparent">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default function WorkTeamsHubPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-slate-400">Loading Work Teams...</span>
      </div>
    }>
      <WorkTeamsHubContent />
    </Suspense>
  );
}
