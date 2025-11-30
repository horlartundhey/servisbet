#!/usr/bin/env node

const axios = require('axios');

const testSEOEndpoints = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('🔍 Testing SEO-friendly endpoints...\n');

  // Test 1: Business by Slug
  try {
    console.log('1. Testing Business Slug URL:');
    const slugResponse = await axios.get(`${baseURL}/api/business/slug/horlartundhey-web-store`);
    console.log('✅ Slug endpoint working:', slugResponse.data.success);
    console.log('📄 Business name:', slugResponse.data.data.businessName);
    console.log('🔗 Business slug:', slugResponse.data.data.businessSlug);
  } catch (error) {
    console.log('❌ Slug endpoint failed:', error.message);
  }

  // Test 2: Robots.txt
  try {
    console.log('\n2. Testing robots.txt:');
    const robotsResponse = await axios.get(`${baseURL}/robots.txt`);
    console.log('✅ Robots.txt working');
    console.log('📄 Content:', robotsResponse.data.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Robots.txt failed:', error.message);
  }

  // Test 3: XML Sitemap
  try {
    console.log('\n3. Testing XML sitemap:');
    const sitemapResponse = await axios.get(`${baseURL}/sitemap.xml`);
    console.log('✅ XML Sitemap working');
    console.log('📄 Content type:', sitemapResponse.headers['content-type']);
    console.log('📊 Contains businesses:', sitemapResponse.data.includes('<urlset'));
  } catch (error) {
    console.log('❌ XML Sitemap failed:', error.message);
  }

  // Test 4: Business List (includes slugs)
  try {
    console.log('\n4. Testing business list with slugs:');
    const businessesResponse = await axios.get(`${baseURL}/api/business?limit=3`);
    console.log('✅ Business list working');
    const businesses = businessesResponse.data.data;
    businesses.forEach(business => {
      console.log(`📄 ${business.businessName} → /business/${business.slug || business._id}`);
    });
  } catch (error) {
    console.log('❌ Business list failed:', error.message);
  }

  console.log('\n🎉 SEO Testing Complete!');
};

testSEOEndpoints().catch(console.error);