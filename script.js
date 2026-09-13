const video = document.querySelector('.walkthrough video');

// Keep observing after autoplay or manual playback has started.
if (video && 'IntersectionObserver' in window) {
  const visibilityObserver = new IntersectionObserver((entries) => {
    const latest = entries[entries.length - 1];
    if (latest && latest.intersectionRatio === 0) video.pause();
  }, { threshold: 0 });
  visibilityObserver.observe(video);
}

// Start once; subsequent playback belongs to the viewer's native controls.
if (video && 'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.intersectionRatio >= 0.75)) {
      observer.disconnect();
      video.play().catch(() => {
        // Browser autoplay restrictions leave the native play button available.
      });
    }
  }, { threshold: 0.75 });

  observer.observe(video);
  // Do not override an intentional play or pause before reaching the threshold.
  for (const event of ['pointerdown', 'keydown', 'play']) {
    video.addEventListener(event, () => observer.disconnect(), { once: true });
  }
}

const viewer = document.querySelector('.image-viewer');
const imageList = document.querySelector('.viewer-images');
const closeButton = document.querySelector('.viewer-close');

if (viewer && typeof viewer.showModal === 'function') {
  const figures = [...document.querySelectorAll('.gallery-item, .layout')];
  let opener;

  const enlargedFigures = figures.map((figure) => {
    const enlarged = document.createElement('figure');
    const image = figure.querySelector('img').cloneNode(true);
    // Reserve each image's space before scrolling to the selected figure.
    image.loading = 'eager';
    enlarged.append(image, figure.querySelector('figcaption').cloneNode(true));
    imageList.append(enlarged);
    return enlarged;
  });

  figures.forEach((figure, index) => {
    let link = figure.querySelector('a');
    if (!link) {
      const image = figure.querySelector('img');
      link = document.createElement('a');
      link.href = image.getAttribute('src');
      image.before(link);
      link.append(image);
    }
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-label', `Öppna bildgalleriet: ${figure.querySelector('img').alt}`);
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      video?.pause();
      viewer.showModal();
      document.documentElement.classList.add('viewer-open');
      const selected = enlargedFigures[index];
      imageList.scrollTop = selected.getBoundingClientRect().top -
        imageList.getBoundingClientRect().top + imageList.scrollTop;
    });
  });

  closeButton.addEventListener('click', () => viewer.close());
  // Native dialog handles Escape and keeps keyboard focus inside the overlay.
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('viewer-open');
    opener?.focus({ preventScroll: true });
  });
}
