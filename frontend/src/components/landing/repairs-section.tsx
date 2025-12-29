import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, Shield, CheckCircle } from "lucide-react";

const repairServices = [
    { name: "Schermvervanging", price: "Vanaf €49", slogan: "Gebarsten? Geen zorgen!" },
    { name: "Batterij Vervanging", price: "Vanaf €29", slogan: "Weer vol energie" },
    { name: "Waterschade", price: "Vanaf €79", slogan: "Wij redden wat anderen opgeven" },
    { name: "Oplaadpoort", price: "Vanaf €39", slogan: "Altijd verbonden blijven" },
];

const features = [
    { icon: Clock, text: "Dezelfde dag klaar" },
    { icon: Shield, text: "90 dagen garantie" },
    { icon: CheckCircle, text: "Originele onderdelen" },
];

export function RepairsSection() {
    return (
        <section className="py-24 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:14px_24px]" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium">
                            <Wrench className="w-4 h-4" />
                            Professionele Reparaties
                        </div>

                        <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                            Professionele Reparaties,
                            <span className="block text-violet-400">Dezelfde Dag Klaar!</span>
                        </h2>

                        <p className="text-lg text-zinc-400 max-w-lg">
                            Onze gecertificeerde technici repareren alles: van gebarsten schermen tot waterschade.
                            Snelle service, kwaliteitsonderdelen, en eerlijke prijzen.
                        </p>

                        <div className="flex flex-wrap gap-6">
                            {features.map((feature) => (
                                <div key={feature.text} className="flex items-center gap-2 text-sm text-zinc-300">
                                    <feature.icon className="w-5 h-5 text-violet-400" />
                                    {feature.text}
                                </div>
                            ))}
                        </div>

                        <Link href="/repair/book">
                            <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100">
                                Maak Afspraak
                            </Button>
                        </Link>
                    </div>

                    {/* Right Content - Service Cards */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        {repairServices.map((service) => (
                            <div
                                key={service.name}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                            >
                                <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                                <p className="text-xs text-zinc-400 mb-2 italic">"{service.slogan}"</p>
                                <p className="text-violet-400 font-medium">{service.price}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
