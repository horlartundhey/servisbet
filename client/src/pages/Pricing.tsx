import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Star, TrendingUp, Shield } from "lucide-react";

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Basic",
      description: "Perfect for small businesses getting started",
      monthlyPrice: 49,
      annualPrice: 490,
      features: [
        "Business profile listing",
        "Up to 50 review responses per month",
        "Basic analytics dashboard",
        "Standard customer support",
        "Mobile-friendly business page",
        "Google My Business sync"
      ],
      limitations: [
        "Limited customization options",
        "Standard listing priority"
      ],
      icon: <Star className="h-6 w-6" />
    },
    {
      name: "Professional",
      description: "For growing businesses that need more visibility",
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        "Everything in Basic",
        "Unlimited review responses",
        "Advanced analytics & insights",
        "Priority listing placement",
        "Custom business page design",
        "Review invitation campaigns",
        "Competitor analysis",
        "Priority customer support",
        "Social media integration"
      ],
      popular: true,
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      name: "Enterprise",
      description: "For large businesses with multiple locations",
      monthlyPrice: 199,
      annualPrice: 1990,
      features: [
        "Everything in Professional",
        "Multi-location management",
        "White-label review platform",
        "API access for integrations",
        "Dedicated account manager",
        "Custom reporting & exports",
        "Advanced review filtering",
        "Bulk operations",
        "SSO integration",
        "24/7 premium support"
      ],
      icon: <Shield className="h-6 w-6" />
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    return `$${price}`;
  };

  const getSavings = (plan: typeof plans[0]) => {
    const monthlyCost = plan.monthlyPrice * 12;
    const savings = monthlyCost - plan.annualPrice;
    return Math.round((savings / monthlyCost) * 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Business Subscription Plans</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose the perfect plan to grow your business reputation and manage customer reviews effectively
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="ml-2">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4 text-primary">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <div className="text-4xl font-bold">
                    {getPrice(plan)}
                    <span className="text-lg font-normal text-muted-foreground">
                      /{isAnnual ? 'year' : 'month'}
                    </span>
                  </div>
                  {isAnnual && (
                    <div className="text-sm text-green-600 font-medium">
                      Save {getSavings(plan)}% annually
                    </div>
                  )}
                </div>

                <Button 
                  className={`w-full ${plan.popular ? '' : 'variant-outline'}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Start Free Trial
                </Button>
                <p className="text-xs text-muted-foreground mt-2">14-day free trial</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((limitation, limitIndex) => (
                    <li key={limitIndex} className="flex items-start gap-3 opacity-60">
                      <Check className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about our pricing</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="font-semibold mb-2">Can I switch plans anytime?</h3>
              <p className="text-muted-foreground">Yes, you can upgrade or downgrade your subscription at any time. Changes take effect on your next billing cycle.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">All plans come with a 14-day free trial. No credit card required to start your trial.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">What happens after the trial?</h3>
              <p className="text-muted-foreground">After your 14-day trial, you'll be automatically subscribed to your chosen plan. You can cancel anytime without penalty.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Do you offer custom enterprise solutions?</h3>
              <p className="text-muted-foreground">Yes, we offer custom enterprise solutions for businesses with unique needs. Contact our sales team for a personalized quote.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">We accept all major credit cards and PayPal. Annual subscriptions can also be paid via bank transfer.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to grow your business?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that use ServisbetA to build trust, manage reviews, and attract more customers
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Start Free Trial</Button>
            <Button variant="outline" size="lg">Contact Sales</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;