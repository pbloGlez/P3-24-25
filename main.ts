
import { MongoClient, ObjectId } from "mongodb";
import { TaskModel } from "./types.ts";
import { fromModelToTask } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");

if (!MONGO_URL) {
  console.error("MONGO_URL is not set");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.info("Connected to MongoDB");

const db = client.db("P3-ListaCompra");
const usersCollection = db.collection<TaskModel>("users");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method; 
  const url = new URL(req.url); 
  const path = url.pathname; 

  if (method === "GET") {
    if (path === "/tasks") {
      const name = url.searchParams.get("title"); 
      const query = name ? { name } : {}; 
      const usersDB = await usersCollection.find(query).toArray(); 

      const users = await Promise.all(
        usersDB.map((user) => fromModelToTask(user)),
      );
      return new Response(JSON.stringify(users));
    } else if (path.startsWith("/tasks/")) {
      const idPath = path.split("/")[2];
  
      const userDB = await usersCollection.findOne({ _id : new ObjectId(idPath) });
      if (!userDB) {
        return new Response(
          JSON.stringify({ error: "Persona no encontrada" }),
          { status: 404});
      }
      const user = await fromModelToTask(userDB);
      return new Response(JSON.stringify(user));
    }
  } else if (method === "POST") {
    if (path.startsWith("/tasks")) {
      const data = await req.json(); 
      const { title } = data;
      const completed = false;

      if (!title) {
        return new Response(
          JSON.stringify({
            error: "Title is required",}),
          { status: 400 });
      } 

      const insertResult = await usersCollection.insertOne({
        title,
        completed,
      });
      console.log(insertResult);

      const insertedTask = await usersCollection.findOne({
        _id : insertResult.insertedId,
      });

      const response = {
        message: "Tarea creada exitosamente",
        tarea: await fromModelToTask(insertedTask!),
      };

      return new Response(JSON.stringify(response), {status: 201});
    }
  } else if (method === "PUT") {
    if (path.startsWith("/tasks/")) {
      const idPath = path.split("/")[2];
      const data = await req.json(); 
      const { completed } = data; 
      //Aqui puedo cambir la validación rollo si son Undefined
      if (!completed) {
        return new Response(JSON.stringify({ error: "Faltan datos" }), {status: 400});
      }
      const task = await usersCollection.findOne({ _id : new ObjectId(idPath) });
      if (!task) {
        return new Response(
       JSON.stringify({ error: "Tarea no encontrada" }),
         { status: 404 },
        );
      }
      await usersCollection.updateOne(
        { _id : new ObjectId(idPath) },
        { $set: { completed } }
      );

      const updatedTask = await usersCollection.findOne({ _id : new ObjectId(idPath) });
      //Esto es lo que vamos a devolver
      const response = {
        id : updatedTask!._id.toString(),
        title : updatedTask!.title,
        completed : updatedTask!.completed,
      };
      return new Response(JSON.stringify(response));

    }
  } else if (method === "DELETE") {
    if (path.startsWith("/tasks/")) {
      const SPath = path.split("/")[2];

      if (!SPath) {
        return new Response(JSON.stringify({ error: "Id requerido" }), {status: 400});
      }    
      await usersCollection.deleteOne({ _id : new ObjectId(SPath) });

      return new Response(JSON.stringify("Tarea eliminada correctamente"));
    }
  }

  return new Response("Not found", { status: 404 });
};

Deno.serve({ port: 3000 }, handler);