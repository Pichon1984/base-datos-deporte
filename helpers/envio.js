function calcularCostoEnvio(subtotal) {
  const ENVIO_BASE = 30000;
  const LIMITE_ENVIO_GRATIS = 200000;

  if (subtotal >= LIMITE_ENVIO_GRATIS) {
    return 0;
  }

  const descuento = (subtotal / LIMITE_ENVIO_GRATIS) * ENVIO_BASE;
  return Math.max(ENVIO_BASE - descuento, 0);
}

module.exports = { calcularCostoEnvio };
