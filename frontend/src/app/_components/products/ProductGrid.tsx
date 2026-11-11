import { Card, CardContent } from "@/components/ui/card";
import { ProductCard, type CardProduct } from "./Productcard";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
const GRID = "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
export default function ProductGrid({ products }: { products: CardProduct[]}){
    if(products.length === 0) {
        return (
            <Card role="status" className="items-center py-16 text-center">
               <CardContent>
                <p>No products found</p>
                <p>Try a different search word, or clear the filters to see everything.</p>
                </CardContent> 
            </Card>
        )
    }

    return (
        <ul className={GRID}>
            {products.map((product) => (
                <li key={product.id}>
                    <ProductCard product={product}/>
                </li>
            ))}
        </ul>
    );
}

export function ProductGridSkeleton({count = 8}: {count?: number}){
    return (
        <div className={GRID} aria-busy="true" aria-label="Loading products">
            {Array.from({length: count}).map((_,i) => (
                <Card key={i} className="gap-0 overflow-hidden py-0">
                    <AspectRatio ratio={3/2}>
                    <Skeleton className="h-full w-full rounded-none"/>
                    </AspectRatio>
                    <CardContent className="space-y-2 p-4">
                        <Skeleton className="h-5 w-3/4"/>
                        <Skeleton className="h-4 w-1/3"/>
                        <Skeleton className="h-6 w-1/2"/>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}