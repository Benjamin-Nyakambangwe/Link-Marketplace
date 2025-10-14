import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, Target, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
    title: "About Us | Click Optima",
    description: "Learn about Click Optima, the premier marketplace for link building and guest posting. Our mission is to connect publishers and advertisers in a secure and transparent environment.",
    keywords: ["about us", "link building", "guest posting", "SEO", "digital marketing"],
    openGraph: {
        title: "About Us | Click Optima",
        description: "Learn about Click Optima, our mission, and our team.",
        url: "https://click-optima.com/about",
        siteName: "Click Optima",
        images: [
            {
                url: "https://click-optima.com/og-image-about.png",
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "About Us | Click Optima",
        description: "Learn about Click Optima, our mission, and our team.",
        images: ["https://click-optima.com/twitter-image-about.png"],
    },
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Header />
            <main className="container mx-auto px-4 py-16">
                <section className="text-center mb-16">
                    <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
                        About <span className="text-teal-600">Click Optima</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        We are dedicated to creating a transparent and efficient marketplace for link building, connecting publishers and advertisers to foster mutual growth.
                    </p>
                </section>

                <section className="grid md:grid-cols-3 gap-8 mb-16">
                    <Card className="text-center">
                        <CardHeader>
                            <div className="mx-auto bg-teal-100 rounded-full p-3 w-fit mb-4">
                                <Target className="h-8 w-8 text-teal-600" />
                            </div>
                            <CardTitle>Our Mission</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">
                                To provide a secure and reliable platform that empowers advertisers to acquire high-quality backlinks and helps publishers monetize their websites effectively.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="text-center">
                        <CardHeader>
                            <div className="mx-auto bg-teal-100 rounded-full p-3 w-fit mb-4">
                                <Handshake className="h-8 w-8 text-teal-600" />
                            </div>
                            <CardTitle>Our Vision</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">
                                To be the leading marketplace for link building, known for our commitment to quality, transparency, and customer satisfaction.
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="text-center">
                        <CardHeader>
                            <div className="mx-auto bg-teal-100 rounded-full p-3 w-fit mb-4">
                                <Users className="h-8 w-8 text-teal-600" />
                            </div>
                            <CardTitle>Our Values</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600">
                                Integrity, transparency, and a commitment to excellence are at the core of everything we do. We believe in building long-term relationships based on trust and mutual respect.
                            </p>
                        </CardContent>
                    </Card>
                </section>

            </main>

            <Footer />
        </div>
    )
}
