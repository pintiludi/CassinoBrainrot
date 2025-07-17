import fs from 'fs';
import mercadopago from 'mercadopago';
import path from 'path';

mercadopago.configure({ access_token: process.env.MP_TOKEN });

const pontosPorReal = 2;
const dbPath = path.resolve('jogadores.json');

function carregarDB() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } catch {
    return {};
  }
}
function salvarDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const data = req.body;
  if (data.type === "payment") {
    try {
      const id = data.data.id;
      const pagamento = await mercadopago.payment.findById(id);
      const status = pagamento.body.status;
      if (status === "approved") {
        const valor = pagamento.body.transaction_amount;
        const token = pagamento.body.metadata?.token;
        if (token) {
          const db = carregarDB();
          db[token] = (db[token] || 0) + valor * pontosPorReal;
          salvarDB(db);
          console.log(`✅ Token ${token} recebeu ${valor * pontosPorReal} pontos.`);
        }
      }
    } catch (e) {
      console.error("Erro no webhook:", e.message);
    }
  }
  res.sendStatus(200);
}
