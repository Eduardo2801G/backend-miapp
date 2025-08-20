import clientPromise from "./_db";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("miapp"); // nombre de la base
    const users = db.collection("users");

    if (req.method === "POST") {
      const { nombre, apellido, cedula } = req.body;
      const result = await users.insertOne({ nombre, apellido, cedula });
      return res.status(201).json({ ok: true, id: result.insertedId });
    }

    if (req.method === "GET") {
      const all = await users.find().toArray();
      return res.status(200).json(all);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end("Method Not Allowed");
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
