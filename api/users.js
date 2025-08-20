// api/users.js
import { getDb, withCors } from "./_db.js";

export default async function handler(req, res) {
  withCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const db = await getDb();
    const col = db.collection("users");

    if (req.method === "POST") {
      const {
        nombre,
        cedula,
        discapacidad,
        porcentaje,
        edad,
        nacimiento,
        lugarNacimiento,
        ingreso
      } = req.body || {};

      if (!nombre || !cedula) {
        return res.status(400).json({ message: "Nombre y cédula son obligatorios." });
      }

      const exists = await col.findOne({ cedula });
      if (exists) return res.status(409).json({ message: "La cédula ya está registrada." });

      const doc = {
        nombre: String(nombre).trim(),
        cedula: String(cedula).trim(),
        discapacidad: discapacidad ?? "",
        porcentaje: porcentaje != null ? Number(porcentaje) : null,
        edad: edad != null ? Number(edad) : null,
        nacimiento: nacimiento ? new Date(nacimiento) : null,
        lugarNacimiento: lugarNacimiento ?? "",
        ingreso: ingreso ? new Date(ingreso) : null,
        createdAt: new Date()
      };

      const r = await col.insertOne(doc);
      return res.status(201).json({ _id: r.insertedId, ...doc });
    }

    if (req.method === "GET") {
      // /api/users?count=1 -> contador
      if (req.query.count === "1") {
        const count = await col.countDocuments();
        return res.json({ count });
      }
      // listado corto (para pruebas)
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
