import { Button } from "@/components/ui/button";

export default function Homepage() {
    return (
        <section className="w-full bg-background px-6 py-10 md:px-10 lg:px-12 border  ">
            <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <div className="flex flex-col items-start">
                    <p className="mb-6 text-[10px] font-bold uppercase text-brand-orange">
                        Big color. small joys.
                    </p>

                    <h1 className="font-serif text-6xl font-bold">
                        Find something
                        <span className="text-brand-blue block text-6xl italic font-bold font-serif">
                            wonderfully you.
                        </span>
                    </h1>

                    <p className="mt-5 max-w-[440px]">
                        Independent labels, joyful essentials and everyday treasures all together in one lively marketplace.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                        <Button className="rounded-lg bg-brand-orange px-4 py-6 text-base shadow-[0_6px_18px_rgba(255,152,27,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e88a00] hover:shadow-[0_10px_22px_rgba(255,152,27,0.35)] active:translate-y-0">
                            Explore  the edit <span>{`->`}</span>
                        </Button>
                        <Button className=" px-4 py-6 text-base bg-white text-brand-blue border border-border transition-all duration-200 hover:border-brand-blue/40 hover:bg-brand-blue/5 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0">
                            Meet our sellers
                        </Button>
                    </div>

                    <div className="mt-9 flex gap-12">
                        <div>
                            <h3 className="text-[14px] font-bold text-[#25211e]">
                                250+
                            </h3>
                            <p className="mt-0.5 text-[10px] text-[#77716b]">
                                thoughtful brands
                            </p>
                        </div>

                        <div>
                            <h3 className="text-[14px] font-bold text-[#25211e]">
                                4.8/5
                            </h3>
                            <p className="mt-0.5 text-[10px] text-[#77716b]">
                                happy shoppers
                            </p>
                        </div>
                    </div>
                </div>
                <div className="relative mx-auto w-full max-w-[520px]">

                    <div className="relative h-[360px] overflow-hidden rounded-t-[90px] rounded-b-[12px] sm:h-[420px] lg:h-[395px]">
                        <img
                            src="https://images.unsplash.com/photo-1760337934036-83d1dd595378?auto=format&fit=crop&w=900&q=85"
                            alt="Fashion shopper wearing a stylish outfit"
                            className="h-full w-full object-cover object-center"
                        />
                    </div>

                    {/* YELLOW BADGE */}
                    <div className="absolute -right-3 -top-4 z-10 flex h-[82px] w-[82px] rotate-[10deg] items-center justify-center rounded-full bg-[#f8d96b] text-center font-serif text-[12px] font-bold leading-[1.25] text-[#282019] shadow-sm">
                        Fresh finds
                        <br />
                        under ₹1,999
                    </div>

                    {/* EDITOR PICK */}
                    <div className="absolute -bottom-[-14px] -left-5 flex min-h-[55px] items-center border-l-[4px] border-[#ff927c] bg-white px-4 py-2 shadow-lg">
                        <div>
                            <p className="text-[9px] uppercase tracking-[1px] text-[#89817a]">
                                Editor's pick
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold text-[#25211e]">
                                Colours worth going out for
                            </p>
                        </div>
                    </div>

                </div>
            </div>


        </section >
    )
}