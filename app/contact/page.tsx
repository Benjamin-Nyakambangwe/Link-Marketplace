import { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
    title: "Contact Us | Click Optima",
    description: "Get in touch with the Click Optima team. We're here to help with any questions you may have about our link building marketplace.",
    keywords: ["contact us", "support", "link building", "guest posting", "SEO"],
    openGraph: {
        title: "Contact Us | Click Optima",
        description: "Get in touch with the Click Optima team.",
        url: "https://clickoptima.io/contact",
        siteName: "Click Optima",
        images: [
            {
                url: "https://clickoptima.io/og-image-contact.png",
                width: 1200,
                height: 630,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Contact Us | Click Optima",
        description: "Get in touch with the Click Optima team.",
        images: ["https://clickoptima.io/twitter-image-contact.png"],
    },
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Header />
            <main className="container mx-auto px-4 py-16">
                <section className="text-center mb-16">
                    <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
                        Contact <span className="text-teal-600">Us</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                        We're here to help. If you have any questions or need support, please don't hesitate to reach out.
                    </p>
                </section>

                <ContactForm />
            </main>
            <Footer />
        </div>
    )
}
