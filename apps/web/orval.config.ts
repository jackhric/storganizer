import { defineConfig } from "orval";

export default defineConfig({
  storganizer: {
    input: "http://localhost:8090/openapi.json",
    output: {
      target: "./src/lib/api/generated",
      client: "react-query",
      httpClient: "fetch",
      mode: "tags",
      clean: true,
      override: {
        // Custom fetch wrapper handles base URL, JSON serialization, error mapping.
        mutator: {
          path: "./src/lib/api/mutator.ts",
          name: "customFetch",
        },
        // Return data directly instead of { data, status, headers }.
        fetch: {
          includeHttpResponseReturnType: false,
        },
        query: {
          signal: false,
        },
      },
    },
  },
});
