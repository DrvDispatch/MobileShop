import Link from "next/link";
import { Smartphone, Wrench, Headphones, ArrowRight } from "lucide-react";

const categories = [
    {
        icon: Smartphone,
        title: "Smartphones & Tablets",
        description: "Kwalitatieve refurbished toestellen met garantie",
        href: "/phones",
        color: "from-violet-500 to-indigo-500",
        bgColor: "bg-violet-50",
    },
    {
        icon: Headphones,
        title: "Accessoires",
        description: "Hoesjes, laders, screenprotectors en meer",
        href: "/accessories",
        color: "from-pink-500 to-rose-500",
        bgColor: "bg-pink-50",
    },
    {
        icon: Wrench,
        title: "Reparaties",
        description: "Professionele reparaties, dezelfde dag klaar",
        href: "/repair/book",
        color: "from-emerald-500 to-teal-500",
        bgColor: "bg-emerald-50",
    },
];

export function Categories() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
                        Alles voor Uw Smartphone
                    </h2>
                    <p className="text-lg text-zinc-600">
                        Van nieuwe toestellen tot professionele reparaties — wij zijn er voor u
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => (
                        <Link
                            key={category.title}
                            href={category.href}
                            className="group relative overflow-hidden rounded-2xl p-6 bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-xl transition-all duration-300"
                        >
                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-xl ${category.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <category.icon className="w-7 h-7 text-zinc-700" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-semibold text-zinc-900 mb-2 group-hover:text-violet-600 transition-colors">
                                {category.title}
                            </h3>
                            <p className="text-zinc-600 text-sm mb-4">
                                {category.description}
                            </p>

                            {/* Arrow */}
                            <div className="flex items-center text-violet-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Bekijk
                                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Gradient border on hover */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
