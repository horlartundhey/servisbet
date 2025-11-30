const express = require('express');
const BusinessProfile = require('../models/BusinessProfile');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

// Generate XML sitemap
router.get('/sitemap.xml', asyncHandler(async (req, res) => {
  try {
    // Get all approved and active businesses
    const businesses = await BusinessProfile.find({ 
      verificationStatus: 'approved',
      isActive: true 
    }).select('businessSlug businessName category updatedAt').sort({ updatedAt: -1 });

    // Define static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/businesses', priority: '0.9', changefreq: 'daily' },
      { url: '/search', priority: '0.8', changefreq: 'weekly' },
      { url: '/pricing', priority: '0.7', changefreq: 'monthly' },
      { url: '/auth', priority: '0.6', changefreq: 'monthly' }
    ];

    // Define category pages
    const categories = ['Restaurant', 'Technology', 'Beauty & Spa', 'Cafe', 'Healthcare', 'Automotive', 'Shopping', 'Entertainment', 'Services', 'Education'];
    const categoryPages = categories.map(category => ({
      url: `/businesses?category=${encodeURIComponent(category)}`,
      priority: '0.8',
      changefreq: 'weekly'
    }));

    const currentDate = new Date().toISOString().split('T')[0];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticPages.map(page => `  <url>
    <loc>https://servisbeta.com${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${categoryPages.map(page => `  <url>
    <loc>https://servisbeta.com${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${businesses.map(business => `  <url>
    <loc>https://servisbeta.com/business/${business.businessSlug || business._id}</loc>
    <lastmod>${business.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    res.set({
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating sitemap'
    });
  }
}));

// Generate robots.txt (as backup)
router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /business-dashboard
Disallow: /api/
Disallow: /auth
Disallow: /profile

Sitemap: https://servisbeta.com/sitemap.xml`;

  res.set('Content-Type', 'text/plain');
  res.send(robots);
});

module.exports = router;