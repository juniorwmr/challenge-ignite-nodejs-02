"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/env/index.ts
var import_dotenv = require("dotenv");
var import_zod = require("zod");
if (process.env.NODE_ENV === "test") {
  (0, import_dotenv.config)({ path: ".env.test" });
} else {
  (0, import_dotenv.config)({ path: ".env" });
}
var envSchema = import_zod.z.object({
  NODE_ENV: import_zod.z.enum(["development", "production", "test"]).default("production"),
  PORT: import_zod.z.number({
    coerce: true
  }).default(3333),
  DATABASE_CLIENT: import_zod.z.enum(["sqlite", "pg"]).default("sqlite"),
  DATABASE_URL: import_zod.z.string()
});
var _env = envSchema.safeParse(process.env);
if (_env.success === false) {
  console.error("\u26A0\uFE0F Invalid environment variables!", _env.error.format());
  throw new Error("\u26A0\uFE0F Invalid environment variables!");
}
var env = _env.data;

// src/app.ts
var import_fastify = __toESM(require("fastify"));
var import_cookie = __toESM(require("@fastify/cookie"));

// src/routes/transactions.ts
var import_crypto = require("crypto");

// src/database.ts
var import_knex = require("knex");
var config2 = {
  client: env.DATABASE_CLIENT,
  connection: env.DATABASE_CLIENT === "sqlite" ? {
    filename: env.DATABASE_URL
  } : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: "ts",
    directory: "./database/migrations"
  }
};
var knex = (0, import_knex.knex)(config2);

// src/middlewares/check-session-id-exists.ts
var checkSessionIdExists = async (request, reply) => {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    reply.status(403).send({
      status: "error",
      data: []
    });
  }
};

// src/routes/transactions.ts
var import_zod2 = require("zod");
var transactionsRoutes = async (app2) => {
  app2.get(
    "/",
    {
      preHandler: [checkSessionIdExists]
    },
    async (request) => {
      const sessionId = request.cookies.sessionId;
      const transactions = await knex("transactions").select("*").where({
        session_id: sessionId
      });
      return {
        status: "success",
        data: transactions ?? []
      };
    }
  );
  app2.get(
    "/:id",
    {
      preHandler: [checkSessionIdExists]
    },
    async (request) => {
      const createTransactionBodySchema = import_zod2.z.object({
        id: import_zod2.z.number({ coerce: true })
      });
      const { id } = createTransactionBodySchema.parse(request.params);
      const sessionId = request.cookies.sessionId;
      const transactions = await knex("transactions").where({
        id,
        session_id: sessionId
      }).first();
      return {
        status: "success",
        data: transactions ?? null
      };
    }
  );
  app2.get("/summary", async (request) => {
    const summary = await knex("transactions").sum("amount", {
      as: "amount"
    }).first();
    return {
      status: "success",
      data: summary
    };
  });
  app2.post("/", async (request, reply) => {
    const createTransactionBodySchema = import_zod2.z.object({
      title: import_zod2.z.string(),
      amount: import_zod2.z.number(),
      type: import_zod2.z.enum(["credit", "debit"])
    });
    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body
    );
    let sessionId = request.cookies.sessionId;
    if (!sessionId) {
      sessionId = (0, import_crypto.randomUUID)();
      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1e3 * 60 * 60 * 24 * 7
        // 7: days
      });
    }
    await knex("transactions").insert({
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId
    });
    reply.status(201).send();
  });
};

// src/app.ts
var app = (0, import_fastify.default)();
app.register(import_cookie.default);
app.register(transactionsRoutes, {
  prefix: "/transactions"
});

// src/server.ts
app.listen({
  port: env.PORT
}).then(() => console.log(`Server is running`));
