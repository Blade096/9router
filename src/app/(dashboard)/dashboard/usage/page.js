"use client";

import { useState, useEffect, Suspense } from "react";
import { UsageStats, RequestLogger, CardSkeleton, SegmentedControl } from "@/shared/components";
import ProviderLimits from "./components/ProviderLimits";
import RequestDetailsTab from "./components/RequestDetailsTab";

export default function UsagePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => setRefreshInterval(data.usageRefreshInterval || 5000))
      .catch(err => console.error("Failed to load refresh interval:", err));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl
        options={[
          { value: "overview", label: "Overview" },
          { value: "logs", label: "Logger" },
          { value: "limits", label: "Limits" },
          { value: "details", label: "Details" },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* Content */}
      {activeTab === "overview" && (
        <Suspense fallback={<CardSkeleton />}>
          <UsageStats refreshInterval={refreshInterval} />
        </Suspense>
      )}
      {activeTab === "logs" && <RequestLogger />}
      {activeTab === "limits" && (
        <Suspense fallback={<CardSkeleton />}>
          <ProviderLimits />
        </Suspense>
      )}
      {activeTab === "details" && <RequestDetailsTab />}
    </div>
  );
}
