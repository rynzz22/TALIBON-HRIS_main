import { Injectable, Logger } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly client: SupabaseClient | null;

  constructor() {
    this.logger.log("Initializing SupabaseService...");
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    this.logger.log(`URL present: ${!!url}, Key present: ${!!key}`);
    if (!url || !key) {
      this.logger.warn("Supabase env missing; running in fallback in-memory mode.");
      this.client = null;
      return;
    }

    try {
      this.client = createClient(url, key);
      this.logger.log("Supabase client initialized successfully.");
    } catch (e: any) {
      this.logger.error(`Failed to initialize Supabase client: ${e.message}`);
      this.client = null;
    }
  }

  getClient() {
    return this.client;
  }
}
