
import { AddtoCart } from "@/app/_components/products/AddtoCart";
import { ProductGallery } from "@/app/_components/products/ProductGallery";
import { Badge } from "@/components/ui/badge";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { api, ApiError } from "@/lib/api";
import { ProductDetail } from "@/types/api";
import { Span } from "next/dist/trace";
import Link from "next/link";
import { notFound } from "next/navigation";

type props = { params: Promise<{ id: string }> };

export default async function ProductPage({ params }: props) {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId < 1) notFound();

    let product: ProductDetail;

    try {
        product = await api.get<ProductDetail>(`/products/${productId}`, { auth: false, cache: "no-store" });

    } catch (err) {
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
        throw err;
    }

    const discount = Math.round(product.discountPercent ?? 0);
    const hasDiscount = discount > 0 && product.finalPrice < product.price;

    return (
        <main className=" max-w-6xl space-y-6 px-4 py-8 sm: px-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/products">Products</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage className="line-clamp-1">{product.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="grid gap-8 md:grid-cols-2">
                <ProductGallery title={product.title} imageUrl={product.imageUrl} images={product.images} />


                <div className="space-y-5">
                    <div className="space-y-2">
                        <p>
                            {product.seller ? (
                                <Link href={`/stores/${product.seller.slug}`} className="hover:text-brand-blue hover:underline">
                                    Sold by {product.seller.name}
                                </Link>
                            ) : (
                                "Sold by Bazaar"
                            )}
                        </p>
                        <h1 className="text-3xl font-black tracking-[-0.04em] text-brand-navy">{product.title}</h1>
                        <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                            {product.brand && <span>{product.brand}</span>}
                            {product.rating != null && (
                                <span aria-label={`Rated ${product.rating.toFixed(1)} out of 5`}>
                                    ★{product.rating.toFixed(1)}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-3xl font-black text-brand-navy">
                            {product.finalPrice}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-lg text-muted-foreground line-through">
                                    <span className="sr-only">Orginal price</span>
                                    {product.price}
                                </span>
                                <Badge className="bg-brand-orange text-brand-navy">{discount}% off</Badge>
                            </>
                        )}
                    </div>

                    <div>
                        {product.stock === 0 ? (
                            <Badge variant="destructive">Out of stock</Badge>
                        ) : product.stock <= 5 ? (
                            <Badge variant="outline">Only {product.stock} left</Badge>
                        ) : (
                            <Badge variant="secondary">In stock</Badge>
                        )}
                    </div>
                    <AddtoCart productId={product.id} stock={product.stock} />

                    <Separator />

                    {product.description && (
                        <section aria-labelledby="description-heading" className="space-y-2">
                            <h2 id="description-heading" className="font-semibold text-brand-navy">
                                About this product
                            </h2>
                            <p className="max-w-prose leading-relaxed text-muted-foreground">{product.description}</p>
                        </section>
                    )}

                    {product.tags && product.tags.length > 0 && (
                        <ul className="flex flex-wrap gap-2" aria-label="Tags">
                            {product.tags.map((tag) => (
                                <li key={tag}>
                                    <Badge variant="secondary">{tag}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </main>
    )
}