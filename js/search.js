import { supabase } from '../serverClient.js';

/* -------------------------
   Utility: preload an image (resolves true/false)
   ------------------------- */
function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/* -------------------------
   open360Viewer: Option B (thumbnail attached to arrows)
   ------------------------- */
function open360Viewer(imageUrls = [], startIndex = 0) {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) return;

  let currentIndex = Math.max(0, Math.min(startIndex, imageUrls.length - 1));
  let panorama = null;
  let viewer = null;

  // Overlay container
  const container = document.createElement('div');
  container.classList.add('viewer-overlay');

  // Append to body and lock scroll
  document.body.appendChild(container);
  document.body.classList.add('viewer-open');
  document.body.style.overflow = 'hidden';

  // --- Exit button ---
  const exitBtn = document.createElement('button');
  exitBtn.classList.add('viewer-exit-btn');
  exitBtn.setAttribute('aria-label', 'Close viewer');
  exitBtn.innerHTML = '&times;';
  container.appendChild(exitBtn);

  // --- Prev button (arrow + attached thumbnail) ---
  const prevBtn = document.createElement('button');
  prevBtn.classList.add('viewer-nav-btn', 'left');
  prevBtn.setAttribute('aria-label', 'Previous panorama');
  prevBtn.innerHTML = `
    <span class="arrow"><i class="fa-solid fa-chevron-left"></i></span>
    <span class="thumb" aria-hidden="true"></span>
  `;
  container.appendChild(prevBtn);

  // --- Next button (attached thumbnail + arrow) ---
  const nextBtn = document.createElement('button');
  nextBtn.classList.add('viewer-nav-btn', 'right');
  nextBtn.setAttribute('aria-label', 'Next panorama');
  nextBtn.innerHTML = `
    <span class="thumb" aria-hidden="true"></span>
    <span class="arrow"><i class="fa-solid fa-chevron-right"></i></span>
  `;
  container.appendChild(nextBtn);

  // Create Panolens viewer inside the overlay
  viewer = new PANOLENS.Viewer({
    container,            // Panolens will use this container
    controlBar: false,
    autoHideInfospot: false,
    output: 'console'
  });

  // helper: set the thumb background-image
  function setThumbBackground(buttonEl, url) {
    const thumb = buttonEl.querySelector('.thumb');
    if (!thumb) return;
    if (!url) {
      thumb.style.backgroundImage = '';
      thumb.style.opacity = '0';
      return;
    }
    thumb.style.backgroundImage = `url('${url}')`;
    thumb.style.opacity = '1';
  }

  // Preload current, prev, next
  const prevIndexInit = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
  const nextIndexInit = (currentIndex + 1) % imageUrls.length;
  setThumbBackground(prevBtn, imageUrls[prevIndexInit]);
  setThumbBackground(nextBtn, imageUrls[nextIndexInit]);
  preloadImage(imageUrls[prevIndexInit]);
  preloadImage(imageUrls[nextIndexInit]);
  preloadImage(imageUrls[currentIndex]);

  // build initial panorama and add to viewer
  panorama = new PANOLENS.ImagePanorama(imageUrls[currentIndex]);
  viewer.add(panorama);

  // ensure Panolens canvas accepts touch gestures (improve mobile behavior)
  const ensureCanvasTouch = () => {
    setTimeout(() => {
      try {
        const canvas = container.querySelector('canvas') || (viewer && viewer.renderer && viewer.renderer.domElement);
        if (canvas) {
          canvas.style.touchAction = 'none';
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.width = '100%';
          canvas.style.height = '100%';
          canvas.style.pointerEvents = 'auto';
          canvas.style.zIndex = 1; 
          canvas.setAttribute('touch-action', 'none');
          canvas.style.webkitTouchCallout = 'none';
        }
      } catch (err) { /* ignore */ }
    }, 150);
  };
  ensureCanvasTouch();

  // function to switch panorama smoothly, with preloading
  function switchPanorama(newIndex) {
    if (newIndex === currentIndex) return;
    const url = imageUrls[newIndex];

    // Preload before switching for smoothness
    preloadImage(url).then(() => {
      const newPanorama = new PANOLENS.ImagePanorama(url);

      // When entered, remove old one
      newPanorama.addEventListener('enter', () => {
        try { viewer.remove(panorama); } catch (e) {}
        panorama = newPanorama;
      });

      viewer.add(newPanorama);
      viewer.setPanorama(newPanorama);

      currentIndex = newIndex;

      // Update thumbs
      const prevIdx = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
      const nextIdx = (currentIndex + 1) % imageUrls.length;
      setThumbBackground(prevBtn, imageUrls[prevIdx]);
      setThumbBackground(nextBtn, imageUrls[nextIdx]);

      // Preload adjacent images
      preloadImage(imageUrls[(nextIdx + 1) % imageUrls.length]);
      preloadImage(imageUrls[(prevIdx - 1 + imageUrls.length) % imageUrls.length]);

      // ensure canvas touch action remains intact after new panorama
      ensureCanvasTouch();
    });
  }

  // Event listeners
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex + 1) % imageUrls.length;
    switchPanorama(newIndex);
  });

  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const newIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
    switchPanorama(newIndex);
  });

  // keyboard support
  function handleKey(e) {
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowRight') nextBtn.click();
    if (e.key === 'ArrowLeft') prevBtn.click();
  }
  window.addEventListener('keydown', handleKey);

  // Click on overlay should not close viewer (user should explicit click exit)
  container.addEventListener('click', (ev) => ev.stopPropagation());

  // Exit / cleanup
  function closeViewer() {
    try {
      window.removeEventListener('keydown', handleKey);
      exitBtn.removeEventListener('click', closeViewer);
      nextBtn.removeEventListener('click', switchPanorama);
      prevBtn.removeEventListener('click', switchPanorama);
    } catch (err) { /* ignore */ }

    try {
      viewer && viewer.dispose && viewer.dispose();
    } catch (e) { /* ignore */ }

    try {
      container.remove();
    } catch (e) { /* ignore */ }

    // unlock scroll
    document.body.classList.remove('viewer-open');
    document.body.style.overflow = '';
  }

  exitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeViewer();
  });

  // Return viewer object if needed
  return { viewer, container };
}

