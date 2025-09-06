javascript:(function() {
    // Initial search terms
    const searchTerms = [
      "weather forecast", "news today", "recipe ideas",
      "travel destinations", "movie reviews", "technology trends",
      "health tips", "gardening advice", "home decor",
      "fitness routines", "book recommendations", "music charts",
      "sports news", "language learning", "programming tutorials",
      "art galleries", "photography tips", "car reviews",
      "financial advice", "career development", "science discoveries",
      "history facts", "video game reviews", "DIY projects",
      "fashion trends", "pet care", "meditation techniques",
      "astronomy facts", "cooking tips", "educational resources"
    ];
  
    // Create status overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '10px';
    overlay.style.right = '10px';
    overlay.style.backgroundColor = 'rgba(0, 120, 215, 0.9)';
    overlay.style.color = 'white';
    overlay.style.padding = '10px';
    overlay.style.borderRadius = '5px';
    overlay.style.zIndex = '9999';
    overlay.style.fontSize = '14px';
    overlay.style.maxWidth = '300px';
    
    // Control buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    
    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'Pause';
    pauseButton.style.padding = '5px 10px';
    pauseButton.style.backgroundColor = '#0078D7';
    pauseButton.style.border = 'none';
    pauseButton.style.borderRadius = '3px';
    pauseButton.style.color = 'white';
    pauseButton.style.cursor = 'pointer';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Stop & Close';
    closeButton.style.padding = '5px 10px';
    closeButton.style.backgroundColor = '#d74c4c';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    
    buttonContainer.appendChild(pauseButton);
    buttonContainer.appendChild(closeButton);
    
    // Add content to overlay
    overlay.innerHTML = '<h3 style="margin: 0 0 10px 0;">Bing Search Runner</h3>' +
                       '<div id="bingSearchStatus">Starting searches...</div>' +
                       '<div id="bingSearchCount">0/30 completed</div>';
    overlay.appendChild(buttonContainer);
    document.body.appendChild(overlay);
    
    // Status elements
    const statusDiv = document.getElementById('bingSearchStatus');
    const countDiv = document.getElementById('bingSearchCount');
    
    // Variables to control the search process
    let searchCount = 0;
    let isPaused = false;
    let searchInterval;
    let currentTimeout;
    
    // Shuffle array function
    function shuffleArray(array) {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }
    
    // Function to perform a search
    function performSearch(term) {
      statusDiv.textContent = `Searching: ${term}`;
      
      if (window.location.hostname.includes('bing.com')) {
        // We're on Bing, use the search box
        const selectors = [
          '#sb_form_q', 
          'input[name="q"]', 
          'input[type="search"]', 
          'input.b_searchbox', 
          '#searchbox'
        ];
        
        let searchInput = null;
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            searchInput = element;
            break;
          }
        }
        
        if (searchInput) {
          // Clear previous search
          searchInput.value = '';
          searchInput.focus();
          
          // Enter new search term
          searchInput.value = term;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Find and click search button after a short delay
          setTimeout(() => {
            const searchButton = document.querySelector('#search_icon') || 
                                document.querySelector('button[type="submit"]') ||
                                document.querySelector('#sb_form_go');
            
            if (searchButton) {
              searchButton.click();
            } else {
              // If no button found, try submitting the form
              const form = document.querySelector('#sb_form') || document.querySelector('form');
              if (form) {
                form.submit();
              } else {
                // Last resort - simulate Enter key
                searchInput.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true
                }));
              }
            }
          }, 500);
        } else {
          statusDiv.textContent = 'Search input not found';
        }
      } else {
        // Not on Bing, navigate there first
        window.location.href = 'https://www.bing.com/search?q=' + encodeURIComponent(term);
      }
    }
    
    // Function to start the search process
    function startSearches() {
      // Randomize search terms
      const randomTerms = shuffleArray(searchTerms).slice(0, 30);
      
      statusDiv.textContent = 'Starting searches...';
      searchCount = 0;
      
      // Perform first search immediately
      performSearch(randomTerms[0]);
      searchCount++;
      countDiv.textContent = `${searchCount}/3 completed`;
      
      // Set up interval for remaining searches
      let termIndex = 1;
      
      searchInterval = setInterval(() => {
        if (isPaused) return;
        
        if (termIndex < randomTerms.length && searchCount < 30) {
          performSearch(randomTerms[termIndex]);
          termIndex++;
          searchCount++;
          countDiv.textContent = `${searchCount}/30 completed`;
        } else {
          // All searches completed
          clearInterval(searchInterval);
          statusDiv.textContent = 'All searches completed!';
        }
      }, 15000); // 30 second interval
    }
    
    // Set up button handlers
    pauseButton.addEventListener('click', function() {
      isPaused = !isPaused;
      
      if (isPaused) {
        pauseButton.textContent = 'Resume';
        statusDiv.textContent = 'Searches paused';
      } else {
        pauseButton.textContent = 'Pause';
        statusDiv.textContent = 'Searches resumed';
      }
    });
    
    closeButton.addEventListener('click', function() {
      clearInterval(searchInterval);
      document.body.removeChild(overlay);
    });
    
    // Start the search process
    startSearches();
  })();