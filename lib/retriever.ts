// lib/retriever.ts
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import pineconeClient from "./pinecone";
import { indexName } from "./embedding";

export async function getRetriever(docId: string) {
  const embeddingModel = new OpenAIEmbeddings({
    model: "text-embedding-ada-002",
    apiKey: process.env.OPENAI_API_KEY,
  });

  const index = await pineconeClient.index(indexName);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddingModel, {
    pineconeIndex: index,
    namespace: docId,
  });

  // Create a retriever with configurable parameters
  return vectorStore.asRetriever({
    k: 4, // Number of relevant documents to retrieve
    searchType: "similarity", // Use similarity search
  });
}