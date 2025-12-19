const { getTarifa } = require('../services/Andreani');

(async () => {
  try {
    const tarifa = await getTarifa({
      contrato: process.env.ANDREANI_CONTRACT_DOM || '400006709',
      payload: {
        peso: 1,
        volumen: 0.5,
        cpOrigen: '4000',
        cpDestino: '1000'
      }
    });
    console.log('Tarifa Andreani:', tarifa);
  } catch (err) {
    console.error('Error tarifa:', err.message);
  }
})();

