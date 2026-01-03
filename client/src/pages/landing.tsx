import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Menu, X, ChevronDown, BookOpen, Zap, Award, Lock, Eye, Shield, TrendingUp, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Landing() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedUseCase, setSelectedUseCase] = useState('cpa');

  const navigateToAuth = () => {
    setLocation('/auth');
  };

  const useCases = {
    cpa: {
      title: "Client Consultations",
      description: "CPAs answering client tax questions instantly",
      query: "Can my LLC deduct home office expenses?",
      response: "Yes, under IRC §280A(c)(1), home office deductions apply if the space is used regularly and exclusively for business. For LLCs taxed as partnerships, each partner deducts on Schedule C.",
      time: "Before: 15 min | After: 2 min",
      authorities: ["IRC §280A(c)(1)", "Treas. Reg. §1.280A-2"],
    },
    advisor: {
      title: "Tax Planning",
      description: "Financial advisors researching strategies",
      query: "Current rules for charitable remainder trusts?",
      response: "IRC §664 allows donors to receive income for life or term of years, with remainder to charity. Key requirements: non-grantor status, fixed or unitrust payment, minimum 10% charitable remainder.",
      time: "Before: 45 min | After: 5 min",
      authorities: ["IRC §664", "Rev. Rul. 2003-72"],
    },
    attorney: {
      title: "Research & Memos",
      description: "Tax attorneys drafting analyses",
      query: "How is cryptocurrency treated under IRC §988?",
      response: "Personal transactions may qualify for IRC §988 treatment, creating ordinary gain/loss. However, only applies to functional currency contracts and consumer transactions.",
      time: "Before: 2 hours | After: 15 min",
      authorities: ["IRC §988", "Notice 2014-21"],
    },
    accountant: {
      title: "Compliance Review",
      description: "Accountants verifying tax treatment",
      query: "Are meal expenses deductible under §274(n)?",
      response: "Business meals are 50% deductible (temporary 100% for 2021-2022). Entertainment is non-deductible. Exceptions apply for employee meals and specific circumstances.",
      time: "Before: 30 min | After: 3 min",
      authorities: ["IRC §274(n)", "Notice 2021-25"],
    },
  };

  const taxQuestions = [
    { role: "Small Business Owner", avatar: "👤", q: "Can I deduct home office expenses for my LLC?" },
    { role: "Financial Advisor", avatar: "💼", q: "Latest on cryptocurrency taxation for 2024?" },
    { role: "Startup CFO", avatar: "📊", q: "R&D tax credit eligibility for software?" },
    { role: "CPA", avatar: "🧮", q: "Meal deduction limits under current rules?" },
  ];

  const confidenceExamples = [
    {
      level: "High",
      score: "85-100",
      color: "bg-green-50",
      description: "Strong authority support, minimal assumptions",
      example: "Standard IRC deduction eligibility",
    },
    {
      level: "Medium",
      score: "60-84",
      color: "bg-yellow-50",
      description: "Moderate authority support, some interpretation",
      example: "Complex depreciation method election",
    },
    {
      level: "Low",
      score: "0-59",
      color: "bg-red-50",
      description: "Limited authority, significant assumptions",
      example: "Emerging tax treatment guidance gaps",
    },
  ];

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
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-off-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-sans text-display md:text-5xl font-bold text-warm-black mb-6 leading-none">
                Authoritative Tax Guidance Backed by Federal Authorities
              </h1>
              <p className="font-sans text-body lg:text-body-lg text-slate-medium mb-8 leading-relaxed">
                Get comprehensive tax analysis grounded in IRC, CFR, and IRS guidance — in seconds, not hours. Every answer is cited and confidence-scored for professional use.
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

      {/* Problem Visualization Section */}
      <section className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-sans text-h2 font-bold text-warm-black mb-4">
              Tax research is complex. Your clients need answers now.
            </h2>
            <p className="font-sans text-body lg:text-body-lg text-slate-medium max-w-2xl mx-auto">
              See how Taxentia helps professionals respond to real tax questions instantly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {taxQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-6 border border-taxentia-light-gray rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">{q.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-taxentia-gold mb-2">{q.role}</p>
                    <p className="text-sm sm:text-base text-taxentia-navy font-medium">{q.q}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-off-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-h2 font-bold text-warm-black mb-4">
              Why Choose Taxentia?
            </h2>
            <p className="font-sans text-body-lg text-slate-medium max-w-2xl mx-auto">
              Professional-grade tax analysis powered by AI and comprehensive legal authority databases
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-taxentia-sky/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-taxentia-sky" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h3 className="font-sans text-h3 font-bold text-warm-black mb-3">
                Accurate & Reliable
              </h3>
              <p className="font-sans text-body text-slate-medium">
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-off-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-sans text-h2 font-bold text-warm-black mb-4">
              How Taxentia Works
            </h2>
            <p className="font-sans text-body-lg text-slate-medium max-w-2xl mx-auto">
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

      {/* Use Cases Section */}
      <section className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-sans text-h2 font-bold text-warm-black mb-4">
              Built for tax professionals. Trusted by advisors.
            </h2>
            <p className="font-sans text-body lg:text-body-lg text-slate-medium max-w-2xl mx-auto">
              Real use cases from CPAs, financial advisors, and tax attorneys
            </p>
          </div>

          <Tabs value={selectedUseCase} onValueChange={setSelectedUseCase} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
              {Object.entries(useCases).map(([key, useCase]) => (
                <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
                  {useCase.title.split(" ")[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(useCases).map(([key, useCase]) => (
              <TabsContent key={key} value={key} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <Card className="bg-taxentia-light-gray border-0">
                    <CardHeader>
                      <CardTitle className="text-taxentia-navy">Tax Question</CardTitle>
                      <CardDescription>{useCase.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="font-body text-sm sm:text-base text-taxentia-navy font-medium mb-4">{useCase.query}</p>
                      <div className="text-xs sm:text-sm text-taxentia-text-slate font-semibold">{useCase.time}</div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-taxentia-gold">
                    <CardHeader>
                      <CardTitle className="text-taxentia-navy">Taxentia Analysis</CardTitle>
                      <CardDescription>Authority-backed response with citations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="font-body text-xs sm:text-sm text-taxentia-navy leading-relaxed mb-4">{useCase.response}</p>
                      <div>
                        <p className="text-xs font-semibold text-taxentia-gold mb-2">AUTHORITIES:</p>
                        <div className="flex flex-wrap gap-2">
                          {useCase.authorities.map((auth, idx) => (
                            <span key={idx} className="inline-block bg-taxentia-gold bg-opacity-20 text-taxentia-navy px-2 py-1 rounded text-xs font-medium">
                              {auth}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Confidence Scoring Section */}
      <section className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-off-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-sans text-h2 font-bold text-warm-black mb-4">
              Transparent confidence. Clear limitations.
            </h2>
            <p className="font-sans text-body lg:text-body-lg text-slate-medium max-w-2xl mx-auto">
              Know exactly how confident the analysis is and when professional review is essential
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {confidenceExamples.map((example, idx) => (
              <div
                key={idx}
                className={`p-6 sm:p-8 rounded-lg border-2 border-taxentia-navy ${example.color} hover:shadow-lg transition-shadow`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-taxentia-navy" />
                  <div>
                    <p className="font-semibold text-taxentia-navy">{example.level}</p>
                    <p className="text-xs sm:text-sm text-taxentia-text-slate">{example.score}</p>
                  </div>
                </div>
                <p className="font-body text-sm text-taxentia-navy font-medium mb-2">{example.description}</p>
                <p className="text-xs sm:text-sm text-taxentia-text-slate italic">Example: {example.example}</p>
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
                q: "How accurate are the responses?",
                a: "Taxentia uses authority-backed analysis with confidence scoring. Every response is grounded in federal tax sources with specific IRC/CFR citations. However, tax analysis can be complex, so we recommend professional review for all client advice."
              },
              {
                q: "Can this replace my tax attorney or CPA?",
                a: "No. Taxentia is a research and analysis tool designed to complement professional expertise, not replace it. It helps professionals research faster and more comprehensively by providing authority-backed analysis."
              },
              {
                q: "What tax authorities does Taxentia cover?",
                a: "Complete Internal Revenue Code (Title 26 USC), all Treasury Regulations (Title 26 CFR), IRS Revenue Rulings, Revenue Procedures, Notices, and Bulletins. We maintain weekly updates for new IRS guidance."
              },
              {
                q: "How often is the data updated?",
                a: "We ingest weekly IRS bulletins automatically and perform comprehensive quarterly updates of all authorities. Emergency updates are issued for critical tax law changes."
              },
              {
                q: "Is my query data private?",
                a: "Yes. All queries are encrypted end-to-end and never sold or shared. We comply with professional tax data privacy standards and GDPR requirements."
              },
              {
                q: "What if Taxentia's analysis is incorrect?",
                a: "Confidence scoring helps identify when professional review is essential. Always cite the underlying authorities (IRC sections, CFR regulations) in your work, not Taxentia. We recommend verification through primary sources for high-stakes analyses."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white p-4 sm:p-6 rounded-xl border border-taxentia-slate">
                <h3 className="font-heading font-bold text-sm sm:text-base text-taxentia-navy flex justify-between items-start">
                  {faq.q}
                  <ChevronDown className="w-5 h-5 text-taxentia-sky flex-shrink-0 ml-4" />
                </h3>
                <p className="font-body text-xs sm:text-sm text-taxentia-text-slate mt-3">
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
