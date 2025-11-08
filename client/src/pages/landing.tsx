import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateToAuth = () => {
    setLocation('/auth');
  };

  return (
    <div className="min-h-screen bg-taxentia-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-taxentia-slate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-taxentia-navy rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-heading font-bold text-taxentia-navy text-xl">Taxentia</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-taxentia-text-slate hover:text-taxentia-navy font-body">Features</a>
              <a href="#pricing" className="text-taxentia-text-slate hover:text-taxentia-navy font-body">Pricing</a>
              <a href="#testimonials" className="text-taxentia-text-slate hover:text-taxentia-navy font-body">Testimonials</a>
              <a href="#faq" className="text-taxentia-text-slate hover:text-taxentia-navy font-body">FAQ</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={navigateToAuth}
                className="border-taxentia-slate text-taxentia-navy hover:bg-taxentia-light-gray"
              >
                Sign In
              </Button>
              <Button
                onClick={navigateToAuth}
                className="bg-taxentia-navy hover:bg-blue-900 text-white"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-taxentia-navy" />
              ) : (
                <Menu className="w-6 h-6 text-taxentia-navy" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-3">
              <a href="#features" className="block text-taxentia-text-slate hover:text-taxentia-navy font-body py-2">Features</a>
              <a href="#pricing" className="block text-taxentia-text-slate hover:text-taxentia-navy font-body py-2">Pricing</a>
              <a href="#testimonials" className="block text-taxentia-text-slate hover:text-taxentia-navy font-body py-2">Testimonials</a>
              <a href="#faq" className="block text-taxentia-text-slate hover:text-taxentia-navy font-body py-2">FAQ</a>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1">Sign In</Button>
                <Button className="flex-1 bg-taxentia-navy text-white">Get Started</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-taxentia-light-gray to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-heading text-5xl md:text-6xl font-bold text-taxentia-navy mb-6 leading-tight">
                AI-Powered Tax Intelligence
              </h1>
              <p className="font-body text-lg text-taxentia-text-slate mb-8 leading-relaxed">
                Get accurate tax guidance backed by real-time authority sources. Taxentia combines GPT-4o analysis with comprehensive tax law databases for professional-grade insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={navigateToAuth}
                  className="bg-taxentia-navy hover:bg-blue-900 text-white px-8 py-6 text-lg font-heading"
                >
                  Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-taxentia-navy text-taxentia-navy hover:bg-taxentia-light-gray px-8 py-6 text-lg font-heading"
                >
                  Watch Demo
                </Button>
              </div>
              <p className="font-body text-sm text-taxentia-text-slate mt-8">
                ✓ No credit card required · ✓ 4,143+ tax sources · ✓ Weekly updates
              </p>
            </div>
            <div className="bg-taxentia-sky-light rounded-2xl h-96 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto text-taxentia-sky mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-taxentia-text-slate font-body">Interactive Dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-taxentia-navy mb-4">
              Why Choose Taxentia?
            </h2>
            <p className="font-body text-lg text-taxentia-text-slate max-w-2xl mx-auto">
              Professional-grade tax analysis powered by AI and comprehensive legal authority databases
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl border border-taxentia-slate hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-taxentia-sky/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-taxentia-sky" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-taxentia-navy mb-3">
                Accurate & Reliable
              </h3>
              <p className="font-body text-taxentia-text-slate">
                GPT-4o Mini analysis backed by 4,143+ authoritative tax sources including IRC, CFR, IRS publications, and court rulings.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl border border-taxentia-slate hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-taxentia-gold/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-taxentia-gold" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-taxentia-navy mb-3">
                Always Fresh
              </h3>
              <p className="font-body text-taxentia-text-slate">
                Automatic weekly updates of IRS bulletins, regulations, and tax law changes ensure you're always working with current information.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl border border-taxentia-slate hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-taxentia-emerald/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-taxentia-emerald" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-taxentia-navy mb-3">
                Comprehensive Coverage
              </h3>
              <p className="font-body text-taxentia-text-slate">
                Covers IRC, CFR regulations, IRS bulletins, rulings, and revenue procedures with AI-powered analysis and structured citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-taxentia-light-gray">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-taxentia-navy mb-4">
              How Taxentia Works
            </h2>
            <p className="font-body text-lg text-taxentia-text-slate max-w-2xl mx-auto">
              Advanced RAG pipeline delivering accurate tax guidance in seconds
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { number: '1', title: 'Query', desc: 'Submit your tax question' },
              { number: '2', title: 'Search', desc: 'AI searches 4,143+ sources' },
              { number: '3', title: 'Analyze', desc: 'GPT-4o generates insights' },
              { number: '4', title: 'Deliver', desc: 'Get cited, structured answer' },
            ].map((step) => (
              <div key={step.number} className="relative">
                <div className="bg-white p-6 rounded-xl border border-taxentia-slate h-full">
                  <div className="w-12 h-12 bg-taxentia-navy text-white rounded-full flex items-center justify-center font-heading font-bold text-lg mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-heading text-xl font-bold text-taxentia-navy mb-2">
                    {step.title}
                  </h3>
                  <p className="font-body text-taxentia-text-slate">
                    {step.desc}
                  </p>
                </div>
                {step.number !== '4' && (
                  <div className="hidden md:block absolute top-12 -right-6 text-taxentia-sky text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-taxentia-navy mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="font-body text-lg text-taxentia-text-slate max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include access to our full tax authority database.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-xl border border-taxentia-slate">
              <h3 className="font-heading text-2xl font-bold text-taxentia-navy mb-2">Free</h3>
              <p className="text-4xl font-bold text-taxentia-navy mb-1">$0</p>
              <p className="font-body text-taxentia-text-slate mb-6">Perfect to get started</p>
              <Button variant="outline" className="w-full border-taxentia-slate mb-8">
                Get Started
              </Button>
              <ul className="space-y-3 font-body text-taxentia-text-slate">
                <li>✓ 5 queries/month</li>
                <li>✓ Basic tax sources</li>
                <li>✓ Community support</li>
              </ul>
            </div>

            {/* Pro Plan (Most Popular) */}
            <div className="bg-taxentia-navy text-white p-8 rounded-xl shadow-lg relative transform scale-105">
              <div className="absolute -top-4 right-4 bg-taxentia-gold text-taxentia-navy px-4 py-1 rounded-full font-heading font-bold text-sm">
                Most Popular
              </div>
              <h3 className="font-heading text-2xl font-bold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-1">$29</p>
              <p className="font-body text-taxentia-sky-light mb-6">per month</p>
              <Button className="w-full bg-taxentia-gold text-taxentia-navy hover:bg-yellow-500 font-heading mb-8">
                Start Free Trial
              </Button>
              <ul className="space-y-3 font-body">
                <li>✓ Unlimited queries</li>
                <li>✓ All tax authorities</li>
                <li>✓ Priority support</li>
                <li>✓ Citation export</li>
                <li>✓ Query history</li>
              </ul>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-xl border border-taxentia-slate">
              <h3 className="font-heading text-2xl font-bold text-taxentia-navy mb-2">Enterprise</h3>
              <p className="text-4xl font-bold text-taxentia-navy mb-1">Custom</p>
              <p className="font-body text-taxentia-text-slate mb-6">For large teams</p>
              <Button variant="outline" className="w-full border-taxentia-slate mb-8">
                Contact Sales
              </Button>
              <ul className="space-y-3 font-body text-taxentia-text-slate">
                <li>✓ Dedicated support</li>
                <li>✓ Custom integrations</li>
                <li>✓ Team management</li>
                <li>✓ Advanced analytics</li>
                <li>✓ SSO & compliance</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-taxentia-light-gray">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-taxentia-navy mb-4">
              Loved by Tax Professionals
            </h2>
            <p className="font-body text-lg text-taxentia-text-slate max-w-2xl mx-auto">
              See what tax professionals and accountants are saying about Taxentia
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Taxentia has become my go-to research tool. The AI analysis saves me hours every week.",
                author: "Sarah Chen",
                role: "CPA, Tax Manager",
                company: "Chen & Associates"
              },
              {
                quote: "Accurate citations and comprehensive authority coverage. Exactly what we needed for our practice.",
                author: "Michael Rodriguez",
                role: "Tax Attorney",
                company: "Rodriguez Legal Group"
              },
              {
                quote: "The weekly updates keep me current on tax law changes. Invaluable for client advisory.",
                author: "Jessica Williams",
                role: "Tax Consultant",
                company: "Williams Financial Advisors"
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white p-8 rounded-xl border border-taxentia-slate">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-taxentia-gold">★</span>
                  ))}
                </div>
                <p className="font-body text-taxentia-text-slate mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-heading font-bold text-taxentia-navy">
                    {testimonial.author}
                  </p>
                  <p className="font-body text-sm text-taxentia-text-slate">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl font-bold text-taxentia-navy mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is Taxentia suitable for small tax practices?",
                a: "Yes! Taxentia is designed for practitioners of all sizes, from solo practitioners to large firms. We offer flexible pricing tiers to match your needs."
              },
              {
                q: "How often are the tax authority sources updated?",
                a: "We update all authority sources weekly, including new IRS bulletins, regulatory changes, and court rulings. Your insights are always current."
              },
              {
                q: "Can I export and cite the analysis?",
                a: "Absolutely. Pro and Enterprise plans include full citation export for use in client memos and documents."
              },
              {
                q: "What tax authorities are covered?",
                a: "We cover IRC (Internal Revenue Code), CFR (Code of Federal Regulations), IRS Publications, Revenue Rulings, Revenue Procedures, and select court cases."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-taxentia-slate">
                <h3 className="font-heading font-bold text-taxentia-navy flex justify-between items-start">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-taxentia-sky flex-shrink-0" />
                </h3>
                <p className="font-body text-taxentia-text-slate mt-3">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-taxentia-navy text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-4xl font-bold mb-6">
            Ready to Transform Your Tax Research?
          </h2>
          <p className="font-body text-lg text-taxentia-sky-light mb-8 max-w-2xl mx-auto">
            Join hundreds of tax professionals using Taxentia for faster, more accurate tax guidance.
          </p>
          <Button
            onClick={navigateToAuth}
            className="bg-taxentia-gold hover:bg-yellow-500 text-taxentia-navy px-8 py-6 text-lg font-heading"
          >
            Start Your Free Trial <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="font-body text-sm text-taxentia-sky-light mt-6">
            No credit card required. Full access to all features.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-taxentia-navy text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-taxentia-sky-light/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-taxentia-sky rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-heading font-bold">Taxentia</span>
              </div>
              <p className="font-body text-taxentia-sky-light">
                AI-powered tax guidance for professionals
              </p>
            </div>
            <div>
              <h4 className="font-heading font-bold mb-4">Product</h4>
              <ul className="space-y-2 font-body text-taxentia-sky-light text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold mb-4">Company</h4>
              <ul className="space-y-2 font-body text-taxentia-sky-light text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold mb-4">Legal</h4>
              <ul className="space-y-2 font-body text-taxentia-sky-light text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-taxentia-sky-light/20 pt-8">
            <p className="font-body text-taxentia-sky-light text-sm text-center">
              © 2025 Taxentia. All rights reserved. | AI-powered tax guidance backed by authoritative sources
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
