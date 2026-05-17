import axios from 'axios';
import * as cheerio from 'cheerio';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ScrapingResult } from '../types';
import { extractDomain } from '../utils/helpers';

const TECH_PATTERNS: { name: string; patterns: RegExp[] }[] = [
  { name: 'React', patterns: [/react\.js/i, /react\.min\.js/i, /__REACT_DEVTOOLS/i, /data-react/i] },
  { name: 'Vue.js', patterns: [/vue\.js/i, /vue\.min\.js/i, /__VUE_DEVTOOLS/i] },
  { name: 'Angular', patterns: [/angular\.js/i, /angular\.min\.js/i, /ng-app/i, /ng-version/i] },
  { name: 'Next.js', patterns: [/__NEXT_DATA__/i, /_next\/static/i] },
  { name: 'Nuxt.js', patterns: [/__NUXT__/i] },
  { name: 'Gatsby', patterns: [/___gatsby/i, /gatsby-/i] },
  { name: 'WordPress', patterns: [/wp-content/i, /wp-includes/i, /wordpress/i] },
  { name: 'Shopify', patterns: [/shopify/i, /myshopify/i, /cdn\.shopify/i] },
  { name: 'Wix', patterns: [/wix\.com/i, /Wix\.com/i] },
  { name: 'Squarespace', patterns: [/squarespace/i] },
  { name: 'Drupal', patterns: [/drupal/i, /drupal\.js/i] },
  { name: 'Laravel', patterns: [/laravel/i, /csrf-token/i] },
  { name: 'Ruby on Rails', patterns: [/rails/i, /rails-ujs/i] },
  { name: 'Django', patterns: [/django/i, /csrfmiddlewaretoken/i] },
  { name: 'Node.js', patterns: [/express/i, /node_modules/i] },
  { name: 'jQuery', patterns: [/jquery/i, /\$\./i] },
  { name: 'Bootstrap', patterns: [/bootstrap\./i, /bootstrap-/i] },
  { name: 'Tailwind CSS', patterns: [/tailwind/i] },
  { name: 'TypeScript', patterns: [/\.ts\b/i, /\.tsx\b/i] },
  { name: 'Webpack', patterns: [/webpack/i] },
  { name: 'Google Analytics', patterns: [/ga\(/i, /gtag\(/i, /google-analytics/i, /googletag/i] },
  { name: 'Cloudflare', patterns: [/cloudflare/i, /__cfduid/i] },
  { name: 'AWS', patterns: [/aws/i, /amazonaws/i, /s3\.amazonaws/i, /cloudfront/i] },
  { name: 'Vercel', patterns: [/vercel/i, /vercel\.com/i] },
  { name: 'Netlify', patterns: [/netlify/i] },
  { name: 'Stripe', patterns: [/stripe/i, /pk_live_/i, /sk_live_/i] },
  { name: 'Segment', patterns: [/segment/i, /analytics\.js/i] },
  { name: 'Intercom', patterns: [/intercom/i] },
  { name: 'Zendesk', patterns: [/zendesk/i] },
  { name: 'HubSpot', patterns: [/hubspot/i, /hs-analytics/i] },
  { name: 'Salesforce', patterns: [/salesforce/i] },
];

const SOCIAL_PATTERNS = [
  { name: 'linkedin', pattern: /linkedin\.com\/(company|in)\/[a-zA-Z0-9_-]+/i },
  { name: 'twitter', pattern: /twitter\.com\/[a-zA-Z0-9_]+/i },
  { name: 'github', pattern: /github\.com\/[a-zA-Z0-9_-]+/i },
  { name: 'facebook', pattern: /facebook\.com\/[a-zA-Z0-9.-]+/i },
  { name: 'instagram', pattern: /instagram\.com\/[a-zA-Z0-9_.]+/i },
  { name: 'youtube', pattern: /youtube\.com\/@?[a-zA-Z0-9_-]+/i },
  { name: 'crunchbase', pattern: /crunchbase\.com\/organization\/[a-zA-Z0-9_-]+/i },
  { name: 'angellist', pattern: /angellist\.com\/[a-zA-Z0-9_-]+/i },
];

const HIRING_KEYWORDS = ['careers', 'jobs', 'career', 'join us', 'work with us', 'open positions', 'job openings', 'we are hiring', 'job opportunities', 'apply now', 'current openings'];

export async function scrapeWebsite(url: string): Promise<Partial<ScrapingResult>> {
  const result: Partial<ScrapingResult> = {
    title: '',
    description: '',
    keywords: [],
    technologies: [],
    email: '',
    phone: '',
    socialLinks: [],
    hiringPage: '',
    isHiring: false,
  };

  try {
    const domain = extractDomain(url);
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;

    const response = await axios.get(fullUrl, {
      timeout: config.scraping.timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400,
    });

    const html = response.data as string;
    const $ = cheerio.load(html);

    result.title = $('title').first().text().trim() || '';
    result.description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    const keywordsAttr = $('meta[name="keywords"]').attr('content');
    if (keywordsAttr) {
      result.keywords = keywordsAttr.split(',').map((k) => k.trim()).filter(Boolean);
    }

    result.technologies = detectTechnologies(html);
    result.email = extractEmails(html);
    result.socialLinks = extractSocialLinks(html, domain);

    const hiringResult = findHiringPage($, html, domain);
    result.hiringPage = hiringResult.url;
    result.isHiring = hiringResult.isHiring;

    const phoneMatch = html.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{0,4}/g);
    if (phoneMatch) {
      const cleaned = phoneMatch.find((p) => p.replace(/[\s.-]/g, '').length >= 7 && p.replace(/[\s.-]/g, '').length <= 15);
      if (cleaned) result.phone = cleaned.trim();
    }

    if (!result.description) {
      const firstP = $('p').first().text().trim().slice(0, 300);
      if (firstP) result.description = firstP;
    }

    logger.info({ domain, technologiesCount: result.technologies?.length, hasEmail: !!result.email }, 'Website scraped successfully');
  } catch (err: any) {
    logger.error({ err, url }, 'Failed to scrape website');
    throw err;
  }

  return result;
}

export function detectTechnologies(html: string): string[] {
  const detected: string[] = [];
  for (const tech of TECH_PATTERNS) {
    for (const pattern of tech.patterns) {
      if (pattern.test(html)) {
        detected.push(tech.name);
        break;
      }
    }
  }
  return [...new Set(detected)];
}

export function extractEmails(text: string): string {
  const mailtoMatches = text.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
  if (mailtoMatches) {
    const emails = mailtoMatches.map((m) => m.replace(/^mailto:/i, ''));
    const unique = [...new Set(emails)];
    return unique[0] || '';
  }

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  if (matches) {
    const excludePatterns = [/\.png$/, /\.jpg$/, /\.gif$/, /\.svg$/, /\.css$/, /\.js$/, /example\.com/, /sample\.com/, /test\.com/, /@scholar\.google/];
    const filtered = matches.filter((email) => !excludePatterns.some((p) => p.test(email)));
    const unique = [...new Set(filtered)];
    return unique[0] || '';
  }

  return '';
}

export function extractSocialLinks(html: string, domain: string): string[] {
  const links: string[] = [];
  for (const social of SOCIAL_PATTERNS) {
    const matches = html.match(social.pattern);
    if (matches) {
      let url = matches[0];
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      links.push(url);
    }
  }
  return [...new Set(links)];
}

function findHiringPage($: cheerio.CheerioAPI, html: string, domain: string): { url: string; isHiring: boolean } {
  const jobsPaths = ['/careers', '/jobs', '/career', '/join-us', '/open-positions', '/job-openings', '/work-with-us'];

  let foundUrl = '';

  $('a').each((_i, el) => {
    if (foundUrl) return;
    const href = $(el).attr('href');
    if (!href) return;
    const text = $(el).text().toLowerCase().trim();
    const lowerHref = href.toLowerCase();

    const isHiringLink = jobsPaths.some(
      (path) => lowerHref.includes(path) || text.includes(path.replace('/', '')) || text.includes('hiring') || text.includes('career')
    );

    if (isHiringLink) {
      foundUrl = href.startsWith('http') ? href : `https://${domain}${href.startsWith('/') ? '' : '/'}${href}`;
    }
  });

  const bodyText = $('body').text().toLowerCase();
  const hiringKeywordsFound = HIRING_KEYWORDS.some((kw) => bodyText.includes(kw));

  if (foundUrl && hiringKeywordsFound) {
    const hasJobListings = /\b\d+\s*(open positions|job openings|jobs|roles|positions)\b/i.test(bodyText);
    return { url: foundUrl, isHiring: hasJobListings || hiringKeywordsFound };
  }

  return { url: foundUrl, isHiring: false };
}
