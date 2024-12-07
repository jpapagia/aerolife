document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const container = document.querySelector('.carousel-container');
  
    let index = 0;
  
    function showSlide(newIndex) {
      index = (newIndex + slides.length) % slides.length; // Wrap-around logic
      container.style.transform = `translateX(-${index * 100}%)`;
    }
  
    prevBtn.addEventListener('click', () => {
      showSlide(index - 1);
    });
  
    nextBtn.addEventListener('click', () => {
      showSlide(index + 1);
    });
  });
  