/* -------------------------
   Carousel creation (unchanged)
   ------------------------- */
function createCarousel(imageUrls) {
  const container = document.createElement('div');
  container.classList.add('carousel');

  // Main images
  const mainImages = imageUrls.map((url, index) => {
    const img = document.createElement('img');
    img.src = url;
    img.classList.add('main');
    if (index === 0) img.classList.add('active');
    img.addEventListener('click', () => open360Viewer(imageUrls, index));
    container.appendChild(img);
    return img;
  });

  // Thumbnails
  const controls = document.createElement('div');
  controls.classList.add('carousel-controls');
  const thumbnails = imageUrls.map((url, index) => {
    const thumb = document.createElement('img');
    thumb.src = url;
    thumb.classList.add('carousel-thumb');
    if (index === 0) thumb.classList.add('active');

    thumb.addEventListener('click', () => {
      mainImages.forEach((img, i) => img.classList.toggle('active', i === index));
      thumbnails.forEach((t, i) => t.classList.toggle('active', i === index));
    });

    controls.appendChild(thumb);
    return thumb;
  });

  container.appendChild(controls);

  // --- Swipe functionality for mobile ---
  let startX = 0;
  let isDragging = false;

  container.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  container.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    const threshold = 50; // Minimum swipe distance to trigger

    let currentIndex = mainImages.findIndex(img => img.classList.contains('active'));
    if (deltaX > threshold) {
      // Swipe right → previous image
      currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
    } else if (deltaX < -threshold) {
      // Swipe left → next image
      currentIndex = (currentIndex + 1) % imageUrls.length;
    } else {
      isDragging = false;
      return; // Swipe too small, ignore
    }

    mainImages.forEach((img, i) => img.classList.toggle('active', i === currentIndex));
    thumbnails.forEach((t, i) => t.classList.toggle('active', i === currentIndex));

    isDragging = false;
  });

  return container;
}

