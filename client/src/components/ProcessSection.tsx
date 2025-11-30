import React from 'react';
import { Search, Lightbulb, Rocket, LineChart, Star } from 'lucide-react';

const ProcessSection = () => {
  const steps = [
    {
      number: '01',
      icon: <Search className="h-8 w-8" />,
      title: 'Discovery',
      description: 'We dive deep into understanding your business goals, target audience, and competitive landscape.',
      bgColor: 'bg-secondary',
      items: ['Business Analysis', 'Market Research', 'Goal Setting']
    },
    {
      number: '02',
      icon: <Lightbulb className="h-8 w-8" />,
      title: 'Strategy',
      description: 'Craft a tailored roadmap that aligns with your vision and maximizes your digital impact.',
      bgColor: 'bg-primary',
      items: ['Strategic Planning', 'User Experience Design', 'Technical Architecture']
    },
    {
      number: '03',
      icon: <Rocket className="h-8 w-8" />,
      title: 'Execution',
      description: 'Bring your vision to life with expert design, development, and marketing implementation.',
      bgColor: 'bg-secondary',
      items: ['Design & Development', 'Content Creation', 'Quality Assurance']
    },
    {
      number: '04',
      icon: <LineChart className="h-8 w-8" />,
      title: 'Optimization',
      description: 'Continuously refine and improve based on data-driven insights and user feedback.',
      bgColor: 'bg-primary',
      items: ['Performance Monitoring', 'A/B Testing', 'Continuous Improvement']
    },
    {
      number: '05',
      icon: <Star className="h-8 w-8" />,
      title: 'Review Collection',
      description: 'Leverage our platform to gather authentic customer reviews and build lasting credibility.',
      bgColor: 'bg-secondary',
      items: ['Review Campaigns', 'Reputation Management', 'Social Proof Integration']
    },
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gray-50/50"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 block">
              How We Work
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Proven Process
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A systematic approach that ensures your project's success from start to finish and beyond.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative mb-16 last:mb-0">
              {/* Connector line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute left-[74px] top-[140px] w-0.5 h-32 bg-primary/20"></div>
              )}

              <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Left side - Icon and Number */}
                <div className="flex-shrink-0 relative mx-auto lg:mx-0">
                  <div className={`inline-flex p-6 rounded-2xl ${step.bgColor} text-white shadow-lg relative z-10`}>
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -left-2 text-6xl font-bold text-gray-100 z-0">
                    {step.number}
                  </div>
                </div>

                {/* Right side - Content */}
                <div className="flex-1 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center lg:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Key items */}
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    {step.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-gray-50 text-sm font-medium text-gray-700 border border-gray-200"
                      >
                        <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 bg-primary rounded-2xl text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Start Your Journey?
          </h3>
          <p className="text-xl mb-6 text-white/90">
            Let's discuss how we can help transform your business digitally.
          </p>
          <button
            onClick={() => window.location.href = '/contact'}
            className="bg-white text-primary hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 shadow-lg hover:scale-105"
          >
            Schedule a Free Consultation
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
