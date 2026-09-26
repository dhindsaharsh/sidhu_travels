module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.'
    });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    const required = [
      'name',
      'phone',
      'bookingType',
      'pickup',
      'destination',
      'date',
      'time'
    ];

    const missingField = required.find(
      (field) => !String(body[field] || '').trim()
    );

    if (missingField) {
      return res.status(400).json({
        success: false,
        message: `Please enter a valid ${missingField}.`
      });
    }

    // The website sends the same booking details to WhatsApp immediately
    // after this successful response. Vercel's serverless filesystem is not
    // persistent, so this function intentionally does not write bookings.json.
    return res.status(200).json({
      success: true,
      message: 'Booking request received successfully.'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Unable to submit booking.'
    });
  }
};
