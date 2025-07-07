const nodemailer = require("nodemailer");

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,       // your Gmail address
    pass: process.env.EMAIL_PASS   // your Gmail app password
  }
});

// Function to send booking status update email
const sendStatusEmail = async (to, status, booking) => {
  const subject = `Booking ${status}`;
  const html = `
    <h2>Your booking has been ${status}</h2>
    <p>Hello,</p>
    <p>Your booking for <strong>${booking.listing?.title || 'a listing'}</strong> is now <strong>${status}</strong>.</p>
    <ul>
      <li><strong>Check-in:</strong> ${new Date(booking.checkIn).toDateString()}</li>
      <li><strong>Check-out:</strong> ${new Date(booking.checkOut).toDateString()}</li>
      <li><strong>Price:</strong> ₹${booking.price}</li>
    </ul>
    <p>Thank you for using our service!</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Travel Booking" <${process.env.EMAIL}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Status email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err);
  }
};

module.exports = {
  transporter,
  sendStatusEmail
};
