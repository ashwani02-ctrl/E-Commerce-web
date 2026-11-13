import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_SORT } from "@/constants/product";
import { ProductFilters } from "../../../_components/products/Productfilters";
import  ProductGrid from "../../../_components/products/ProductGrid";
import { ProductPagination } from "../../../_components/products/ProductPagination";
import { ApiError, api, errorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { ProductSort, StoreProductsResponse, StoreProfile } from "@/types/api";

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc", "rating"];
const PAGE_SIZE = 12;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// cache() makes generateMetadata and the page share one request instead of fetching twice
const getStore = cache((slug: string) =>
  api.get<StoreProfile>(`/stores/${encodeURIComponent(slug)}`, { auth: false, cache: "no-store" })
);

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const store = await getStore(slug);
    return { title: `${store.name} | Bazaar`, description: store.description ?? undefined };
  } catch {
    return { title: "Store | Bazaar" };
  }
}

export default async function StorePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  let store: StoreProfile;
  try {
    store = await getStore(slug);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err; // anything else goes to the nearest error page
  }

  const search = (first(sp.search) ?? "").trim();
  const requestedSort = first(sp.sort) as ProductSort | undefined;
  const sort = requestedSort && SORTS.includes(requestedSort) ? requestedSort : DEFAULT_SORT;
  const page = Math.max(1, Math.floor(Number(first(sp.page))) || 1);

  let data: StoreProductsResponse | null = null;
  let error = "";
  try {
    data = await api.get<StoreProductsResponse>(`/stores/${encodeURIComponent(store.slug)}/products`, {
      auth: false,
      cache: "no-store",
      query: { search, sort, page, limit: PAGE_SIZE },
    });
  } catch (err) {
    error = errorMessage(err);
  }

  // the filters to keep when the page number changes
  const keep: Record<string, string> = {};
  if (search) keep.search = search;
  if (sort !== DEFAULT_SORT) keep.sort = sort;

  const initial = store.name.trim().charAt(0).toUpperCase() || "?";
  const isEmptyStore = store.productCount === 0 && !search;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{store.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="py-6">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-brand-navy text-2xl font-bold text-white">{initial}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-[-0.04em] text-brand-navy">{store.name}</h1>
            {store.description && (
              <p className="max-w-prose leading-relaxed text-muted-foreground">{store.description}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {store.productCount} {store.productCount === 1 ? "product" : "products"}
              {store.createdAt && ` · Selling since ${formatDate(store.createdAt)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {isEmptyStore ? (
        <Card role="status" className="items-center py-16 text-center">
          <CardContent className="space-y-2">
            <p className="text-lg font-semibold text-brand-navy">Nothing here yet</p>
            <p className="text-sm text-muted-foreground">{store.name} hasn&apos;t listed any products.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* no category chips here: the category list covers the whole marketplace, not just this store */}
          <ProductFilters categories={[]} search={search} category="" sort={sort} />

          {data && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {data.total === 0
                ? "No matches"
                : `Showing ${(data.page - 1) * data.limit + 1} to ${Math.min(data.page * data.limit, data.total)} of ${data.total} products`}
            </p>
          )}

          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertTitle>We couldn&apos;t load this store&apos;s products</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            data && (
              <>
                <ProductGrid products={data.products} />
                <ProductPagination
                  page={data.page}
                  totalPages={data.totalPages}
                  basePath={`/stores/${store.slug}`}
                  params={keep}
                />
              </>
            )
          )}
        </>
      )}
    </main>
  );
}