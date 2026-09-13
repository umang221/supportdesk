import mongoose from "mongoose";

const knowledgeArticleSchema = new mongoose.Schema(
  {
    // Stable id from the seed source data, used to upsert idempotently
    // instead of relying on title uniqueness.
    legacyId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    excerpt: { type: String, trim: true },
    body: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

knowledgeArticleSchema.index({ category: 1 });
knowledgeArticleSchema.index({ title: "text", excerpt: "text" });

export default mongoose.models.KnowledgeArticle ||
  mongoose.model("KnowledgeArticle", knowledgeArticleSchema);
