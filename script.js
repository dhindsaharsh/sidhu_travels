document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('bookingForm');
  const statusBox = document.getElementById('bookingStatus');

  if (!form) return;

  const showStatus = (message, type) => {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.className = 'booking-status is-visible';
    statusBox.classList.add(type === 'error' ? 'is-error' : type === 'success' ? 'is-success' : 'is-info');
  };

  const buildWhatsAppText = (booking) => {
    const text = [
      'Hello Sidhu Travels 👋',
      '',
      '🚗 New Booking Request',
      '👤 Name: ' + booking.name,
      '📞 Phone: ' + booking.phone,
      '📋 Booking Type: ' + booking.bookingType,
      '🚘 Preferred Car: ' + booking.car,
      '📍 Pickup: ' + booking.pickup,
      '🏁 Destination: ' + booking.destination,
      '📅 Date: ' + booking.date,
      '⏰ Time: ' + booking.time,
      booking.message ? '📝 Message: ' + booking.message : '',
      '',
      '✅ Please confirm this booking.'
    ].filter(Boolean).join('\n');

    return 'https://wa.me/919653655800?text=' + encodeURIComponent(text);
  };

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const booking = {
      name: document.getElementById('name')?.value?.trim() || '',
      phone: document.getElementById('phone')?.value?.trim() || '',
      bookingType: document.getElementById('bookingType')?.value || 'Car Booking',
      car: document.getElementById('car')?.value || 'Not Selected',
      pickup: document.getElementById('pickup')?.value?.trim() || '',
      destination: document.getElementById('destination')?.value?.trim() || '',
      date: document.getElementById('date')?.value || '',
      time: document.getElementById('time')?.value || '',
      message: document.getElementById('message')?.value?.trim() || ''
    };

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    showStatus('Sending your booking to the backend...', 'info');

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(booking)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Booking request failed.');
      }

      showStatus('Booking saved successfully. Opening WhatsApp to confirm your trip details.', 'success');

      const whatsappUrl = buildWhatsAppText(booking);
      const popup = window.open(whatsappUrl, '_blank');

      if (!popup) {
        window.location.href = whatsappUrl;
      }

      form.reset();
    } catch (error) {
      showStatus(error.message || 'Unable to send booking. Please try again or contact by phone.', 'error');

      const fallbackUrl = buildWhatsAppText(booking);
      const popup = window.open(fallbackUrl, '_blank');

      if (!popup) {
        window.location.href = fallbackUrl;
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Booking on WhatsApp';
      }
    }
  });
});
