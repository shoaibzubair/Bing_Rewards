document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startSearching');
    const statusDiv = document.getElementById('status');
    const scheduleToggle = document.getElementById('scheduleToggle');
    const scheduleTimeInput = document.getElementById('scheduleTime');
    const scheduleStatusDiv = document.getElementById('scheduleStatus');
    
    // Load saved time from storage
    chrome.storage.local.get(['scheduleTime'], function(result) {
      if (result.scheduleTime) {
        scheduleTimeInput.value = result.scheduleTime;
      }
    });
    
    // Check if alarm is already set
    chrome.alarms.get('dailySearchAlarm', function(alarm) {
      if (alarm) {
        scheduleToggle.checked = true;
        updateScheduleStatus();
      }
    });
    
    // Save time when changed
    scheduleTimeInput.addEventListener('change', function() {
      chrome.storage.local.set({scheduleTime: scheduleTimeInput.value});
      
      // If schedule is enabled, update the alarm
      if (scheduleToggle.checked) {
        scheduleSearches();
      }
    });
    
    // Function to update schedule status text
    function updateScheduleStatus() {
      if (scheduleToggle.checked) {
        scheduleStatusDiv.textContent = `Daily searches scheduled for ${scheduleTimeInput.value}`;
      } else {
        scheduleStatusDiv.textContent = "Daily schedule disabled";
      }
    }
    
    // Function to schedule searches
    function scheduleSearches() {
      // Parse time from input
      const [hours, minutes] = scheduleTimeInput.value.split(':').map(Number);
      
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
      
      // Save alarm info for debugging
      chrome.storage.local.set({
        lastScheduled: new Date().toISOString(),
        nextRun: scheduledTime.toISOString(),
        delayMinutes: delayInMinutes
      });
      
      console.log("Scheduled for:", scheduledTime, "Delay minutes:", delayInMinutes);
      
      updateScheduleStatus();
    }
    
    // Handle toggle for scheduling
    scheduleToggle.addEventListener('change', function() {
      if (this.checked) {
        scheduleSearches();
      } else {
        // Remove alarm
        chrome.alarms.clear('dailySearchAlarm');
        updateScheduleStatus();
      }
    });
    
    startButton.addEventListener('click', function() {
      chrome.runtime.sendMessage({action: "startSearches"});
      startButton.disabled = true;
      statusDiv.innerHTML = 'Searches started. Progress: <span id="counter">0/30</span>';
      
      // Listen for progress updates
      chrome.runtime.onMessage.addListener(function(message) {
        if (message.type === 'progress') {
          document.getElementById('counter').textContent = `${message.count}/30`;
          
          if (message.count === 30) {
            startButton.disabled = false;
            statusDiv.innerHTML += '<p>All searches completed!</p>';
          }
        } else if (message.type === 'error') {
          statusDiv.innerHTML += `<p style="color: red;">Error: ${message.error}</p>`;
          startButton.disabled = false;
        }
      });
    });
  });
  