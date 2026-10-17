import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request : NextRequest){
    const {pathname} = request.nextUrl;

    if(pathname == "/"){
        return NextResponse.redirect(new URL ('/login', request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: '/',
};