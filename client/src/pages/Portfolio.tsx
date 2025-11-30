import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Star, TrendingUp } from 'lucide-react';

const Portfolio = () => {
  const navigate = useNavigate();

  const projects = [
    {
      title: 'E-Commerce Platform Redesign',
      client: 'Fashion Retailer',
      category: 'Web Design & Development',
      description: 'Complete redesign and development of a multi-vendor e-commerce platform with advanced filtering and checkout optimization.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop',
      results: ['250% increase in conversions', '40% faster load time', '85% mobile traffic'],
      tech: ['React', 'Node.js', 'Stripe', 'MongoDB']
    },
    {
      title: 'Restaurant Brand Identity',
      client: 'Bella Trattoria',
      category: 'Branding & Digital Marketing',
      description: 'Complete brand refresh including logo design, website development, and social media strategy for an upscale Italian restaurant.',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=500&fit=crop',
      results: ['300% social media growth', '150+ 5-star reviews', '60% reservation increase'],
      tech: ['Brand Strategy', 'Web Design', 'SEO', 'Review Management']
    },
    {
      title: 'SaaS Product Launch',
      client: 'TechStart Inc.',
      category: 'Web Development & Marketing',
      description: 'Full-stack development and go-to-market strategy for a B2B SaaS productivity tool targeting remote teams.',
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=500&fit=crop',
      results: ['500+ signups in 30 days', '4.8★ product rating', '35% MRR growth'],
      tech: ['Next.js', 'PostgreSQL', 'AWS', 'Stripe Billing']
    },
    {
      title: 'Healthcare Portal',
      client: 'MediCare Clinic',
      category: 'Web Development',
      description: 'HIPAA-compliant patient portal with appointment scheduling, telemedicine, and secure messaging features.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop',
      results: ['80% reduction in phone calls', '95% patient satisfaction', 'HIPAA certified'],
      tech: ['React', 'HIPAA Compliance', 'WebRTC', 'Express.js']
    },
    {
      title: 'Real Estate Platform',
      client: 'Urban Properties',
      category: 'Web Design & Development',
      description: 'Modern property listing platform with virtual tours, advanced search, and integrated CRM for real estate agents.',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=500&fit=crop',
      results: ['1000+ listings managed', '45% lead increase', '4.9★ agent rating'],
      tech: ['Vue.js', 'Laravel', 'Matterport API', 'MySQL']
    },
    {
      title: 'Fitness App Integration',
      client: 'FitLife Studios',
      category: 'Mobile & Web Development',
      description: 'Cross-platform fitness tracking app with class scheduling, workout plans, and nutrition guidance.',
      image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=500&fit=crop',
      results: ['5000+ active users', '4.7★ app store rating', '70% retention rate'],
      tech: ['React Native', 'Firebase', 'Stripe', 'Push Notifications']
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Our Portfolio
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Explore successful projects we've delivered for businesses across various industries
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">200+</div>
              <div className="text-gray-600">Projects Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">150+</div>
              <div className="text-gray-600">Happy Clients</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600">Client Retention</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">4.9★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow group"
                >
                  {/* Project Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={project.image} 
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        {project.category}
                      </span>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">{project.client}</span>
                      <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {project.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Results */}
                    <div className="mb-4">
                      <div className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                        <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                        Key Results:
                      </div>
                      <ul className="space-y-1">
                        {project.results.map((result, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {result}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                      {project.tech.map((tech, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Case Study CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Star className="h-12 w-12 text-blue-600 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Want Detailed Case Studies?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get in-depth insights into our process, challenges solved, and measurable results for each project.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
            >
              Request Case Studies
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Build Your Success Story?
            </h2>
            <p className="text-xl mb-10 opacity-90">
              Let's create something remarkable together. Schedule a free consultation today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/contact')}
                className="bg-white text-blue-600 hover:bg-blue-50 px-10 py-5 rounded-lg font-bold text-lg transition-colors shadow-xl"
              >
                Get Started
              </button>
              <button 
                onClick={() => navigate('/')}
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-5 rounded-lg font-bold text-lg transition-colors"
              >
                Learn More About Us
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Portfolio;
