"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    const navLinks = [
        {
            href: isHomePage ? "#features" : "/#features",
            label: "Features"
        },
        {
            href: isHomePage ? "#how-it-works" : "/#how-it-works",
            label: "How It Works"
        },
        {
            href: isHomePage ? "#testimonials" : "/#testimonials",
            label: "Testimonials"
        },
        {
            href: "/about",
            label: "About"
        },
        {
            href: "/contact",
            label: "Contact"
        }
    ]

    return (
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
                            <LinkIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">Click Optima</span>
                    </Link>
                </div>
                <nav className="hidden md:flex items-center space-x-8">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "transition-colors",
                                pathname === link.href
                                    ? "text-teal-600 font-semibold"
                                    : "text-slate-600 hover:text-teal-600"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center space-x-3">
                    <Link href="/auth/login">
                        <Button variant="ghost" className="text-slate-600 hover:text-teal-600">
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/auth/register">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">Get Started</Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
