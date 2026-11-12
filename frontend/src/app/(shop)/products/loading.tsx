import { ProductGridSkeleton } from "../../_components/products/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-11 w-full" />
      <ProductGridSkeleton />
    </main>
  );
}