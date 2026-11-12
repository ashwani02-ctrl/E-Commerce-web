"use client"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";
import { useRouter } from "next/navigation";

function getPages(page: number, total: number): (number | string)[] {
    const wanted = new Set([1, total, page - 1, page, page + 1]);
    const sorted = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

    const out: (number | string)[] = [];
    let previous = 0;
    for (const p of sorted) {
        if (p - previous > 1) out.push(`gap-${p}`);
        out.push(p);
        previous = p;
    }
    return out;
}

interface Props {
    page: number;
    totalPages: number;
    basePath: string;
    params: Record<string, string>;
}
export function ProductPagination({ page, totalPages, basePath, params }: Props) {
    const router = useRouter();

    if (totalPages <= 1) return null;

    const hrefFor = (p: number) => {
        const query = new URLSearchParams(params);
        if (p > 1) query.set("page", String(p));
        const text = query.toString();
        return text ? `${basePath}?${text}` : basePath;
    }

    const go = (p: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        router.push(hrefFor(p));
    }

    const atStart = page <= 1;
    const atEnd = page >= totalPages;

    return (
        <Pagination className="mt-8">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href={hrefFor(page - 1)}
                        onClick={atStart ? (e) => e.preventDefault() : go(page - 1)}
                        aria-disabled={atStart}
                        tabIndex={atStart ? -1 : undefined}
                        className={atStart ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>

                {getPages(page, totalPages).map((item) =>
                    typeof item === "string" ? (
                        <PaginationItem key={item}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={item}>
                            <PaginationLink href={hrefFor(item)} isActive={item === page} onClick={go(item)}>
                                {item}
                            </PaginationLink>
                        </PaginationItem>
                    )
                )}

                <PaginationItem>
                    <PaginationNext
                        href={hrefFor(page + 1)}
                        onClick={atEnd ? (e) => e.preventDefault() : go(page + 1)}
                        aria-disabled={atEnd}
                        tabIndex={atEnd ? -1 : undefined}
                        className={atEnd ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}