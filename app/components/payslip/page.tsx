import React, { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle } from 'lucide-react'

const Page = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const features = [
    { icon: FileText, text: "Digital Payslips" },
    { icon: Clock, text: "Instant Access" },
    { icon: CheckCircle, text: "Secure & Private" }
  ]

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-4xl w-full">
        {/* Main Content */}
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Icon Animation */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <FileText className="w-20 h-20 text-white animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-6 animate-pulse" style={{ animationDuration: '3s' }}>
            Coming Soon
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Your digital payslip portal is under construction. Get ready for a seamless experience.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const isActive = activeFeature === index
              return (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border-2 transition-all duration-500 ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-10 h-10 mx-auto mb-3 transition-colors duration-500 ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className={`font-semibold transition-colors duration-500 ${
                    isActive ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {feature.text}
                  </p>
                </div>
              )
            })}
          </div>

        </div>

        {/* Floating Elements */}
        <div className="fixed top-20 left-10 w-20 h-20 bg-blue-200 rounded-full blur-xl opacity-50 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="fixed bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full blur-xl opacity-50 animate-pulse" style={{ animationDuration: '5s' }}></div>
      </div>
    </div>
  )
}

export default Page