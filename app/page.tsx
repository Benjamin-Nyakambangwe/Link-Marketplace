import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Shield,
  MessageSquare,
  Star,
  Users,
  TrendingUp,
  LinkIcon,
  FileText,
  Zap,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">LinkMarket</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-slate-600 hover:text-teal-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-slate-600 hover:text-teal-600 transition-colors">
              How It Works
            </Link>
            <Link href="#testimonials" className="text-slate-600 hover:text-teal-600 transition-colors">
              Testimonials
            </Link>
            <Link href="#pricing" className="text-slate-600 hover:text-teal-600 transition-colors">
              Pricing
            </Link>
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

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">
                  🚀 Connect, Collaborate, Conquer SEO
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  The Premier <span className="text-teal-600">Link Building</span> Marketplace
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Connect publishers and advertisers in a secure, transparent marketplace for high-quality link
                  placements and guest posting opportunities.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/advertiser/listings">
                  <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto">
                    Find Websites <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/publisher/websites">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-teal-600 text-teal-600 hover:bg-teal-50 w-full sm:w-auto bg-transparent"
                  >
                    List Your Site
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-8 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-teal-600" />
                  <span>Verified Publishers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                  <span>Direct Communication</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-100 to-slate-100 rounded-2xl p-8 shadow-2xl">
                <Image
                  src="/placeholder.svg?height=400&width=500"
                  alt="Platform Dashboard Preview"
                  width={500}
                  height={400}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 border">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Live Orders: 247</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Publishers */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-700">For Publishers</Badge>
                <h2 className="text-3xl font-bold text-slate-900">Monetize Your Website Traffic</h2>
                <p className="text-lg text-slate-600">
                  Turn your website into a revenue stream with our easy-to-use platform designed for publishers.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Easy Monetization</h3>
                    <p className="text-slate-600">
                      List your websites and start earning from link placements and guest posts.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Quality Control</h3>
                    <p className="text-slate-600">
                      Maintain editorial control with our content review and approval system.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Fast Payments</h3>
                    <p className="text-slate-600">
                      Get paid quickly and securely through our automated payment system.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advertisers */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-purple-100 text-purple-700">For Advertisers</Badge>
                <h2 className="text-3xl font-bold text-slate-900">Discover Quality Link Opportunities</h2>
                <p className="text-lg text-slate-600">
                  Find high-authority websites for your link building and content marketing campaigns.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Verified Websites</h3>
                    <p className="text-slate-600">
                      Access pre-vetted, high-quality websites with verified metrics and authority.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Direct Communication</h3>
                    <p className="text-slate-600">
                      Communicate directly with publishers to ensure perfect content alignment.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Transparent Pricing</h3>
                    <p className="text-slate-600">Clear, upfront pricing with no hidden fees or surprise charges.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-teal-100 text-teal-700">Platform Features</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
              Everything You Need for Link Building Success
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools and features you need for successful link building
              campaigns.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Verified Websites</CardTitle>
                <CardDescription>
                  All publisher websites are manually reviewed and verified for quality and authenticity.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Secure Payments</CardTitle>
                <CardDescription>
                  Escrow-based payment system ensures secure transactions for both publishers and advertisers.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Direct Communication</CardTitle>
                <CardDescription>
                  Built-in messaging system for seamless communication between publishers and advertisers.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Analytics & Reporting</CardTitle>
                <CardDescription>
                  Comprehensive analytics to track your campaigns and measure link building success.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>
                  Advanced content management tools for guest posts and sponsored content creation.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Fast Turnaround</CardTitle>
                <CardDescription>
                  Quick approval and publishing process with optional fast-track services available.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge className="bg-teal-100 text-teal-700">Testimonials</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Trusted by Industry Leaders</h2>
            <p className="text-xl text-slate-600">
              See what our users have to say about their experience with LinkMarket.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  "LinkMarket has revolutionized our link building strategy. The quality of publishers and the ease of
                  use is unmatched."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    SM
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Sarah Mitchell</p>
                    <p className="text-sm text-slate-500">SEO Director, TechCorp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  "As a publisher, I've been able to monetize my websites effectively while maintaining editorial
                  control. Highly recommended!"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                    MJ
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Michael Johnson</p>
                    <p className="text-sm text-slate-500">Publisher, HealthBlog Network</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4">
                  "The transparency and security of the platform gives us confidence in every transaction. Customer
                  support is excellent too."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                    EC
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Emily Chen</p>
                    <p className="text-sm text-slate-500">Marketing Manager, StartupXYZ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-12 text-center text-white">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold">Ready to Transform Your Link Building Strategy?</h2>
              <p className="text-xl text-teal-100">
                Join thousands of publishers and advertisers who trust LinkMarket for their link building needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-white text-teal-600 hover:bg-slate-100 w-full sm:w-auto">
                    Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/advertiser/listings">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white/10 w-full sm:w-auto bg-transparent"
                  >
                    Browse Listings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">LinkMarket</span>
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
            <p>&copy; {new Date().getFullYear()} LinkMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
