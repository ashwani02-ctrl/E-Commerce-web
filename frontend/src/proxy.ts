import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function proxy(request : NextRequest){
    const {pathname} = request.nextUrl;

   
}

export const config = {
    matcher: '/',
};