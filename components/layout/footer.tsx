import Link from "next/link";
import { LinkIcon } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-slate-900 text-white py-16">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
                                <LinkIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-bold">Click Optima</span>
                        </div>
                        <p className="text-slate-400">
                            The premier marketplace connecting publishers and advertisers for quality link building opportunities.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">For Publishers</h3>
                        <ul className="space-y-2 text-slate-400">
                            <li>
                                <Link href="/publisher/websites" className="hover:text-white transition-colors">
                                    List Your Website
                                </Link>
                            </li>
                            <li>
                                <Link href="/publisher/dashboard" className="hover:text-white transition-colors">
                                    Publisher Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/publisher/payouts" className="hover:text-white transition-colors">
                                    Payout History
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">For Advertisers</h3>
                        <ul className="space-y-2 text-slate-400">
                            <li>
                                <Link href="/advertiser/listings" className="hover:text-white transition-colors">
                                    Browse Listings
                                </Link>
                            </li>
                            <li>
                                <Link href="/advertiser/dashboard" className="hover:text-white transition-colors">
                                    Advertiser Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/advertiser/orders" className="hover:text-white transition-colors">
                                    My Orders
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold">Support</h3>
                        <ul className="space-y-2 text-slate-400">
                            <li>
                                <Link href="/about" className="hover:text-white transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-white transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="hover:text-white transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
                    <p>&copy; {new Date().getFullYear()} Click Optima. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
