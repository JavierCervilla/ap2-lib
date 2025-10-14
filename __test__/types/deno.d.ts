declare global {
  // --- W3C Payment Request API Types ---

  interface PaymentCurrencyAmount {
    readonly currency: string;
    readonly value: string;
  }

  interface PaymentItem {
    readonly label: string;
    readonly amount: PaymentCurrencyAmount;
    readonly pending?: boolean;
  }

  interface PaymentShippingOption {
    readonly id: string;
    readonly label: string;
    readonly amount: PaymentCurrencyAmount;
    readonly selected?: boolean;
  }

  interface PaymentDetailsInit {
    readonly total: PaymentItem;
    readonly displayItems?: readonly PaymentItem[];
    readonly shippingOptions?: readonly PaymentShippingOption[];
  }

  interface PaymentMethodData {
    readonly supportedMethods: string;
    readonly data?: Record<string, unknown>;
  }

  interface PaymentOptions {
    readonly requestPayerName?: boolean;
    readonly requestPayerEmail?: boolean;
    readonly requestPayerPhone?: boolean;
    readonly requestShipping?: boolean;
    readonly shippingType?: "shipping" | "delivery" | "pickup";
  }
}


export {};