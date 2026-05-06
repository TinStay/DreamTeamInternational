"use client";

import { InfiniteGrid } from "@/components/ui/the-infinite-grid";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";

export default function InfiniteGridDemoPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-24 pb-12">
      <PageBreadcrumbs />
      <InfiniteGrid />
    </div>
  );
}
