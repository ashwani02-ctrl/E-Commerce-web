"use client"
import { DEFAULT_SORT } from "@/constants/product";
import { ProductSort } from "@/types/api";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

const prettify = (slug: string) => {
    const text = slug.replace(/-/g, " ");
    return text.charAt(0).toUpperCase() + text.slice(1);
}

interface Props {
  categories: string[];
  search: string;
  category: string;
  sort: ProductSort;
}

export function ProductFilters({categories, search, category, sort}: Props){
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [term, setTerm] = useState(search);

    function go(next: Partial<{ search: string; category: string; sort: ProductSort}>){
        const merged = {search, category, sort, ...next};
        const params = new URLSearchParams();
        if(merged.search) params.set("search", merged.search);
        if(merged.category) params.set("category", merged.category);
        if(merged.sort !== DEFAULT_SORT) params.set("sort", merged.sort);
        const query = params.toString();
        startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));

    }

    function onSearch(e: FormEvent<HTMLFormElement>){
        e.preventDefault();
        go({search: term.trim()});
    }

    const hasFilters = Boolean(search || category);
    return (
        <div>dd</div>
    )
}