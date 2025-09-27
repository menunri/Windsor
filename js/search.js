import { supabase } from '../serverClient.js';

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

  function open360Viewer(imageUrls, startIndex = 0) {
    let currentIndex = startIndex;
    const container = document.createElement('div');
    container.classList.add('viewer-overlay');
    document.body.appendChild(container);

    const exitBtn = document.createElement('button');
    exitBtn.classList.add('viewer-exit-btn');
    exitBtn.innerHTML = '&times;';
    container.appendChild(exitBtn);

    const prevBtn = document.createElement('button');
    prevBtn.classList.add('viewer-nav-btn');
    prevBtn.innerHTML = '<i class="fa-solid fa-left-long"></i>';
    prevBtn.style.left = '20px';
    container.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.classList.add('viewer-nav-btn');
    nextBtn.innerHTML = '<i class="fa-solid fa-right-long"></i>';
    nextBtn.style.right = '20px';
    container.appendChild(nextBtn);

    let panorama = new PANOLENS.ImagePanorama(imageUrls[currentIndex]);
    const viewer = new PANOLENS.Viewer({
      container,
      controlBar: false,       
      autoHideInfospot: false, 
      output: 'console'        
    });

    viewer.add(panorama);

    function switchPanorama(index) {
      const newPanorama = new PANOLENS.ImagePanorama(imageUrls[index]);

      newPanorama.addEventListener('enter', () => {
        viewer.remove(panorama);
        panorama = newPanorama;
      });

      viewer.add(newPanorama);
      viewer.setPanorama(newPanorama);
    }

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % imageUrls.length;
      switchPanorama(currentIndex);
    });

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
      switchPanorama(currentIndex);
    });

    exitBtn.addEventListener('click', () => {
      viewer.dispose();
      container.remove();
    });
  }

    function createCarousel(imageUrls) {
      const container = document.createElement('div');
      container.classList.add('carousel');

      // Main images
      imageUrls.forEach((url, index) => {
        const img = document.createElement('img');
        img.src = url;
        img.classList.add('main');
        if (index === 0) img.classList.add('active');

        img.addEventListener('click', () => open360Viewer(imageUrls, index));
        container.appendChild(img);
      });

      // Thumbnails
      const controls = document.createElement('div');
      controls.classList.add('carousel-controls');

      imageUrls.forEach((url, index) => {
        const thumb = document.createElement('img');
        thumb.src = url;
        thumb.classList.add('carousel-thumb');
        if (index === 0) thumb.classList.add('active');

        thumb.addEventListener('click', () => {
          const imgs = container.querySelectorAll('.main');
          const thumbs = controls.querySelectorAll('.carousel-thumb');

          imgs.forEach((img, i) => img.classList.toggle('active', i === index));
          thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
        });

        controls.appendChild(thumb);
      });

      container.appendChild(controls);
      return container;
    }

 

  async function loadRooms() {
    const listContainer = document.getElementById('room-list-view');
    const location = document.getElementById('filter').value;

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
          <img src="${room.cover_photo_url}" alt="Room Image">
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

    if (images.length === 0) {
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
        document.getElementById('filter-container').style.display = 'block';
        document.getElementById('room-list-view').style.display = 'block';
        document.getElementById('mapPreview').style.display = 'block';
      });

      const reserveBtn = document.createElement('button');
      reserveBtn.classList.add('reserve-btn');
      reserveBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Reserve This Room';
      reserveBtn.addEventListener('click', async () => {
            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const startDate = today.toISOString().split('T')[0];

            // End date = 3 days later
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 3);
            const endDateStr = endDate.toISOString().split('T')[0];

            // Check if user already has an active reservation for this room
            const { data: existing, error: checkError } = await supabase
              .from('room_reservations')
              .select('*')
              .eq('user_id', user.id)
              .eq('room_id', room.id)
              .eq('status', 'active')
              .gte('end_date', startDate);  // ✅ Use string, not Date object

            if (checkError) {
              alert('Error checking reservations. Try again.');
              return;
            }

            if (existing && existing.length > 0) {
              alert('You already have an active reservation for this room.');
              return;
            }

            // Insert reservation
            const { error } = await supabase.from('room_reservations').insert({
              user_id: user.id,
              room_id: room.id,
              start_date: startDate,
              end_date: endDateStr,
              status: 'active'   // ✅ Explicitly set status
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
      <p><strong>Inclusions:</strong> ${room.inclusions.join(', ')}</p>
      <p><strong>Amenities:</strong> ${room.amenities.join(', ')}</p>
      <p><strong>Available:</strong> ${room.is_available ? 'Yes' : 'No'}</p>
      <p><strong>Reservation Fee:</strong> ₱${room.reserve_fee.toLocaleString()}</p>
    `;

    detailsContainer.appendChild(backBtn);
    detailsContainer.appendChild(gallery);
    detailsContainer.appendChild(details);
    detailsContainer.appendChild(reserveBtn);

    document.getElementById('filter-container').style.display = 'none';
    document.getElementById('room-list-view').style.display = 'none';
    document.getElementById('mapPreview').style.display = 'none';
    detailsContainer.style.display = 'block';
  }

  document.getElementById('filter').addEventListener('change', loadRooms);
  loadRooms();
});

document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const closeLogoutModal = document.getElementById('closeLogoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');

    // Show modal when clicking logout link
    logoutBtn?.addEventListener('click', function (e) {
        e.preventDefault();
        logoutModal.style.display = 'flex';
    });

    // Close modal when clicking X or Cancel
    closeLogoutModal?.addEventListener('click', () => logoutModal.style.display = 'none');
    cancelLogout?.addEventListener('click', () => logoutModal.style.display = 'none');

    // Confirm Logout (only logs out here)
    confirmLogout?.addEventListener('click', function () {
        logout(); // Call the logout function only when "Yes" is clicked
    });

    // Close modal if user clicks outside
    window.addEventListener('click', function (e) {
        if (e.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    });
});


function logout() {
 
    localStorage.clear();
    sessionStorage.clear();

    // Optional
    // fetch('/logout', { method: 'POST', credentials: 'include' });

    window.location.href = '../index.html';
}
