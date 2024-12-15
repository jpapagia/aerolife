document.addEventListener('DOMContentLoaded', async () => {
  const loadingElement = document.querySelector('.loading'); // Select the loading container

  const loadAnimation = async () => {
    try {
      // Fetch the loading animation HTML
      const response = await fetch('loading.html'); // Adjust the path if needed
      if (!response.ok) {
        throw new Error('Failed to load loading.html'); // Throw error if not found
      }
      const loadingHTML = await response.text();
      loadingElement.innerHTML = loadingHTML; // Inject the animation into the DOM
    } catch (error) {
      console.error('Error loading animation:', error);
      // Fallback: Show error message if loading.html fails
      loadingElement.innerHTML = '<p>Loading failed...</p>';
    }
  };

  const hideAnimation = () => {
    console.log('Hiding loading animation');
    loadingElement.style.opacity = '0'; // Smooth fade-out
    setTimeout(() => {
      loadingElement.style.display = 'none'; // Completely hide the element
    }, 500); // Allow time for fade-out transition
  };

  try {
    // Load the animation
    await loadAnimation();

    // Set a timeout to hide the loading animation after 1.5 seconds
    setTimeout(hideAnimation, 1500);
  } catch (error) {
    console.error('Error during animation setup:', error);
    hideAnimation(); // Ensure the animation hides if an error occurs
  }
});
