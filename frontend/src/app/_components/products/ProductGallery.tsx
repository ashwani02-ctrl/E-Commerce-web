"use client"
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";

interface Props {
    title: string;
    imageUrl: string | null;
    images: string[] | null;
}

export function ProductGallery({title, imageUrl, images}: Props){
    const all = Array.from(new Set([imageUrl, ...(images ?? [])].filter((u): u is string => Boolean(u))));
    const [active, setActive] = useState(0);

    if(all.length === 0){
        return (
            <AspectRatio ratio={1} className="rounded-xl bg-muted">
                <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
            </AspectRatio>
        )
    };

    return (
        <div>
            <AspectRatio ratio={1} >

            </AspectRatio>
        </div>
    )
}