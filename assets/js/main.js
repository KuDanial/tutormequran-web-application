/**
 * TutorMeQuran Frontend Application JavaScript
 * Handle UI animations, dynamic role selection, file uploads, and mock client-side flow.
 */

document.addEventListener('DOMContentLoaded', function () {
  
  // ==========================================
  // Mock Tutor Database
  // ==========================================
  const tutorsDb = {
    "1": {
      name: "Ustazah Fatimah Al-Zahra",
      title: "Tajweed & Recitation Specialist",
      gender: "female",
      rate: 40,
      classType: "online",
      rating: "4.9",
      reviewsCount: 42,
      experience: "5+ Years",
      location: "Online Only (Skype, Google Meet)",
      education: "Degree in Quranic Studies, Al-Azhar University",
      bio: "Graduate from Al-Azhar University. Specializing in teaching Tajweed rules for female students and kids. Passionate about correct pronunciation (makharij) and helping beginners build confidence in reading the Holy Quran.",
      slots: [
        { id: "s101", day: "Monday", time: "09:00 AM - 10:30 AM", status: "booked" },
        { id: "s102", day: "Monday", time: "02:00 PM - 03:30 PM", status: "vacant" },
        { id: "s103", day: "Wednesday", time: "10:00 AM - 11:30 AM", status: "vacant" },
        { id: "s104", day: "Wednesday", time: "04:00 PM - 05:30 PM", status: "booked" },
        { id: "s105", day: "Friday", time: "09:00 AM - 10:30 AM", status: "vacant" }
      ]
    },
    "2": {
      name: "Ustaz Ahmad Shukri",
      title: "Hifz Memorization Coach",
      gender: "male",
      rate: 25,
      classType: "physical",
      rating: "4.8",
      reviewsCount: 18,
      experience: "3 - 5 Years",
      location: "KL, Selangor (Physical Home Tuition)",
      education: "Diploma in Tahfiz Al-Quran, Darul Quran JAKIM",
      bio: "Experienced Huffaz tutor. Focuses on structured memorization techniques (tasmee') and revision cycles for primary and secondary school children. Dedicated to helping students memorize Quran with proper rules.",
      slots: [
        { id: "s201", day: "Tuesday", time: "03:00 PM - 04:30 PM", status: "vacant" },
        { id: "s202", day: "Tuesday", time: "08:00 PM - 09:30 PM", status: "booked" },
        { id: "s203", day: "Thursday", time: "03:00 PM - 04:30 PM", status: "vacant" },
        { id: "s204", day: "Saturday", time: "10:00 AM - 11:30 AM", status: "vacant" }
      ]
    },
    "3": {
      name: "Ustaz Dr. Lukman Hakim",
      title: "Qiraat & Advanced Tajweed",
      gender: "male",
      rate: 60,
      classType: "both",
      rating: "5.0",
      reviewsCount: 31,
      experience: "5+ Years",
      location: "Online & Physical (Selangor area)",
      education: "Ph.D. in Islamic Studies, USIM",
      bio: "Ph.D. in Islamic Studies (USIM). Licensed in 10 Qira'at. Teaches advanced Tajweed scripts, Quranic grammar (Nahu/Saraf), and vocal modulation (tarannum) for advanced reciters and future imams.",
      slots: [
        { id: "s301", day: "Saturday", time: "09:00 AM - 10:30 AM", status: "booked" },
        { id: "s302", day: "Saturday", time: "02:00 PM - 03:30 PM", status: "vacant" },
        { id: "s303", day: "Sunday", time: "09:00 AM - 10:30 AM", status: "vacant" },
        { id: "s304", day: "Sunday", time: "04:00 PM - 05:30 PM", status: "booked" }
      ]
    },
    "4": {
      name: "Ustazah Sarah Yusuf",
      title: "Kids Quran Recitation & Tajweed",
      gender: "female",
      rate: 28,
      classType: "online",
      rating: "4.7",
      reviewsCount: 24,
      experience: "1 - 3 Years",
      location: "Online Only (Zoom, Google Meet)",
      education: "Degree in Quranic Education, KUIS",
      bio: "Specialized in child education. Employs visual stories, phonetic guides, and light recitation games to make Quran learning fun, engaging, and memorable for young children (ages 5 to 12).",
      slots: [
        { id: "s401", day: "Monday", time: "04:00 PM - 05:30 PM", status: "vacant" },
        { id: "s402", day: "Wednesday", time: "04:00 PM - 05:30 PM", status: "vacant" },
        { id: "s403", day: "Friday", time: "04:00 PM - 05:30 PM", status: "booked" },
        { id: "s404", day: "Saturday", time: "02:00 PM - 03:30 PM", status: "vacant" }
      ]
    }
  };

  // ==========================================
  // 1. Sticky Navbar Scroll Effect
  // ==========================================
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // ==========================================
  // 2. Mobile Navigation Toggle
  // ==========================================
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('active');
      
      // Transform hamburger to X
      const spans = menuToggle.querySelectorAll('span');
      if (mobileNav.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', function (e) {
      if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target) && mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }

  // ==========================================
  // 3. Login Role Selection Toggle (login.html)
  // ==========================================
  const loginSegments = document.querySelectorAll('#login-role-selector .segment-btn');
  const loginRoleInput = document.getElementById('login-role');

  if (loginSegments && loginSegments.length > 0) {
    loginSegments.forEach(button => {
      button.addEventListener('click', function () {
        // Remove active class from all buttons
        loginSegments.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update hidden input value
        const selectedRole = this.getAttribute('data-role');
        if (loginRoleInput) {
          loginRoleInput.value = selectedRole;
        }

        // Visual adjustment or placeholders based on role
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
          if (selectedRole === 'admin') {
            usernameInput.placeholder = 'Enter Admin ID or Email';
          } else if (selectedRole === 'tutor') {
            usernameInput.placeholder = 'Enter Tutor Username or Email';
          } else {
            usernameInput.placeholder = 'Enter Student Username or Email';
          }
        }
      });
    });
  }

  // ==========================================
  // 4. Registration Role Toggle (register.html)
  // ==========================================
  const registerSegments = document.querySelectorAll('#register-role-selector .segment-btn');
  const registerRoleInput = document.getElementById('register-role');
  const tutorSection = document.getElementById('tutor-credentials-section');

  if (registerSegments && registerSegments.length > 0) {
    registerSegments.forEach(button => {
      button.addEventListener('click', function () {
        // Toggle active segment styling
        registerSegments.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        const selectedRole = this.getAttribute('data-role');
        if (registerRoleInput) {
          registerRoleInput.value = selectedRole;
        }

        // Show/Hide Tutor section (specifically FR8 file upload & details)
        if (selectedRole === 'tutor') {
          tutorSection.classList.add('show');
          setTutorFieldsRequired(true);
        } else {
          tutorSection.classList.remove('show');
          setTutorFieldsRequired(false);
        }
      });
    });
  }

  function setTutorFieldsRequired(required) {
    const ijazahInput = document.getElementById('ijazah-upload');
    const rateInput = document.getElementById('hourly-rate');
    
    if (ijazahInput) ijazahInput.required = required;
    if (rateInput) rateInput.required = required;
  }

  // ==========================================
  // 5. Ijazah File Upload Drag-and-Drop (register.html FR8)
  // ==========================================
  const dropzone = document.getElementById('ijazah-dropzone');
  const fileInput = document.getElementById('ijazah-upload');
  const previewContainer = document.getElementById('ijazah-preview-container');
  const previewName = document.getElementById('preview-file-name');
  const previewSize = document.getElementById('preview-file-size');
  const removeBtn = document.getElementById('preview-remove');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', function () {
      fileInput.click();
    });

    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', function () {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files.length > 0) {
        handleFileSelection(fileInput.files[0]);
      }
    });
  }

  function handleFileSelection(file) {
    if (!file) return;

    previewName.textContent = file.name;
    previewSize.textContent = formatBytes(file.size);
    
    if (previewContainer) {
      previewContainer.classList.add('active');
    }
    
    previewContainer.style.animation = 'none';
    setTimeout(() => {
      previewContainer.style.animation = '';
    }, 10);

    showToast('Ijazah certificate selected successfully!', 'success');
  }

  if (removeBtn && fileInput && previewContainer) {
    removeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      fileInput.value = '';
      previewContainer.classList.remove('active');
      showToast('File removed', 'warning');
    });
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // ==========================================
  // 6. Custom Password Eye Toggle
  // ==========================================
  const togglePasses = document.querySelectorAll('.toggle-password');
  if (togglePasses.length > 0) {
    togglePasses.forEach(toggle => {
      toggle.addEventListener('click', function () {
        const passwordField = this.previousElementSibling;
        if (passwordField) {
          if (passwordField.type === 'password') {
            passwordField.type = 'text';
            this.classList.replace('fa-eye-slash', 'fa-eye');
          } else {
            passwordField.type = 'password';
            this.classList.replace('fa-eye', 'fa-eye-slash');
          }
        }
      });
    });
  }

  // ==========================================
  // 7. Toast Notification System
  // ==========================================
  function showToast(message, type = 'success') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'fa-check-circle';
    if (type === 'danger') iconClass = 'fa-times-circle';
    if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    if (type === 'info') iconClass = 'fa-info-circle';

    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas ${iconClass} toast-icon"></i>
        <span class="toast-message">${message}</span>
      </div>
      <i class="fas fa-times toast-close"></i>
    `;

    toastContainer.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  }

  window.showToast = showToast;

  // ==========================================
  // 8. Form Submission Handlers (Mock)
  // ==========================================
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const role = document.getElementById('login-role').value;
      const username = document.getElementById('username').value;
      
      if (!username) {
        showToast('Please fill in username/email', 'danger');
        return;
      }

      showToast(`Logging in as ${role.toUpperCase()}...`, 'success');
      setTimeout(() => {
        showToast('Login successful! Redirecting to dashboard...', 'success');
        setTimeout(() => {
          if (role === 'admin') {
            window.location.href = '#admin-dashboard';
          } else if (role === 'tutor') {
            window.location.href = '#tutor-dashboard';
          } else {
            window.location.href = '#student-dashboard';
          }
        }, 1000);
      }, 1500);
    });
  }

  const registerForm = document.getElementById('registration-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const role = document.getElementById('register-role').value;
      const fname = document.getElementById('fname').value;
      const lname = document.getElementById('lname').value;
      const icnum = document.getElementById('icnum').value;
      const email = document.getElementById('email').value;
      
      if (!fname || !lname || !icnum || !email) {
        showToast('Please complete all required fields.', 'danger');
        return;
      }

      const icRegex = /^\d{6}-\d{2}-\d{4}$/;
      if (!icRegex.test(icnum)) {
        showToast('Invalid IC Number format. Use XXXXXX-XX-XXXX', 'warning');
        return;
      }

      if (role === 'tutor') {
        const ijazahFile = document.getElementById('ijazah-upload').files[0];
        if (!ijazahFile) {
          showToast('Tutors must upload an Ijazah Certificate for verification.', 'danger');
          return;
        }
      }

      showToast('Registering account...', 'info');
      setTimeout(() => {
        showToast('Registration complete! Welcome to TutorMeQuran.', 'success');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      }, 2000);
    });
  }

  // ==========================================
  // 9. Search & Filter Functionality (FR4)
  // ==========================================
  const searchForm = document.getElementById('search-form');
  
  function filterTutors() {
    const rateInput = document.getElementById('filter-rate');
    const genderInput = document.getElementById('filter-gender');
    const classTypeInput = document.getElementById('filter-class-type');
    const keywordInput = document.getElementById('search-keyword');

    const rate = rateInput ? rateInput.value : '';
    const gender = genderInput ? genderInput.value : '';
    const classType = classTypeInput ? classTypeInput.value : '';
    const searchKeyword = keywordInput ? keywordInput.value : '';

    const tutorCards = document.querySelectorAll('.tutor-grid .tutor-card');
    let matches = 0;

    tutorCards.forEach(card => {
      const name = card.querySelector('.tutor-card-name').textContent.toLowerCase();
      const subjects = card.querySelector('.tutor-card-title').textContent.toLowerCase();
      const genderAttr = card.getAttribute('data-gender');
      const rateAttr = parseInt(card.getAttribute('data-rate'));
      const classTypeAttr = card.getAttribute('data-class-type');

      let matchKeyword = !searchKeyword || name.includes(searchKeyword.toLowerCase()) || subjects.includes(searchKeyword.toLowerCase());
      let matchGender = !gender || genderAttr === gender;
      let matchClassType = !classType || classTypeAttr === classType || classTypeAttr === 'both';
      
      let matchRate = true;
      if (rate) {
        if (rate === 'under-30') matchRate = rateAttr < 30;
        else if (rate === '30-50') matchRate = rateAttr >= 30 && rateAttr <= 50;
        else if (rate === 'over-50') matchRate = rateAttr > 50;
      }

      if (matchKeyword && matchGender && matchClassType && matchRate) {
        card.parentElement.style.display = 'block';
        matches++;
      } else {
        card.parentElement.style.display = 'none';
      }
    });

    return matches;
  }

  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      const isLandingPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || !window.location.pathname.includes('.html');
      
      if (isLandingPage) {
        e.preventDefault();
        const rate = document.getElementById('filter-rate').value;
        const gender = document.getElementById('filter-gender').value;
        const classType = document.getElementById('filter-class-type').value;
        const searchKeyword = document.getElementById('search-keyword').value;
        
        const queryParams = new URLSearchParams();
        if (rate) queryParams.set('rate', rate);
        if (gender) queryParams.set('gender', gender);
        if (classType) queryParams.set('class_type', classType);
        if (searchKeyword) queryParams.set('search', searchKeyword);
        
        showToast('Redirecting to tutor listings...', 'info');
        setTimeout(() => {
          window.location.href = 'tutors.html?' + queryParams.toString();
        }, 300);
      } else {
        e.preventDefault();
        showToast('Searching tutors matching selected criteria...', 'info');
        const matches = filterTutors();
        setTimeout(() => {
          showToast(`Found ${matches} certified tutors matching your filters!`, 'success');
        }, 300);
      }
    });
  }

  const isTutorsPage = window.location.pathname.endsWith('tutors.html');
  if (isTutorsPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramSearch = urlParams.get('search');
    const paramRate = urlParams.get('rate');
    const paramClassType = urlParams.get('class_type');
    const paramGender = urlParams.get('gender');

    let triggered = false;

    if (paramSearch) {
      const el = document.getElementById('search-keyword');
      if (el) { el.value = paramSearch; triggered = true; }
    }
    if (paramRate) {
      const el = document.getElementById('filter-rate');
      if (el) { el.value = paramRate; triggered = true; }
    }
    if (paramClassType) {
      const el = document.getElementById('filter-class-type');
      if (el) { el.value = paramClassType; triggered = true; }
    }
    if (paramGender) {
      const el = document.getElementById('filter-gender');
      if (el) { el.value = paramGender; triggered = true; }
    }

    if (triggered) {
      const matches = filterTutors();
      setTimeout(() => {
        showToast(`Filtered listings: Found ${matches} certified tutors!`, 'success');
      }, 500);
    }
  }

  // ==========================================
  // 10. Dynamic Tutor Detail & Scheduling Loader (tutor-detail.html)
  // ==========================================
  const isDetailPage = window.location.pathname.endsWith('tutor-detail.html');
  if (isDetailPage) {
    const urlParams = new URLSearchParams(window.location.search);
    const tutorId = urlParams.get('id') || "1"; // Default to Fatimah if no ID
    const tutor = tutorsDb[tutorId];

    if (tutor) {
      // 1. Populate Text Elements
      document.getElementById('det-name').textContent = tutor.name;
      document.getElementById('det-title').textContent = tutor.title;
      document.getElementById('det-rate').textContent = `RM ${tutor.rate}`;
      document.getElementById('det-rating').textContent = `${tutor.rating} (${tutor.reviewsCount} reviews)`;
      document.getElementById('det-location').textContent = tutor.location;
      document.getElementById('det-experience').textContent = tutor.experience;
      document.getElementById('det-education').textContent = tutor.education;
      document.getElementById('det-bio').textContent = tutor.bio;

      // Class Type Options Setup in form
      const bookingTypeSelect = document.getElementById('booking-class-type');
      if (bookingTypeSelect) {
        bookingTypeSelect.innerHTML = '';
        if (tutor.classType === 'online' || tutor.classType === 'both') {
          bookingTypeSelect.add(new Option('Online (Google Meet)', 'online'));
        }
        if (tutor.classType === 'physical' || tutor.classType === 'both') {
          bookingTypeSelect.add(new Option('Physical Home Tuition', 'physical'));
        }
      }

      // 2. Render Slots Calendar Widget
      const slotsContainer = document.getElementById('slots-grid');
      if (slotsContainer) {
        slotsContainer.innerHTML = ''; // clear preview

        tutor.slots.forEach(slot => {
          const slotBtn = document.createElement('button');
          slotBtn.type = 'button';
          slotBtn.className = 'slot-btn';
          slotBtn.setAttribute('data-slot-id', slot.id);
          slotBtn.setAttribute('data-slot-day', slot.day);
          slotBtn.setAttribute('data-slot-time', slot.time);

          if (slot.status === 'booked') {
            slotBtn.classList.add('booked');
            slotBtn.disabled = true;
            slotBtn.innerHTML = `
              <div class="slot-day">${slot.day}</div>
              <div class="slot-time">${slot.time}</div>
              <div class="slot-status-badge"><i class="fas fa-lock"></i> Booked</div>
            `;
          } else {
            slotBtn.innerHTML = `
              <div class="slot-day">${slot.day}</div>
              <div class="slot-time">${slot.time}</div>
              <div class="slot-status-badge vacant"><i class="fas fa-calendar-plus"></i> Available</div>
            `;
            
            // Add click selector handler
            slotBtn.addEventListener('click', function () {
              // Unselect previously selected slots
              document.querySelectorAll('.slot-btn.selected').forEach(btn => {
                btn.classList.remove('selected');
              });
              
              // Select current
              this.classList.add('selected');
              
              // Update Booking Form Summary
              const selectedDate = document.getElementById('sum-date');
              const selectedTime = document.getElementById('sum-time');
              const selectedCost = document.getElementById('sum-cost');
              const hiddenSlotIdInput = document.getElementById('booking-slot-id');
              const bookingSummary = document.getElementById('booking-summary-box');

              if (selectedDate) selectedDate.textContent = slot.day;
              if (selectedTime) selectedTime.textContent = slot.time;
              if (selectedCost) selectedCost.textContent = `RM ${tutor.rate}`;
              if (hiddenSlotIdInput) hiddenSlotIdInput.value = slot.id;

              if (bookingSummary) {
                bookingSummary.classList.add('active');
                bookingSummary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            });
          }

          slotsContainer.appendChild(slotBtn);
        });
      }

      // 3. Handle Booking Submission (Mock preventing double bookings)
      const bookingForm = document.getElementById('tutor-booking-form');
      if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
          e.preventDefault();
          
          const slotId = document.getElementById('booking-slot-id').value;
          const classType = document.getElementById('booking-class-type').value;

          if (!slotId) {
            showToast('Please select an available slot from the calendar.', 'danger');
            return;
          }

          showToast('Processing payment and booking slot...', 'info');

          setTimeout(() => {
            showToast('Payment successful! Booking confirmed.', 'success');
            
            // Prevents double bookings: Dynamically convert slot to "Booked" locally
            const selectedSlotBtn = document.querySelector(`.slot-btn[data-slot-id="${slotId}"]`);
            if (selectedSlotBtn) {
              selectedSlotBtn.classList.remove('selected');
              selectedSlotBtn.classList.add('booked');
              selectedSlotBtn.disabled = true;
              
              const day = selectedSlotBtn.getAttribute('data-slot-day');
              const time = selectedSlotBtn.getAttribute('data-slot-time');
              
              selectedSlotBtn.innerHTML = `
                <div class="slot-day">${day}</div>
                <div class="slot-time">${time}</div>
                <div class="slot-status-badge"><i class="fas fa-lock"></i> Booked</div>
              `;
            }

            // Hide summary box and reset form
            const bookingSummary = document.getElementById('booking-summary-box');
            if (bookingSummary) {
              bookingSummary.classList.remove('active');
            }
            bookingForm.reset();
            
            // Mark slot as booked in db object
            const targetSlot = tutor.slots.find(s => s.id === slotId);
            if (targetSlot) targetSlot.status = 'booked';

            setTimeout(() => {
              showToast('Slot has been locked. Overlap protection is active.', 'info');
            }, 1000);

          }, 1800);

        });
      }

    } else {
      // Fallback
      showToast('Tutor profile not found.', 'danger');
    }
  }

});
