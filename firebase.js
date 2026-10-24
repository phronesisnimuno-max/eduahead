import OpenAI from "openai";

const client = new OpenAI({ baseURL: "https://api.gizmoplatforms.com/api/v1", apiKey: process.env.GIZMO_API_KEY });

const response = await client.responses.create({
  model: "YOUR_MODEL_ID",
  input: "Write a one-sentence bedtime story about a unicorn.",
});
console.log(response.output_text);