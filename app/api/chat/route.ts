
// // import { openai } from '@ai-sdk/openai';
// import { streamText } from "ai";
// import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
// // Allow streaming responses up to 30 seconds
// export const maxDuration = 30;

// export async function POST(req: Request) {
//   const { messages } = await req.json();
//   console.log("Received messages:", messages);
//   const lmstudio = createOpenAICompatible({
//     name: "lmstudio",
//     baseURL: "http://localhost:1234/v1",
//   });

//   const result = streamText({
//     model: lmstudio("qwen/qwen3-1.7b"),
//     messages,
//     // maxSteps: 4, // Limit the number of steps to 4
//     onError: (error) => {
//       console.error("Error during streaming:", error);
//       throw new Error("An error occurred while processing your request.");
//     },
//   });

//   return result.toDataStreamResponse();
// }

import { createClient } from "@/lib/supabase/server";
import {  NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getRetriever } from "@/lib/retriever";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { messages, data } = await request.json();
    console.log("Received messages:", messages);
    console.log("Received files data:", data);
    const userMessage = messages[messages.length - 1]?.content;
    const files = data?.files || []; // Array of { id, name, url, size }

    if (!userMessage) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

   let context = "";
    const usedDocuments = [];
    if (files.length > 0) {
      for (const file of files) {
        const retriever = await getRetriever(file.id);
        const relevantDocs = await retriever.invoke(userMessage);
        const docContents = relevantDocs.map((doc) => doc.pageContent).join("\n\n");
        context += `Document: ${file.name}\n${docContents}\n\n`;
        usedDocuments.push({ id: file.id, name: file.name });
      }
    }
    // Construct the system prompt with context
    const systemPrompt = `
      You are a helpful assistant. Use the following context from uploaded documents to answer the user's question accurately. If the context doesn't provide enough information, rely on your general knowledge but indicate that the answer is based on general knowledge.

      Context:
      ${context || "No relevant documents provided."}
    `;

    // Combine messages with system prompt
    const augmentedMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Stream the response from the LLM
    const result = await streamText({
      model: openai("gpt-4o"),
      messages: augmentedMessages,
      maxTokens: 1000,
      temperature: 0.7,

      onError: (error) => {
        console.error("Error during streaming:", error);
        throw new Error("An error occurred while processing your request.");
      },
      onFinish: () => {
        console.log("Streaming finished");
      }
    });
    // // Stream the response back to the client
    // const stream = createStreamableValue(result.textStream);
    // return new NextResponse(stream?.value);

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
