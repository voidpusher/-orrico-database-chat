import { pathToFileURL } from "node:url";
import { app } from "./app.js";
const port = Number(process.env.PORT || 4000);

const currentModuleUrl = pathToFileURL(process.argv[1] || "").href;

if (import.meta.url === currentModuleUrl) {
  app.listen(port, () => {
    console.log(`Orrico API listening on http://localhost:${port}`);
  });
}
