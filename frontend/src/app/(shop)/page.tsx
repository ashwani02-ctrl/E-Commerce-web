"use client"

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Homepage from "../_components/landing-page/homepage";
import Nav from "../_components/navbar/nav";




export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  

 

  return (
    <main className="min-h-screen bg-background text-foreground">

      <section className="mx-auto max-w-7xl px-6 lg:px-10">
        <Homepage/>
      </section>
    </main>
  );
}
