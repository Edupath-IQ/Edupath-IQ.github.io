/*
  EduPath IQ — Razorpay Checkout helper
  Set WORKER_BASE_URL to your deployed Cloudflare Worker URL before publishing.
  Never put the Razorpay secret key here.
*/
(() => {
 const WORKER_BASE_URL = "https://edupath-iq-payments.avikeshsaini6.workers.dev";

  function loadRazorpay() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Unable to load Razorpay Checkout'));
      document.head.appendChild(script);
    });
  }

  async function buy(button) {
    const productId = button.dataset.productId;
    if (!productId) throw new Error('Missing product ID');

    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = 'Opening payment…';

    try {
      await loadRazorpay();
      const response = await fetch(`${WORKER_BASE_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      const order = await response.json();
      if (!response.ok) throw new Error(order.error || 'Unable to create order');

      const checkout = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'EduPath IQ',
        description: order.productName,
        order_id: order.orderId,
        theme: { color: '#2454d6' },
        handler: async (payment) => {
          const verifyResponse = await fetch(`${WORKER_BASE_URL}/api/verify-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payment)
          });
          const verified = await verifyResponse.json();
          if (!verifyResponse.ok || !verified.success) {
            alert('Payment was received, but verification could not be completed automatically. Please contact EduPath IQ support with your Razorpay payment ID.');
            return;
          }
          window.location.href = verified.downloadUrl;
        },
        modal: { ondismiss: () => { button.disabled = false; button.textContent = oldText; } }
      });

      checkout.on('payment.failed', () => {
        button.disabled = false;
        button.textContent = oldText;
      });
      checkout.open();
    } catch (error) {
      button.disabled = false;
      button.textContent = oldText;
      alert(error.message || 'Unable to start payment.');
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.razorpay-buy');
    if (!button) return;
    event.preventDefault();
    buy(button);
  });
})();
