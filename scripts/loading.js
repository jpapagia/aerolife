document.addEventListener('DOMContentLoaded', async () => {
  const loadingElement = document.querySelector('.loading');
  const dynamicContent = document.getElementById('dynamic-content');

  // Load the loading animation from loading.html
  const loadAnimation = async () => {
    const response = await fetch('loading.html');
    const loadingHTML = await response.text();
    loadingElement.innerHTML = loadingHTML;
  };

  const resetAnimation = () => {
    const svgElement = loadingElement.querySelector('svg');
    if (svgElement) {
      // Force a reflow to restart the animation
      const clone = svgElement.cloneNode(true);
      svgElement.parentNode.replaceChild(clone, svgElement);
    }
  };

  const loadPage = async (url) => {
    loadingElement.style.display = 'flex'; // Show loading animation
    resetAnimation(); // Reset the animation to play continuously

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Page not found');
      const html = await response.text();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const newContent = tempDiv.querySelector('#dynamic-content').innerHTML;

      dynamicContent.innerHTML = newContent; // Replace content
    } catch (err) {
      console.error(err);
      dynamicContent.innerHTML = '<p>Error loading page.</p>';
    } finally {
      setTimeout(() => {
        loadingElement.style.display = 'none'; // Hide loading animation
      }, 1000);
    }
  };

  // Event listener for navigation links
  document.querySelectorAll('[data-link]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const url = e.target.getAttribute('href');
      history.pushState(null, null, url);
      loadPage(url); // Dynamically load new page
    });
  });

  // Handle back/forward navigation
  window.addEventListener('popstate', () => {
    loadPage(location.pathname);
  });

  // Initialize loading animation and load the current page
  await loadAnimation();
  loadPage(location.pathname);
});
