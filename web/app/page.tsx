"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileCheck, ShieldCheck, TrendingUp, AlertTriangle, BarChart3, Globe, Database, Clock } from "lucide-react"
import Link from "next/link"

export default function Home() {
  // Stats with animations
  const [animatedStats, setAnimatedStats] = useState([
    { label: "Global Corruption Loss", value: 0, target: 2000, unit: "$B" },
    { label: "Procurement Fraud", value: 0, target: 10, unit: "%" },
    { label: "Annual Funds Lost", value: 0, target: 1500, unit: "$B" },
    { label: "Blockchain Savings Potential", value: 0, target: 500, unit: "$B" },
    { label: "Fraud Cases Reported", value: 0, target: 25000, unit: "" },
  ])
  
  // Updated content for India's corruption issues section
  const corruptionInformation = [
    {
      title: "Government Procurement Issues",
      description: "In India, nearly 20% of government procurement funds are lost to corruption and inefficiency annually.",
      impact: "Blockchain can save up to ₹2,40,000 Crore yearly through transparent tracking"
    },
    {
      title: "Public Distribution System",
      description: "Over 40% of subsidized food grains don't reach intended beneficiaries due to corruption in the supply chain.",
      impact: "Smart contracts can ensure direct beneficiary verification and reduce losses by 85%"
    },
    {
      title: "Infrastructure Development",
      description: "India loses approximately ₹4.5 lakh crore to corruption in infrastructure projects each year.",
      impact: "Blockchain verification can save nearly ₹3 lakh crore through improved material tracking"
    }
  ]
  
  const [activeInfoIndex, setActiveInfoIndex] = useState(0)
  
  // Animate stats on page load
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStats(prev => {
        const allComplete = prev.every(stat => stat.value === stat.target)
        if (allComplete) {
          clearInterval(interval)
          return prev
        }
        
        return prev.map(stat => {
          const step = stat.target > 100 ? Math.ceil(stat.target / 50) : stat.target / 50
          const newValue = Math.min(stat.value + step, stat.target)
          return { ...stat, value: newValue }
        })
      })
    }, 50)
    
    return () => clearInterval(interval)
  }, [])
  
  // Rotate through corruption information
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveInfoIndex(prev => (prev + 1) % corruptionInformation.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Hero Section with animated gradient background */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-blue-500/10 to-purple-500/5 animate-gradient-slow pointer-events-none"></div>
        
        <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-gray-900/90 backdrop-blur shadow-sm">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <span className="text-2xl font-extrabold">TransparencyX</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="#features" className="hover:text-emerald-600 transition-colors">Features</Link>
              <Link href="#stats" className="hover:text-emerald-600 transition-colors">Statistics</Link>
              <Link href="#corruption" className="hover:text-emerald-600 transition-colors">Corruption in India</Link>
              <Link href="#about" className="hover:text-emerald-600 transition-colors">About</Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </header>
        
        <section className="container px-4 py-24 md:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <Badge className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 mb-4">
                  Blockchain-Powered Transparency
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tighter">
                  <span className="text-emerald-600">Transparent</span> Government Funding
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-[600px]">
                  Eliminating corruption through blockchain transparency, smart contracts, and decentralized governance.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Get Started
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  Learn More
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm">28 States Integrated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm">₹12,450 Cr Funds Tracked</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm">143 Fraud Cases Detected</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full filter blur-3xl"></div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-400/20 rounded-full filter blur-3xl"></div>
              
              <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  <div>
                    <h3 className="font-bold">TransparencyX Dashboard</h3>
                    <p className="text-xs text-gray-500">Real-time blockchain monitoring</p>
                  </div>
                </div>
                
                {/* Mock Dashboard Preview */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Active Projects</p>
                      <p className="text-xl font-bold">2,541</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fund Usage</p>
                      <p className="text-xl font-bold">87.5%</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Budget Allocation</p>
                      <p className="text-xs font-medium">62%</p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{width: "62%"}}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Stats Section */}
      <section id="stats" className="w-full py-16 bg-white dark:bg-gray-800">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Global Corruption Impact</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">The cost of corruption worldwide and our blockchain solution's impact</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {animatedStats.map((stat, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</h3>
                    {index < 2 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {index >= 2 && index < 4 && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                    {index === 4 && <BarChart3 className="h-4 w-4 text-blue-500" />}
                  </div>
                  <p className="text-3xl font-bold">
                    {Math.round(stat.value).toLocaleString()}{stat.unit}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="w-full py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container px-4">
          <div className="text-center mb-12">
            <Badge className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 mb-4">
              Core Features
            </Badge>
            <h2 className="text-3xl font-bold">How TransparencyX Works</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
              Our blockchain platform ensures complete transparency in government fund allocation and usage
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck className="h-6 w-6 text-white" />, 
                title: "Transparent Governance",
                description: "All budget allocations and payments are recorded on the blockchain, creating an immutable record that anyone can verify.",
                iconBg: "bg-emerald-600"
              },
              {
                icon: <Users className="h-6 w-6 text-white" />, 
                title: "Role-Based Access",
                description: "Tailored access for government officials, state heads, deputies, vendors, and suppliers with appropriate permissions.",
                iconBg: "bg-blue-600"
              },
              {
                icon: <FileCheck className="h-6 w-6 text-white" />, 
                title: "AI-Powered Verification",
                description: "Advanced AI algorithms ensure fraud prevention and proper fund usage by detecting anomalies in real-time.",
                iconBg: "bg-violet-600"
              },
              {
                icon: <Clock className="h-6 w-6 text-white" />, 
                title: "Real-Time Auditing",
                description: "Live tracking and immediate accountability for all financial transactions across government departments.",
                iconBg: "bg-amber-600"
              },
              {
                icon: <Database className="h-6 w-6 text-white" />, 
                title: "Smart Contract Automation",
                description: "Automated fund releases based on predefined conditions, eliminating manual approvals and reducing corruption.",
                iconBg: "bg-red-600"
              },
              {
                icon: <Globe className="h-6 w-6 text-white" />, 
                title: "Decentralized Disputes",
                description: "On-chain voting mechanism for fair and transparent resolution of challenges and disputes.",
                iconBg: "bg-cyan-600"
              }
            ].map((feature, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`rounded-xl ${feature.iconBg} p-3 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-gradient-to-br from-emerald-200/40 to-blue-200/40 dark:from-emerald-900/40 dark:to-blue-900/40 rounded-full filter blur-xl opacity-70 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Corruption in India Section (previously Case Studies) */}
      <section id="corruption" className="w-full py-16 bg-white dark:bg-gray-800">
        <div className="container px-4">
          <div className="text-center mb-12">
            <Badge className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 mb-4">
              India's Corruption Challenge
            </Badge>
            <h2 className="text-3xl font-bold">Saving India From Corruption</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
              How our blockchain solution aims to transform India's governance and eliminate corruption
            </p>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/10 rounded-xl p-8 shadow-lg border border-amber-100 dark:border-amber-800/20">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400 mr-2">
                      Critical Issue
                    </Badge>
                    <Badge variant="destructive">
                      High Impact
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{corruptionInformation[activeInfoIndex].title}</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-1 h-5 w-5 text-amber-500" />
                      <p className="text-gray-700 dark:text-gray-300">{corruptionInformation[activeInfoIndex].description}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-1 h-5 w-5 text-emerald-500" />
                      <p className="text-emerald-700 dark:text-emerald-400 font-medium">{corruptionInformation[activeInfoIndex].impact}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                      Learn More
                    </Button>
                    <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                      How We Solve This
                    </Button>
                  </div>
                </div>
                
                {/* Image placeholder */}
                <div className="flex-1 rounded-lg bg-white dark:bg-gray-700 shadow-inner overflow-hidden">
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="mt-4 text-gray-500 dark:text-gray-400">Infographic visualization</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation dots */}
              <div className="flex justify-center gap-2 mt-6">
                {corruptionInformation.map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveInfoIndex(i)}
                    className={`w-3 h-3 rounded-full transition-colors ${i === activeInfoIndex ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-800'}`}
                    aria-label={`View issue ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section id="about" className="w-full py-16 bg-gray-100 dark:bg-gray-900">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mb-4">
              Our Mission
            </Badge>
            <h2 className="text-3xl font-bold mb-6">Why TransparencyX Exists</h2>
            <div className="prose dark:prose-invert mx-auto">
              <p>
                Corruption costs $1.5–$2 trillion yearly, with 5–10% of procurement lost to fraud. In 2025, journalist
                Mukesh Chandrakar was killed in India for exposing road construction corruption.
              </p>
              <p>
                TransparencyX was built to prevent such tragedies by bringing blockchain transparency to governance,
                creating an immutable record of all transactions that cannot be altered or hidden.
              </p>
              <p>
                Join us in our mission to create a more transparent and accountable government system that
                works for the people, not against them.
              </p>
            </div>
            <div className="mt-8">
              <Link href="/login">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Join the Movement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-16 bg-gradient-to-br from-emerald-600 to-blue-600 text-white">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl font-bold">Ready to Eliminate Corruption?</h2>
              <p className="text-emerald-100">
                Get started with TransparencyX today and join our mission for transparent governance.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/login">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
                  Login Now
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="border-t bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <span className="text-xl font-bold">TransparencyX</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Blockchain-powered transparency for government funding and procurement.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Dashboard</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Projects</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Analytics</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Reports</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Guides</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Case Studies</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Team</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">Press</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t dark:border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} TransparencyX. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-emerald-600">
                Privacy Policy
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-emerald-600">
                Terms of Service
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}