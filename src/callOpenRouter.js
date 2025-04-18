import fetch from "node-fetch";
import { decryptApiKey } from "./crypto.js";

export async function callOpenRouter(provider, prompt) {
  const apiKey = decryptApiKey(provider.apiKey);
  if (!apiKey) {
    throw new Error("Failed to decrypt API key");
  }

  try {
    const response = await fetch(provider.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: provider.modelName,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: provider?.temperature || 0.4,
        max_tokens: provider?.maxTokens || 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `API error: ${data.error?.message || response.statusText}`,
      );
    }

    if (!data.choices || !Array.isArray(data.choices)) {
      throw new Error("Invalid response format: missing choices array");
    }

    const messageContent = data.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No message content in response");
    }

    try {
      const parsedContent = JSON.parse(messageContent);
      if (!parsedContent.suggestions) {
        throw new Error("Response JSON missing suggestions property");
      }

      // Return the suggestions array as a JavaScript array
      return parsedContent.suggestions;
    } catch (e) {
      // If JSON parsing fails, return the raw content with a warning
      console.warn("Failed to parse JSON response, returning raw content");
      return messageContent;
    }
  } catch (error) {
    console.error("OpenAI API Error:", error.message);
    throw new Error(`Failed to generate suggestions: ${error.message}`);
  }
}
