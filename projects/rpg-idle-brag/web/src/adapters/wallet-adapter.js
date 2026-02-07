const CURRENCY_KEY_BY_TYPE = {
  soft: "soft",
  premium: "premium",
};

function normalizeAmount(amount) {
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.floor(amount));
}

export function createWalletState(initialBalances = { soft: 0, premium: 0 }) {
  return {
    balances: {
      soft: normalizeAmount(initialBalances.soft),
      premium: normalizeAmount(initialBalances.premium),
    },
    ledger: [],
    nextTransactionId: 1,
  };
}

function appendLedger(wallet, type, amount, currency, reason, referenceId, playerId) {
  const entry = {
    id: wallet.nextTransactionId,
    type,
    amount,
    currency,
    reason,
    referenceId,
    playerId,
  };
  return {
    ...wallet,
    ledger: [...wallet.ledger, entry],
    nextTransactionId: wallet.nextTransactionId + 1,
  };
}

export function credit(wallet, playerId, amount, currency, reason, referenceId = "") {
  const key = CURRENCY_KEY_BY_TYPE[currency];
  if (!key) {
    return {
      ok: false,
      wallet,
      error: "unsupported_currency",
      transactionId: null,
    };
  }
  const normalizedAmount = normalizeAmount(amount);
  const nextWallet = appendLedger(wallet, "credit", normalizedAmount, currency, reason, referenceId, playerId);
  return {
    ok: true,
    wallet: {
      ...nextWallet,
      balances: {
        ...nextWallet.balances,
        [key]: nextWallet.balances[key] + normalizedAmount,
      },
    },
    error: null,
    transactionId: nextWallet.nextTransactionId - 1,
  };
}

export function debit(wallet, playerId, amount, currency, reason, referenceId = "") {
  const key = CURRENCY_KEY_BY_TYPE[currency];
  if (!key) {
    return {
      ok: false,
      wallet,
      error: "unsupported_currency",
      transactionId: null,
    };
  }
  const normalizedAmount = normalizeAmount(amount);
  const balance = wallet.balances[key];
  if (balance < normalizedAmount) {
    return {
      ok: false,
      wallet,
      error: "insufficient_funds",
      transactionId: null,
    };
  }

  const nextWallet = appendLedger(wallet, "debit", normalizedAmount, currency, reason, referenceId, playerId);
  return {
    ok: true,
    wallet: {
      ...nextWallet,
      balances: {
        ...nextWallet.balances,
        [key]: nextWallet.balances[key] - normalizedAmount,
      },
    },
    error: null,
    transactionId: nextWallet.nextTransactionId - 1,
  };
}

export function getBalance(wallet) {
  return {
    soft: wallet.balances.soft,
    premium: wallet.balances.premium,
  };
}
