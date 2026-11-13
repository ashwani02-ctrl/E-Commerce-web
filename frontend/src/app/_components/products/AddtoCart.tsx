"use client"

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { Input } from "@base-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const MAX_PER_ITEM = 20;

export function AddtoCart({ productId, stock }: { productId: number; stock: number }) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();

    const [quantity, setQuantity] = useState(1);
    const [pending, setPending] = useState(false);
    const [result, setResult] = useState<{ok: Boolean; text: string} | null>(null);

    const max = Math.min(stock, MAX_PER_ITEM);
    const clamp = (n: number) => Math.min(max, Math.max(1, n));

    if (stock === 0) {
        return (
            <Button>
                Out of stock
            </Button>
        )
    };

    if (isLoading) return <div className="h-12" aria-hidden="true" />

    if (!user) {
        return (
            <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-brand-navy text-base font-semibold text-white transition-colors hover:bg-brand-blue"
            >
                Log in to add to cart
            </Link>
        );
    }

    if (user.role !== "buyer") {
    return (
      <Alert>
        <AlertDescription>
          Only buyer accounts can place orders. Log in with a buyer account to add this to a cart.
        </AlertDescription>
      </Alert>
    );
  }

  async function add() {
    setPending(true);
    setResult(null);

    try{
        await api.post("buyer/cart/item", {productId, quantity});
        setResult({ok: true, text: quantity === 1 ? "Added to your cart." : `Added ${quantity} to your cart.`});
    }catch(err){
        setResult({ok: false, text: errorMessage(err)});
    }finally{
        setPending(false);
    }
  }

  return (
     <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex items-center gap-1" role="group" aria-label="Quantity">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Decrease quantity"
            disabled={pending || quantity <= 1}
            onClick={() => setQuantity((q) => clamp(q - 1))}
            className="h-12 w-12"
          >
            −
          </Button>
          <Input
            type="number"
            inputMode="numeric"
            aria-label="Quantity"
            min={1}
            max={max}
            value={quantity}
            disabled={pending}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setQuantity(clamp(Math.floor(n)));
            }}
            className="h-12 w-16 bg-white text-center"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Increase quantity"
            disabled={pending || quantity >= max}
            onClick={() => setQuantity((q) => clamp(q + 1))}
            className="h-12 w-12"
          >
            +
          </Button>
        </div>
 
        <Button
          type="button"
          onClick={add}
          disabled={pending}
          className="h-12 flex-1 bg-brand-navy text-base font-semibold text-white hover:bg-brand-blue"
        >
          {pending ? "Adding…" : "Add to cart"}
        </Button>
      </div>
 
      {result && (
        <Alert variant={result.ok ? "default" : "destructive"} role={result.ok ? "status" : "alert"}>
          <AlertDescription>
            {result.text}{" "}
            {result.ok && (
              <Link href="/cart" className="font-semibold underline">
                View cart
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}