const PRODUCT_CATALOG = {
  starter_pack: {
    id: "starter_pack",
    priceUsd: 4.99,
    grantsPremiumCurrency: 120,
    grantsEntitlement: "starter_pack",
    grantsSkin: "royal-neon",
    type: "non_consumable",
  },
};

export function createPaymentState() {
  return {
    purchases: [],
    entitlements: {},
  };
}

export function getProductCatalog() {
  return PRODUCT_CATALOG;
}

export function startCheckout(paymentState, productId, context = {}) {
  const product = PRODUCT_CATALOG[productId];
  if (!product) {
    return {
      checkoutResult: "failed",
      paymentState,
      entitlementChange: null,
      purchase: null,
      error: "unknown_product",
      context,
    };
  }

  if (product.type === "non_consumable" && paymentState.entitlements[product.grantsEntitlement]) {
    return {
      checkoutResult: "cancelled",
      paymentState,
      entitlementChange: null,
      purchase: null,
      error: "already_owned",
      context,
    };
  }

  const purchase = {
    productId,
    platform: context.platform ?? "web",
    playerId: context.playerId ?? "unknown",
    locale: context.locale ?? "ko-KR",
    status: "completed",
  };

  const nextPaymentState = {
    purchases: [...paymentState.purchases, purchase],
    entitlements: {
      ...paymentState.entitlements,
      [product.grantsEntitlement]: true,
    },
  };

  return {
    checkoutResult: "completed",
    paymentState: nextPaymentState,
    entitlementChange: {
      entitlement: product.grantsEntitlement,
      value: true,
    },
    purchase,
    error: null,
    context,
  };
}

export function restorePurchases(paymentState) {
  return {
    paymentState,
    restored: [...paymentState.purchases],
  };
}

export function getEntitlements(paymentState) {
  return { ...paymentState.entitlements };
}
