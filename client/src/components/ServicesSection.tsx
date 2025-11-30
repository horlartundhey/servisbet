import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Code, Megaphone, Star, Globe, TrendingUp } from 'lucide-react';

const ServicesSection = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Web Design',
      description: 'Beautiful, user-centric designs that captivate your audience and drive conversions.',
      bgColor: 'bg-secondary',
      features: ['Responsive Design', 'UI/UX Strategy', 'Brand Integration']
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: 'Web Development',
      description: 'Robust, scalable web applications built with cutting-edge technologies.',
      bgColor: 'bg-primary',
      features: ['Custom Development', 'API Integration', 'Performance Optimization']
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: 'Branding & Identity',
      description: 'Create a memorable brand that resonates with your target audience.',
      bgColor: 'bg-primary',
      features: ['Logo Design', 'Brand Guidelines', 'Visual Identity']
    },
    {
      icon: <Megaphone className="h-8 w-8" />,
      title: 'Digital Marketing',
      description: 'Data-driven marketing strategies that grow your online presence.',
      bgColor: 'bg-secondary',
      features: ['SEO Strategy', 'Social Media', 'Content Marketing']
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: 'Reviews Management',
      description: 'Build trust and credibility with our verified review management platform.',
      bgColor: 'bg-primary',
      features: ['Verified Reviews', 'Reputation Management', 'Customer Insights']
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Growth Consulting',
      description: 'Strategic guidance to scale your business and maximize digital ROI.',
      bgColor: 'bg-secondary',
      features: ['Business Strategy', 'Analytics', 'Growth Planning']
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 block">
              What We Do
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive digital solutions tailored to your business needs. From concept to execution, we've got you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/30 cursor-pointer text-center md:text-left"
              onClick={() => navigate('/contact')}
            >
              {/* Icon */}
              <div className={`inline-flex p-4 rounded-xl ${service.bgColor} text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {service.icon}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 flex flex-col items-center md:items-start">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-700">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Hover effect arrow */}
              <div className="mt-6 flex items-center justify-center md:justify-start text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm">Learn More</span>
                <svg className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">Need a custom solution?</p>
          <button
            onClick={() => navigate('/contact')}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-primary/50 hover:scale-105"
          >
            Let's Talk About Your Project
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
