"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";
import { Toaster, toast } from "sonner";

export function ContactForm() {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const data = {
            firstName: formData.get("first-name"),
            lastName: formData.get("last-name"),
            email: formData.get("email"),
            message: formData.get("message"),
        };

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Message sent successfully!");
                (event.target as HTMLFormElement).reset();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Failed to send message.");
            }
        } catch (error) {
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Toaster richColors />
            <div className="grid md:grid-cols-2 gap-16 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Send us a message</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first-name">First Name</Label>
                                    <Input id="first-name" name="first-name" placeholder="John" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last-name">Last Name</Label>
                                    <Input id="last-name" name="last-name" placeholder="Doe" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea id="message" name="message" placeholder="Your message..." className="min-h-[150px]" required />
                            </div>
                            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                                {loading ? "Sending..." : "Send Message"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-slate-900">Contact Information</h2>
                    <div className="space-y-4 text-slate-600">
                        <div className="flex items-start space-x-4">
                            <div className="bg-teal-100 rounded-full p-3">
                                <Mail className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Email</h3>
                                <a href="mailto:support@clickoptima.com" className="hover:text-teal-600">support@clickoptima.com</a>
                                <p className="text-sm text-slate-500">We'll get back to you within 24 hours.</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="bg-teal-100 rounded-full p-3">
                                <Phone className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Phone</h3>
                                <a href="tel:+1234567890" className="hover:text-teal-600">+1 (234) 567-890</a>
                                <p className="text-sm text-slate-500">Mon-Fri, 9am-5pm EST</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <div className="bg-teal-100 rounded-full p-3">
                                <MapPin className="h-6 w-6 text-teal-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Office Address</h3>
                                <p>123 SEO Street, Suite 456<br />Digital City, DC 78910</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
