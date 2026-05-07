const { chromium } = require('playwright');
const db = require('./database');

async function scrapeGoogleMaps(query, maxResults = 20) {
  const browser = await chromium.launch({ headless: false }); // Headless false so user can see it working if they want, or for debugging
  const page = await browser.newPage();
  
  const results = [];
  
  try {
    console.log(`Searching for: ${query}`);
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(query)}`);
    
    // Wait for the results to load
    await page.waitForSelector('.m67q606yZ61__section-result-action-buttons, .hfpxzc');

    let processedCount = 0;
    
    while (processedCount < maxResults) {
      // Find all business entries
      const entries = await page.$$('.hfpxzc');
      
      if (processedCount >= entries.length) {
        // Try to scroll to load more
        await page.evaluate(() => {
          const container = document.querySelector('div[role="feed"]');
          if (container) container.scrollTop += 1000;
        });
        await page.waitForTimeout(2000);
        const newEntries = await page.$$('.hfpxzc');
        if (newEntries.length === entries.length) break; // No more results
        continue;
      }

      const entry = entries[processedCount];
      processedCount++;

      // Check if it has a website button in the list view (if possible)
      // Usually, if there's no website, the 'Website' button is missing.
      // However, it's more reliable to click and check details.
      
      await entry.click();
      await page.waitForTimeout(1000); // Wait for details to load

      // Check for website link
      const hasWebsite = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[data-item-id="authority"]'));
        return links.length > 0;
      });

      if (!hasWebsite) {
        const info = await page.evaluate(() => {
          const name = document.querySelector('h1.DUwDvf')?.innerText || 'Unknown';
          const phoneElement = document.querySelector('button[data-item-id^="phone:tel:"]');
          const phone = phoneElement ? phoneElement.getAttribute('data-item-id').replace('phone:tel:', '') : null;
          const address = document.querySelector('button[data-item-id="address"]')?.innerText || 'No address';
          
          return { name, phone, address };
        });

        if (info.phone) {
          const status = db.isPhoneListed(info.phone) ? 'JA LISTADO' : 'NOVO';
          const result = { ...info, status, category: query };
          
          if (status === 'NOVO') {
            db.addLead(result);
          }
          
          results.push(result);
          console.log(`Found Lead: ${info.name} - ${info.phone} [${status}]`);
        }
      }
    }
  } catch (error) {
    console.error('Scraping error:', error);
  } finally {
    await browser.close();
  }
  
  return results;
}

module.exports = { scrapeGoogleMaps };
