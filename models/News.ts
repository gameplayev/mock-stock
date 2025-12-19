import { Schema, model, models } from "mongoose";

export interface NewsDocument {
  title: string;
  summary: string;
  symbol: string;
  sentiment: "bullish" | "bearish" | "neutral";
  impact: number;
  rateImpact: number;
  source: string;
  timeAgo: string;
}

const NewsSchema = new Schema<NewsDocument>(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    symbol: { type: String, required: true },
    sentiment: { type: String, enum: ["bullish", "bearish", "neutral"], required: true },
    impact: { type: Number, required: true },
    rateImpact: { type: Number, default: 0 },
    source: { type: String, default: "Summit Desk" },
    timeAgo: { type: String, default: "방금 전" },
  },
  { timestamps: true },
);

const News = models.News || model<NewsDocument>("News", NewsSchema);

export default News;
