// ===== Flip cards on tap (for touchscreens) =====
document.querySelectorAll('.impact-card').forEach(card => {
  card.addEventListener('click', () => {
    card.querySelector('.card-inner').classList.toggle('flipped');
  });
});

// ===== Fade-in on scroll effect =====
const faders = document.querySelectorAll('.impact-card');

const appearOptions = {
  threshold: 0.2,
  rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, observer) {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('show');
    observer.unobserve(entry.target);
  });
}, appearOptions);

faders.forEach(fader => {
  appearOnScroll.observe(fader);
});
// ===== End of js/script.js =====