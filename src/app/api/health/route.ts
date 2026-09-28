export function GET() {
  return Response.json({
    status: "ok",
    application: "shiftos",
    version: "0.1.0",
  });
}
