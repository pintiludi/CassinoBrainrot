import fs from 'fs';
import path from 'path';
import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MP_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  try {
    const evento = req.body;

    if (
      evento.type === 'payment' &&
      evento.data?.id
    ) {
      const pagamento = await mercadopago.payment.findById(evento.data.id);
      const status = pagamento.response.status;
      const metadata = pagamento.response.metadata;
      const token = metadata?.token;

      if (status === 'approved' && token) {
        const valorPago = pagamento.response.transaction_amount;
        const pontosGanhos = valorPago * 2;

        const filePath = path.join(process.cwd(), 'public', 'jogadores.json');

        let dados = {};
        if (fs.existsSync(filePath)) {
          dados = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        if (!dados[token]) {
          dados[token] = 0;
        }

        dados[token] += pontosGanhos;

        fs.writeFileSync(filePath, JSON.stringify(dados, null, 2));

        return res.status(200).send('Pontos atualizados com sucesso');
      } else {
        return res.status(200).send('Pagamento não aprovado ou token inválido');
      }
    }

    res.status(200).send('Evento ignorado');
  } catch (err) {
    console.error('Erro no webhook:', err);
    res.status(500).send('Erro interno');
  }
}
