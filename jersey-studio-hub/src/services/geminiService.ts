export async function generateDeliveryEmail(orderDetails: {
  orderId: string;
  itemTitle: string;
  price: number;
  userName: string;
  itemType: string;
  customization?: any;
}) {
  try {
    const response = await fetch('/api/generate-delivery-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderDetails }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.text) {
      return data.text;
    }
    throw new Error(data.error || 'Empty or invalid response from server');
  } catch (error) {
    console.warn("Generating delivery plan via server failed, using high-end fallback protocol:", error);
    return `
# Your Uncle Tee Delivery Plan

Hi ${orderDetails.userName},

Thank you for your order (${orderDetails.orderId}) of ${orderDetails.itemTitle}.

We are currently preparing your ${orderDetails.itemType} for delivery. You will receive further updates shortly.

Best regards,
The Uncle Tee Team
    `;
  }
}
