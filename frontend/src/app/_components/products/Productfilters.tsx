"use client"
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_SORT } from "@/constants/product";
import { ProductSort } from "@/types/api";
import { Input } from "@base-ui/react";
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
        <div className="space-y-4" aria-busy={isPending}>
            <div className="flex flex-col gap-3 sm:flex-row">
                <form>
                    <Input
                    type="search"
                    name="search"
                    aria-label="Search products"
                    placeholder="Search by name, brand or description"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="h-11 bg-white" 
                    >
                    </Input>
                    <Button type="submit" className="h-11 bg-brand-navy px-6 text-white hover:bg-brand-blue">
                        Search
                    </Button>
                </form>

                <Select value={sort} onValueChange={(value) => go({ sort: value as ProductSort})}>
                    <SelectTrigger aria-label="Sort products" className="h-11 w-full bg-white sm:w-56">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="categories">
                <Button
                type="button"
                size="sm"
                variant={category === ""? "default" : "outline"}
                aria-pressed={category === ""}
                onClick={() => go({category: ""})}
                className={category === ""? "bg-brand-navy text-white hover:bg-brand-blue": ""}
                >
                    All
                </Button>
                {categories.map((item) => {
                    const active = item === category;
                    return (
                        <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        aria-pressed={active}
                        onClick={() => go({category: item})}
                        className={active ? "bg-brand-navy text-white hover:bg-brand-blue" : ""}
                        >
                            {prettify(item)}
                        </Button>
                    );
                })}

                {hasFilters && (
                    <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setTerm("");
                            go({search: "", category: ""});
                    }}
                    >
                        Clear filters
                    </Button>
                )}
            </div>
        </div>
    );
}