/* -------------------------
   Main app (auth, load rooms, show details)
   Very similar to your original code with small improvements
   ------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  /*** Hamburger menu functionality ***/
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const isOpening = !this.classList.contains('active');
      this.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = isOpening ? 'hidden' : '';
      this.setAttribute('aria-expanded', isOpening);
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.navbar-container') &&
          !e.target.closest('.mobile-menu') &&
          mobileMenu.classList.contains('active')) {
        closeMenu();
      }
    });

    function closeMenu() {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
      hamburger.setAttribute('aria-expanded', 'false');
    }

    document.querySelectorAll('.mobile-menu a, .mobile-signin, .mobile-signup').forEach(item => {
      item.addEventListener('click', closeMenu);
    });
  }
});

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '../index.html';
    return;
  }
  const user = session.user;

  async function fetchRoomImages(roomId) {
    const { data, error } = await supabase
      .from('room_images')
      .select('image_url')
      .eq('room_id', roomId);

    return data || [];
  }

  async function loadRooms() {
    const listContainer = document.getElementById('room-list-view');
    const location = document.getElementById('filter')?.value || '';

    listContainer.innerHTML = `<div class="loading-state"><img src="images/loading.gif" alt="Loading..."><p>Loading available rooms...</p></div>`;
    document.getElementById('room-details-view').style.display = 'none';

    let query = supabase.from('rooms').select('*').eq('is_available', true);
    if (location) query = query.eq('location', location);

    const { data, error } = await query;

    if (error) {
      listContainer.innerHTML = 'Error loading rooms.';
      return;
    }

    if (!data || data.length === 0) {
      listContainer.innerHTML = `<div class="empty-state"><p>No rooms available for this location.</p></div>`;
      return;
    }

    listContainer.innerHTML = '';

    for (const room of data) {
      const images = await fetchRoomImages(room.id);
      const exampleImage = images.length ? images[0].image_url : 'placeholder.jpg';

      const card = document.createElement('div');
      card.classList.add('room');
      card.innerHTML = `
        <div class="room-image">
          <img src="${room.cover_photo_url || exampleImage}" alt="Room Image">
        </div>
        <div class="room-content">
          <h2><i class="fa-solid fa-door-closed"></i> Room ${room.room_no}</h2>
          <div class="room-info">
            <p class="room-p"><i class="fa-solid fa-location-dot"></i></p> <p>${room.location}</p>
          </div>
          <div class="room-info">
            <p class="room-p"><i class="fa-solid fa-person"></i></p> <p> Good for ${room.pax} Pax</p>
          </div>
          <div class="room-btn">
            <button class="chat-btn">Inquire <i class="fa-regular fa-circle-question"></i></button>
            <button class="details-btn" data-room-id="${room.id}">Full Details <i class="fa-solid fa-square-caret-down"></i></button>
          </div>
        </div>
      `;
      listContainer.appendChild(card);

      const chatBtn = card.querySelector('.chat-btn');
      chatBtn.dataset.room = JSON.stringify({
        room_no: room.room_no,
        location: room.location,
        pax: room.pax,
        rental_price: room.rental_price,
        amenities: room.amenities,
        inclusions: room.inclusions,
      });
    }

    document.querySelectorAll('.details-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const roomId = e.currentTarget.getAttribute('data-room-id');
        await showRoomDetails(roomId);
      });
    });
  }

  async function showRoomDetails(roomId) {
    const { data: room, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (error) return alert('Failed to load room details.');

    const images = await fetchRoomImages(roomId);
    let gallery;

    if (!images || images.length === 0) {
      gallery = document.createElement('div');
      gallery.classList.add('empty-state');
      gallery.innerHTML = `<img src="images/no-data.gif" alt="No images"><p>No images available for this room.</p>`;
    } else {
      gallery = createCarousel(images.map(i => i.image_url));
    }

    const detailsContainer = document.getElementById('room-details-view');
    detailsContainer.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.classList.add('back-btn');
    backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Room List';
    backBtn.addEventListener('click', () => {
      detailsContainer.style.display = 'none';
      document.getElementById('filter-container').style.display = 'flex';
      document.getElementById('room-list-view').style.display = 'block';
      document.getElementById('mapPreview') && (document.getElementById('mapPreview').style.display = 'block');
    });

    const reserveBtn = document.createElement('button');
    reserveBtn.classList.add('reserve-btn');
    reserveBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Reserve This Room';
    reserveBtn.addEventListener('click', async () => {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];

      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 3);
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data: existing, error: checkError } = await supabase
        .from('room_reservations')
        .select('*')
        .eq('user_id', user.id)
        .eq('room_id', room.id)
        .eq('status', 'active')
        .gte('end_date', startDate);

      if (checkError) {
        alert('Error checking reservations. Try again.');
        return;
      }

      if (existing && existing.length > 0) {
        alert('You already have an active reservation for this room.');
        return;
      }

      const { error } = await supabase.from('room_reservations').insert({
        user_id: user.id,
        room_id: room.id,
        start_date: startDate,
        end_date: endDateStr,
        status: 'active'
      });

      if (error) {
        alert('Failed to reserve room.');
        return;
      }

      alert('Room reserved. Visit the site within 3 days.');
    });

    const details = document.createElement('div');
    details.classList.add('room-details');
    details.innerHTML = `
      <h2>Room ${room.room_no} - ${room.location}</h2>
      <p><strong>Rental Fee:</strong> ₱${room.rental_price.toLocaleString()} / month</p>
      <p><strong>Inclusions:</strong> ${Array.isArray(room.inclusions) ? room.inclusions.join(', ') : room.inclusions}</p>
      <p><strong>Amenities:</strong> ${Array.isArray(room.amenities) ? room.amenities.join(', ') : room.amenities}</p>
      <p><strong>Available:</strong> ${room.is_available ? 'Yes' : 'No'}</p>
      <p><strong>Reservation Fee:</strong> ₱${room.reserve_fee ? room.reserve_fee.toLocaleString() : '0'}</p>
    `;

    detailsContainer.appendChild(backBtn);
    detailsContainer.appendChild(gallery);
    detailsContainer.appendChild(details);
    detailsContainer.appendChild(reserveBtn);

    document.getElementById('filter-container').style.display = 'none';
    document.getElementById('room-list-view').style.display = 'none';
    document.getElementById('mapPreview') && (document.getElementById('mapPreview').style.display = 'none');
    detailsContainer.style.display = 'block';
  }

  // Filter change listener and initial load
  document.getElementById('filter')?.addEventListener('change', loadRooms);
  await loadRooms();
});

/* -------------------------
   Logout modal handlers (unchanged)
   ------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutModal = document.getElementById('logoutModal');
  const closeLogoutModal = document.getElementById('closeLogoutModal');
  const cancelLogout = document.getElementById('cancelLogout');
  const confirmLogout = document.getElementById('confirmLogout');

  logoutBtn?.addEventListener('click', function (e) {
    e.preventDefault();
    logoutModal.style.display = 'flex';
  });

  closeLogoutModal?.addEventListener('click', () => logoutModal.style.display = 'none');
  cancelLogout?.addEventListener('click', () => logoutModal.style.display = 'none');

  confirmLogout?.addEventListener('click', function () {
    logout();
  });

  window.addEventListener('click', function (e) {
    if (e.target === logoutModal) {
      logoutModal.style.display = 'none';
    }
  });
});

function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '../index.html';
}
