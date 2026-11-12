import Nav from "../_components/navbar/nav";

export default function ShopLayout({children}: {children: React.ReactNode}){
    return (
        <>
        <Nav/>
        {children}
        </>
    )
}