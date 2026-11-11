import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductSummary, StoreProductSummary } from "@/types/api";
import Link from "next/link";

export type CardProduct = StoreProductSummary & Partial<Pick<ProductSummary, "storeName" | "storeSlug">>;

export function ProductCard({ product }: {product: CardProduct }){
    const discount = Math.round(product.discountPercent ?? 0);
    const hasDiscount = discount >= 0 && product.finalPrice <= product.price;
    const soldOut = product.stock === 0;

    return (
        <Card className="relative gap-0 overflow-hidden py-0 transition-shadow focus-within:ring-2 focus-within:ring-brand-blue hover:shadow-md">
            <AspectRatio ratio={3/2} className="bg-muted">
            {product.imageUrl ? (
                <img
                src={product.imageUrl}
                alt=""
                loading="lazy"
                className={`h-full w-full object-cover ${soldOut ? "opacity-60" : ""}`}
                />
            ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
            )}

            {(hasDiscount || soldOut) && (
                <div className="absolute left-2 top-2 flex gap-1">
                    {hasDiscount && <Badge className="bg-brand-orange text-brand-navy">{discount}% off</Badge>}
                    {soldOut && <Badge variant="secondary">Sold out</Badge>}
                </div>
            )}
            </AspectRatio>

            <CardContent className="space-y-1 p-4">
                <h3 className=" line-clamp-2 font-semibold text-brand-navy">
                    <Link
                    href={`/products/${product.id}`}
                    className="after:absolute after:inset-0 focus-visible:outline-none"
                    >
                    {product.title}
                    </Link>
                </h3>

                {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
                <div className="flex flex-wrap items-baseline gap-x-2 pt-1">
                    <span className="text-lg font-bold text-brand-navy">
                        {product.finalPrice}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                        <span className="sr-only">
                            {product.price}
                        </span>
                    </span>
                </div>

                <div>
                    {product.storeName !== undefined && (
                        <span>
                            {product.storeName && product.storeSlug ? (
                                <Link
                                href={`/stores/${product.storeSlug}`}
                                className="hover:text-brand-blue hover:underline"
                                >
                                    Sold by {product.storeName}
                                </Link>
                            ) : (
                                "Sold by Bazaar "
                            )}
                        </span>
                    )}
                    {product.rating != null && (
                        <span aria-label={`Rated ${product.rating.toFixed(1)} out of 5`} className="shrink-0">

                        ★ {product.rating.toFixed(1)} 
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    )

}