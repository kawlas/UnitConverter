// Generator sitemap.xml dla Uni Converter
const categories = ['length', 'weight', 'temperature', 'volume', 'pressure', 'digital', 'time', 'angle', 'fuel', 'pace'];
const baseUrl = 'https://qconverter.netlify.app';

export function generateSitemapXML(): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Strona główna
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
  
  // Kategorie
  for (const cat of categories) {
    xml += `  <url>\n    <loc>${baseUrl}/convert/${cat}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
  
  xml += '</urlset>';
  return xml;
}
