import {notFound} from "next/navigation";
import Link from "next/link";
import {ChevronLeft} from "lucide-react";

import {GroupDashboardBootstrap} from "@/components/group-dashboard-bootstrap";
import {getAdminSession} from "@/lib/admin/auth";
import {getAvailableGroups} from "@/lib/core/group-data";
import {loadSiteSettings} from "@/lib/site-settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface GroupPageProps {
  params: Promise<{ groupName: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

// 生成页面元数据
export async function generateMetadata({ params }: GroupPageProps) {
  const { groupName } = await params;
  const decodedGroupName = decodeURIComponent(groupName);
  const siteSettings = await loadSiteSettings();

  return {
    title: `${decodedGroupName} - ${siteSettings.siteName}`,
    description: `查看 ${decodedGroupName} 在 ${siteSettings.siteName} 中的模型健康状态。${siteSettings.siteDescription}`,
  };
}

export default async function GroupPage({ params, searchParams }: GroupPageProps) {
  const { groupName } = await params;
  const decodedGroupName = decodeURIComponent(groupName);
  const query = searchParams ? await searchParams : {};
  const embeddedMode = query.ui_mode === "embedded";
  const backParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) backParams.append(key, item);
      }
      continue;
    }
    backParams.set(key, value);
  }
  const backHref = backParams.toString() ? `/?${backParams.toString()}` : "/";

  const [availableGroups, adminSession] = await Promise.all([
    getAvailableGroups(),
    getAdminSession(),
  ]);
  if (!availableGroups.includes(decodedGroupName)) {
    notFound();
  }

  return (
    <div className={embeddedMode ? "min-h-screen py-0" : "min-h-screen py-8 md:py-16"}>
      <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-3 sm:gap-8 sm:px-6 lg:px-12">
        {!embeddedMode && (
          <Link
            href={backHref}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border/40 bg-background/60 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition hover:border-border/80 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            返回首页
          </Link>
        )}

        <GroupDashboardBootstrap
          groupName={decodedGroupName}
          canForceRefresh={Boolean(adminSession)}
          embeddedMode={embeddedMode}
        />
      </main>
    </div>
  );
}
