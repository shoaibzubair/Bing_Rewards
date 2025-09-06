let searchTerms = [    "interior design", "wedding planning", "small business ideas", "parenting tips", "retirement planning", "online courses", "digital marketing", "podcast recommendations", "yoga poses", "wine tasting", "budget travel", "freelancing opportunities", "sustainable fashion", "plant-based recipes", "graphic design", "social media trends", "public speaking", "time management", "creative writing", "outdoor activities", "antique collecting", "skincare routines", "jewelry making", "woodworking projects", "beard grooming", "nail art", "hairstyle trends", "makeup tutorials", "board game reviews", "puzzle solutions", "craft beer", "coffee brewing", "tea ceremonies", "cheese making", "bread baking", "fermentation", "urban planning", "architecture styles", "real estate trends", "rental property", "insurance options", "tax strategies", "scholarship opportunities", "study abroad", "networking events", "job interviews", "resume writing", "salary negotiation", "workplace productivity", "team building", "leadership skills", "conflict resolution", "customer service", "sales techniques", "marketing automation", "content creation", "SEO strategies", "web development", "database design", "cloud computing", "machine learning", "data visualization", "statistical analysis", "research methods", "academic writing", "scientific publications", "patent applications", "innovation management", "startup funding", "venture capital", "crowdfunding", "business partnerships", "supply chain", "logistics management", "quality control", "project management", "risk assessment", "compliance regulations", "environmental law", "intellectual property", "contract negotiation", "dispute resolution", "mediation services", "legal research", "court procedures", "immigration law", "family law", "estate planning", "elder care", "disability resources", "addiction recovery", "grief counseling", "relationship advice", "dating tips", "marriage counseling", "child development", "educational psychology", "learning disabilities", "special needs support", "autism resources", "ADHD management", "anxiety treatment", "depression help"
 ];
  
  // Function to extract potential search terms from a webpage
  async function extractSearchTermsFromPage(tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: {tabId: tabId},
        function: () => {
          // Function to get random items from an array
          function getRandomItems(arr, num) {
            const shuffled = [...arr].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, num);
          }
          
          // Get all headings and paragraphs
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
          const paragraphs = Array.from(document.querySelectorAll('p')).slice(0, 5); // Just take first 5 paragraphs
          
          // Extract text and split into words
          const headingText = headings.map(h => h.textContent.trim()).join(' ');
          const paragraphText = paragraphs.map(p => p.textContent.trim()).join(' ');
          
          const allText = headingText + ' ' + paragraphText;
          
          // Extract meaningful phrases (3-5 words)
          const phrases = [];
          const words = allText.split(/\s+/);
          
          for (let i = 0; i < words.length - 2; i++) {
            // Skip common words and short words as starting points
            if (words[i].length < 4) continue;
            
            // Create phrases of different lengths
            const phrase3 = words.slice(i, i + 3).join(' ');
            if (phrase3.length > 10 && phrase3.length < 40) phrases.push(phrase3);
            
            if (i < words.length - 4) {
              const phrase5 = words.slice(i, i + 5).join(' ');
              if (phrase5.length > 15 && phrase5.length < 60) phrases.push(phrase5);
            }
          }
          
          // Return random selection of found phrases
          return getRandomItems(phrases, 10);
        }
      });
      
      // Extract phrases from script execution result
      if (results && results.length > 0 && results[0].result && results[0].result.length > 0) {
        return results[0].result;
      }
      return [];
    } catch (error) {
      console.error("Error extracting terms:", error);
      return [];
    }
  }
  
  // Function to shuffle array (Fisher-Yates algorithm)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Function to perform a search using Bing search bar
  async function performSearchUsingSearchBar(tabId, searchTerm, count) {
    try {
      // First make sure we're on Bing
      const tab = await chrome.tabs.get(tabId);
      if (!tab.url.includes('bing.com')) {
        await chrome.tabs.update(tabId, { url: 'https://www.bing.com/' });
        
        // Wait for Bing to load
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Now inject script to use the search bar
      await chrome.scripting.executeScript({
        target: {tabId: tabId},
        func: (term) => {
          return new Promise((resolve, reject) => {
            try {
              // Function to find the search input field - handles multiple possible selectors
              function findSearchInput() {
                // Try different possible selectors for Bing search box
                const selectors = [
                  '#sb_form_q', // Standard Bing search input
                  'input[name="q"]', // General query input
                  'input[type="search"]', // Any search input
                  'input.b_searchbox', // Bing search box class
                  '#searchbox' // Another possible ID
                ];
                
                for (const selector of selectors) {
                  const element = document.querySelector(selector);
                  if (element) return element;
                }
                
                return null;
              }
              
              // Find the search input
              const searchInput = findSearchInput();
              
              if (!searchInput) {
                throw new Error("Could not find search input field");
              }
              
              // Clear any existing value
              searchInput.value = '';
              
              // Focus the search input
              searchInput.focus();
              
              // Insert the search term
              searchInput.value = term;
              
              // Create and dispatch events to make it look natural
              // Input event
              searchInput.dispatchEvent(new Event('input', { bubbles: true }));
              
              // Small delay to simulate typing
              setTimeout(() => {
                // Find the search button
                const searchButton = document.querySelector('#search_icon') || 
                                    document.querySelector('button[type="submit"]') ||
                                    document.querySelector('#sb_form_go');
                
                if (searchButton) {
                  // Click the search button
                  searchButton.click();
                  resolve(true);
                } else {
                  // If no button found, try submitting the form
                  const form = document.querySelector('#sb_form') || document.querySelector('form');
                  if (form) {
                    form.submit();
                    resolve(true);
                  } else {
                    // Last resort - simulate Enter key on the input
                    searchInput.dispatchEvent(new KeyboardEvent('keydown', {
                      key: 'Enter',
                      code: 'Enter',
                      keyCode: 13,
                      which: 13,
                      bubbles: true
                    }));
                    resolve(true);
                  }
                }
              }, 500);
            } catch (err) {
              reject(err);
            }
          });
        },
        args: [searchTerm]
      });
      
      // Send progress update
      chrome.runtime.sendMessage({
        type: 'progress',
        count: count
      });
      
      // Wait for page to load before extracting new terms
      if (count < 30) {
        return new Promise(resolve => {
          setTimeout(async () => {
            // Extract new terms from the search results page
            const newTerms = await extractSearchTermsFromPage(tabId);
            
            // Add new terms to our pool if we found any
            if (newTerms.length > 0) {
              searchTerms = [...searchTerms, ...newTerms];
              console.log("Added new search terms:", newTerms);
            }
            
            resolve();
          }, 5000); // Give page 5 seconds to load before extracting
        });
      }
    } catch (error) {
      console.error("Error during search:", error);
      chrome.runtime.sendMessage({
        type: 'error',
        error: error.message
      });
    }
  }
  
  // Function to click extra rewards on rewards.bing.com and call callback when done
  async function clickExtraRewards(tabId, callback) {
    try {
      const [{ result: rewardCount }] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          const rewardLinks = document.querySelectorAll('#more-activities a.ds-card-sec');
          let i = 0;
          function clickNextReward() {
            if (i < rewardLinks.length) {
              rewardLinks[i].click();
              i++;
              setTimeout(clickNextReward, 6000); // 6 seconds delay
            }
          }
          clickNextReward();
          return rewardLinks.length;
        }
      });
      // Wait for all rewards to finish (6s per reward)
      const totalDelay = (rewardCount || 0) * 6000 + 2000;
      setTimeout(callback, totalDelay);
    } catch (error) {
      console.error("Error clicking extra rewards:", error);
      callback();
    }
  }
  
  // Modified function: Visit rewards.bing.com, click rewards, then start searches
  async function runRewardsThenSearches() {
    try {
      const tab = await chrome.tabs.create({ url: "https://rewards.bing.com/", active: true });
      // Wait for page to load
      setTimeout(() => {
        clickExtraRewards(tab.id, () => {
          // After rewards, start searches in the same tab
          startRandomSearches(tab.id);
        });
      }, 4000); // Wait 4 seconds for the page to load
    } catch (error) {
      console.error("Error visiting rewards.bing.com:", error);
    }
  }
  
  // Accept tabId for searches (default: create new tab)
  async function startRandomSearches(tabId) {
    console.log("Starting searches at:", new Date().toLocaleString());
    let searchTab;
    try {
      if (tabId) {
        searchTab = await chrome.tabs.update(tabId, { url: "https://www.bing.com/", active: true });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        searchTab = await chrome.tabs.create({ url: "https://www.bing.com/", active: true });
      }
    } catch (error) {
      console.error("Error creating/updating tab:", error);
      return;
    }
    const randomizedTerms = shuffleArray([...searchTerms]);
    const searchLimit = 30;
    const selectedTerms = randomizedTerms.slice(0, searchLimit);
    for (let i = 0; i < searchLimit; i++) {
      await new Promise(resolve => {
        setTimeout(async () => {
          await performSearchUsingSearchBar(searchTab.id, selectedTerms[i], i + 1);
          resolve();
        }, i === 0 ? 2000 : 15000);
      });
    }
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "startSearches") {
      runRewardsThenSearches();
    }
    if (message.action === "clickExtraRewards") {
      visitAndClickExtraRewards();
    }
  });
  
  // Set up alarm handler for scheduled runs
  chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === 'dailySearchAlarm') {
      console.log("Scheduled search starting at", new Date().toLocaleString());
      startRandomSearches();
    }
  });
  
  // Initialize extension on install
  chrome.runtime.onInstalled.addListener(function() {
    console.log("Extension installed at:", new Date().toLocaleString());
    
    // Check if we need to create an initial alarm
    chrome.storage.local.get(['scheduleEnabled', 'scheduleTime'], function(result) {
      if (result.scheduleEnabled && result.scheduleTime) {
        // Parse time and create alarm
        const [hours, minutes] = result.scheduleTime.split(':').map(Number);
        
        // Calculate when the alarm should next fire
        const now = new Date();
        let scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If it's already past the scheduled time today, schedule for tomorrow
        if (now > scheduledTime) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        // Calculate minutes until scheduled time
        const delayInMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
        
        // Create alarm
        chrome.alarms.create('dailySearchAlarm', {
          delayInMinutes: delayInMinutes,
          periodInMinutes: 24 * 60 // Repeat every 24 hours
        });
      }
    });
  });
