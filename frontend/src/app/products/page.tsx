import { ProductListResponse, ProductSort } from "@/types/api";
import type { Metadata } from "next";
import { ProductFilters } from "../_components/products/Productfilters";
import { api, ApiError, errorMessage } from "@/lib/api";
import { DEFAULT_SORT } from "@/constants/product";
export const metadata: Metadata = { title: "Products | Bazaar" };

const SORTS: ProductSort[] = ["newest", "price_asc", "price_desc", "rating"];
const PAGE_SIZE = 12;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function Productpage({ searchParams }: { searchParams: SearchParams }) {
    const sp = await searchParams;

    const search = (first(sp.search) ?? "").trim();
    const category = (first(sp.category) ?? "").trim();
    const requestedSort = first(sp.sort) as ProductSort | undefined;
    const sort = requestedSort && SORTS.includes(requestedSort)
        ? requestedSort
        : DEFAULT_SORT;
    const page = Math.max(1, Math.floor(Number(first(sp.page))) || 1);

    let data: ProductListResponse | null = null;
    let categories: string[] = [];
    let error = "";

    try {
        [data, categories] = await Promise.all([
            api.get<ProductListResponse>("/products", {
                auth: false,
                cache: "no-store",
                query: { search, category, sort, page, limit: PAGE_SIZE },
            }),
            api.get<string[]>("/products/categories", {
                auth: false,
                cache: "no-store"
            }),
        ]);

    } catch (err) {
        error = errorMessage(err);
    }

    const keep: Record<string, string> = {};

    if (search) keep.search = search;
    if (category) keep.category = category;
    if (sort !== DEFAULT_SORT) keep.sort = sort;

   

    return (
        <main className="mx-auto max-w-7xl sapce-y-6 px-4 py-8 sm: px-6">
            <header className="space-y-1">
                <h1 className="text-3xl font-black tracking-[-0.04em] text-brand-navy">Browse Products</h1>
                {data && (
                    <p className="text-sm text-muted-foreground" aria-live="polite">
                        {data.total === 0
                            ? "No matches"
                            : `Showing ${(data.page - 1) * data.limit + 1} to ${Math.min(data.page * data.limit, data.total)} of ${data.total} products`
                        }
                    </p>
                )}
            </header>


        </main>
    );
}