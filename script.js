document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('bookingForm');

  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('name')?.value?.trim() || '';
    const phone = document.getElementById('phone')?.value?.trim() || '';
    const bookingType = document.getElementById('bookingType')?.value || 'Car Booking';
    const car = document.getElementById('car')?.value || 'Not Selected';
    const pickup = document.getElementById('pickup')?.value?.trim() || '';
    const destination = document.getElementById('destination')?.value?.trim() || '';
    const date = document.getElementById('date')?.value || '';
    const time = document.getElementById('time')?.value || '';
    const message = document.getElementById('message')?.value?.trim() || '';

    const text = [
      'Hello Sidhu Travels 👋',
      '',
      '🚗 New Booking Request',
      '👤 Name: ' + name,
      '📞 Phone: ' + phone,
      '📋 Booking Type: ' + bookingType,
      '🚘 Preferred Car: ' + car,
      '📍 Pickup: ' + pickup,
      '🏁 Destination: ' + destination,
      '📅 Date: ' + date,
      '⏰ Time: ' + time,
      message ? '📝 Message: ' + message : '',
      '',
      '✅ Please confirm this booking.'
    ].filter(Boolean).join('\n');

    const whatsappUrl = 'https://wa.me/919653655800?text=' + encodeURIComponent(text);
    window.open(whatsappUrl, '_blank');
  });
});
