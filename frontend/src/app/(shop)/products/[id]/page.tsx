
import { ProductGallery } from "@/app/_components/products/ProductGallery";
import { 
    Breadcrumb, 
    BreadcrumbItem, 
    BreadcrumbLink, 
    BreadcrumbList, 
    BreadcrumbPage, 
    BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { api, ApiError } from "@/lib/api";
import { ProductDetail } from "@/types/api";
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

            <div>
                <ProductGallery title={product.title} imageUrl={product.imageUrl} images={product.images}/>
            </div>
        </main>
    )
}