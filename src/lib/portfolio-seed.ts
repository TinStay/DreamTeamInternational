import type { PortfolioRow } from "@/lib/portfolio-videos";

/**
 * The portfolio as the client set it on 06-11-2026: films on Bunny Stream only, the YouTube clips gone. It seeds the table
 * the admin dashboard edits (`supabase/portfolio.sql`, keep the two in step until that has run) and stands in whenever the
 * table cannot be read.
 */
export const PORTFOLIO_SEED: PortfolioRow[] = [
  { source: "bunny", video_id: "c544d68d-3579-4266-b9c7-dee9892b58f4", categories: ["socialAds"], orientation: "tall" }, // PointRN
  { source: "bunny", video_id: "12f1759a-23f3-4d1a-8723-66639b9d348f", categories: ["explainerVideos"], orientation: "wide" }, // IceHeart short
  { source: "bunny", video_id: "af9a43e0-c967-4f93-abc2-df82ca2f494b", categories: ["explainerVideos"], orientation: "wide" }, // IceHeart
  { source: "bunny", video_id: "ca79ed29-dfe0-4594-aa66-769d9701a410", categories: ["tvAds"], orientation: "wide" }, // BuyBest
  { source: "bunny", video_id: "c854ab2f-f388-481c-83d0-5aa73ddfbe67", categories: ["socialAds"], orientation: "wide" }, // Hanstaiger
  { source: "bunny", video_id: "b7bd4d28-a15f-46cc-a82e-800d9d4e3ee9", categories: ["tvAds"], orientation: "wide" }, // Senko
  { source: "bunny", video_id: "bc578b5f-b090-4c3a-bd18-1c1843d43f30", categories: ["tvAds"], orientation: "wide" }, // PS Propulsion
  { source: "bunny", video_id: "3fe879b1-3a7e-4adb-851d-7e6a04da71f9", categories: ["corporate"], orientation: "wide" }, // Version 4
  { source: "bunny", video_id: "c05cd30b-c3a2-4104-a9fd-70856df18c7c", categories: ["socialAds"], orientation: "tall" }, // Raibranch
  { source: "bunny", video_id: "5b06ab4b-b780-4e11-96fe-571b71dfa9aa", categories: ["tvAds"], orientation: "wide" }, // Titanium Wok
  { source: "bunny", video_id: "0adbb91f-8ed4-4f26-a6e3-46efbe51fad2", categories: ["socialAds"], orientation: "tall" }, // Together Local
  { source: "bunny", video_id: "62fdb93f-b714-4a4f-ba64-71b6da6e56a8", categories: ["tvAds"], orientation: "wide" }, // Streetlight Tacos
  { source: "bunny", video_id: "1dd9d4d5-4459-48d5-9891-207b3bb9da5c", categories: ["productVideos", "launchVideos", "tvAds"], orientation: "wide" }, // iSupport
  { source: "bunny", video_id: "973736cf-0b6c-417e-b0fe-45c5e2dfa14b", categories: ["explainerVideos"], orientation: "wide" }, // MindGuard UI/UX
  { source: "bunny", video_id: "067fb3bd-0528-4972-bfba-5e0007f2e7c3", categories: ["corporate"], orientation: "wide" }, // MindGuard, President of Switzerland
  { source: "bunny", video_id: "dbb13635-0fda-4d13-8ff6-1a832cbc54af", categories: ["corporate"], orientation: "wide" }, // MindGuard, Klaus Schwab
  { source: "bunny", video_id: "bfcc7c3b-7b93-4a42-8ee2-5a19e5010d8c", categories: ["socialAds"], orientation: "wide" }, // Package film: social media
  { source: "bunny", video_id: "6f440f38-5b5b-4fd6-8b41-d56688a30ab4", categories: ["corporate"], orientation: "wide" }, // Package film: corporate
  { source: "bunny", video_id: "360b7a78-a7f5-4acf-808f-93f560eca261", categories: ["tvAds"], orientation: "wide" }, // Package film: TV ads
  { source: "bunny", video_id: "b633c834-4cd0-4d14-8207-8fe5a61e3e8a", categories: ["brandMascots"], orientation: "wide" }, // Package film: brand mascot
  { source: "bunny", video_id: "f3940b7f-7cbc-424f-a484-9f689ef13cc6", categories: ["motionGraphics"], orientation: "wide" }, // Package film: motion
  { source: "bunny", video_id: "f7556ae8-ed63-43d5-b11a-4de81b3382f8", categories: ["launchVideos"], orientation: "wide" }, // Package film: launch
  { source: "bunny", video_id: "03a3e5bb-fc72-4dfc-889c-fd1d7756a391", categories: ["ugcAds"], orientation: "wide" }, // Package film: UGC
  { source: "bunny", video_id: "c2a94cde-3bd4-46e8-8520-c58adf837b3c", categories: ["realEstate"], orientation: "wide" }, // ERIA
  { source: "bunny", video_id: "e1561aba-3712-4fbe-a709-f6e3e7adb65b", categories: ["musicVideos"], orientation: "wide" }, // Package film: music
];
