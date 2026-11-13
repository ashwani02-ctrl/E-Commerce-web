"use client"
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Props {
    title: string;
    imageUrl: string | null;
    images: string[] | null;
}

export function ProductGallery({ title, imageUrl, images }: Props) {
    const all = Array.from(new Set([imageUrl, ...(images ?? [])].filter((u): u is string => Boolean(u))));
    const [active, setActive] = useState(0);

    if (all.length === 0) {
        return (
            <AspectRatio ratio={1} className="rounded-xl bg-muted">
                <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
            </AspectRatio>
        )
    };

    return (
        <div>
            <AspectRatio ratio={1} className="overflow-hidden rounded-xl border border-border bg-muted" >
                <img
                    src={all[active] ?? all[0]}
                    alt={`${title}, image ${active + 1} of ${all.length}`}
                    className="h-full w-full object-contain"
                />
            </AspectRatio>

            {all.length > 1 && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Product images">
                    {all.map((url, index) => (
                        <Button
                            key={url}
                            type="button"
                            variant="outline"
                            aria-label={`show image ${index + 1}`}
                            aria-pressed={index === active}
                            onClick={() => setActive(index)}
                            className={`h-16 w-16 overflow-hidden p-0 ${index === active ? "ring-2 ring-brand-navy" : "opacity-80 hover:opacity-100"}`}
                        >
                            <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </Button>
                    ))}

                </div>
            )

            }
        </div>
    )
}