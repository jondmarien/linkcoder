import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello from chron0 link shortener."));
app.get("/healthz", (c) => c.json({ ok: true }));

export default app;
