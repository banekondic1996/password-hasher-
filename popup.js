// Display domain name when popup opens
async function displayDomain() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const domain = url.hostname;
    document.getElementById('domainName').textContent = `Domain: "${domain}"`;
    document.getElementById('domainName').style.textAlign = 'center';
    document.getElementById('domainName').style.color = '#666';
    document.getElementById('domainName').style.fontSize = '12px';
    document.getElementById('domainName').style.fontWeight = 'bold';
  } catch (error) {
    document.getElementById('domainName').textContent = 'Unable to detect domain';
  }
}

// Call it when popup loads
displayDomain();

// Help button functionality
document.getElementById('helpBtn').addEventListener('click', () => {
  document.getElementById('mainView').style.display = 'none';
  document.getElementById('helpView').style.display = 'block';
});

document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('mainView').style.display = 'block';
  document.getElementById('helpView').style.display = 'none';
});

document.getElementById('hashBtn').addEventListener('click', async () => {
  const btn = document.getElementById('hashBtn');
  const status = document.getElementById('status');
  
  btn.disabled = true;
  status.textContent = 'Processing...';
  status.className = 'info';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: hashPasswordInPage
    });
    
    status.textContent = 'Password hashed successfully!';
    status.className = 'success';
  } catch (error) {
    status.textContent = 'Error: ' + error.message;
    status.className = 'error';
  } finally {
    btn.disabled = false;
  }
});

async function hashPasswordInPage() {
  // Find the focused password field or the last password field on the page
  let passwordField = document.activeElement;
  
  if (!passwordField || passwordField.type !== 'password') {
    const passwordFields = document.querySelectorAll('input[type="password"]');
    if (passwordFields.length === 0) {
      alert('No password field found on this page!');
      return;
    }
    passwordField = passwordFields[passwordFields.length - 1];
  }
  
  const originalPassword = passwordField.value;
  
  if (!originalPassword) {
    alert('Password field is empty!');
    return;
  }
  
  // Get the domain name
  const domain = window.location.hostname;
  
  // Combine password and domain
  const combined = originalPassword + domain;
  
  // Hash with SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Add "B.2" to ensure uppercase and symbol requirements and take only first 12 char of hash
  const hashedPassword = hashHex.slice(0, 20) + 'B.2';
  
  // Replace the password in the field
  passwordField.value = hashedPassword;
  
  // Trigger input event so the page knows the value changed
  passwordField.dispatchEvent(new Event('input', { bubbles: true }));
  passwordField.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Visual feedback
  passwordField.style.backgroundColor = '#d4edda';
  setTimeout(() => {
    passwordField.style.backgroundColor = '';
  }, 1000);
}
