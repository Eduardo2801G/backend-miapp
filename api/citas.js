// api/citas.js
import { getDb, withCors } from "./_db.js";

export default async function handler(req, res) {
  withCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const db = await getDb();
    const col = db.collection("citas");

    if (req.method === "POST") {
      const { usuarioCedula, fecha, motivo } = req.body || {};
      if (!usuarioCedula || !fecha) {
        return res.status(400).json({ message: "usuarioCedula y fecha son obligatorios." });
      }
      const doc = {
        usuarioCedula: String(usuarioCedula).trim(),
        fecha: new Date(fecha),
        motivo: motivo ?? "",
        createdAt: new Date()
      };
      const r = await col.insertOne(doc);
      return res.status(201).json({ _id: r.insertedId, ...doc });
    }

    if (req.method === "GET") {
      // /api/citas?count=1
      if (req.query.count === "1") {
        const count = await col.countDocuments();
        return res.json({ count });
      }

      // /api/citas?stats=daily&days=8  -> para tu "statistics chart"
      if (req.query.stats === "daily") {
        const days = Math.max(1, Math.min(31, Number(req.query.days) || 8));
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);

        const pipeline = [
          { $match: { fecha: { $gte: start, $lte: today } } },
          {
            $group: {
              _id: {
                y: { $year: "$fecha" },
                m: { $month: "$fecha" },
                d: { $dayOfMonth: "$fecha" }
              },
              total: { $sum: 1 }
            }
          },
          { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } }
        ];

        const agg = await col.aggregate(pipeline).toArray();

        // Normaliza a arreglo continuo de días con cero donde no hay datos
        const map = new Map();
        agg.forEach(({ _id, total }) => {
          const key = `${_id.y}-${String(_id.m).padStart(2, "0")}-${String(_id.d).padStart(2, "0")}`;
          map.set(key, total);
        });

        const labels = [];
        const data = [];
        for (let i = 0; i < days; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          labels.push(key);                     // yyyy-mm-dd
          data.push(map.get(key) || 0);
        }

        return res.json({ labels, data });
      }

      // listado corto por defecto
      const docs = await col.find().project({ _id: 0 }).limit(50).toArray();
      return res.json(docs);
    }

    res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
    return res.status(405).end("Method Not Allowed");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error del servidor." });
  }
}
