// Helper types and enums used in the schema
export type RejectionReason = { reason: string };

export enum ObjectVersion {
  NEW = 'new',
  OLD = 'old',
}

export enum CorpusReviewStatus {
  RECOMMENDATION = 'recommendation',
  CORPUS = 'corpus',
  REJECTED = 'rejected',
}

// Events
export type CuratedCorpusItemUpdate = {
  trigger:
    | 'reviewed_corpus_item_added' // Item is added to the curated corpus
    | 'reviewed_corpus_item_updated' // Item is updated in the corpus
    | 'reviewed_corpus_item_removed' // Item is removed from the approved corpus
    | 'reviewed_corpus_item_rejected' // Item is added to the rejected corpus
    | 'scheduled_corpus_item_added' // Item is added to the new tab schedule
    | 'scheduled_corpus_item_removed'; // Item is removed from the new tab schedule
};

/**
 * Entity to describe an item that has been reviewed for the Pocket
 * recommendation corpus. Expected (new and old) on all object_update
 * events where object = reviewed_corpus_item.
 */
export type ReviewedCorpusItem = {
  /**
   * Indication of whether the version of the entity is before or after
   * the modifications were made.
   */
  object_version: ObjectVersion;
  /**
   * A guid that identifies the reviewed corpus item’s approved_item_id
   * in backend systems, sometimes referred to as an approved corpus item’s
   * external_id.
   */
  approved_corpus_item_external_id?: string;
  /**
   * A guid that identifies the reviewed corpus item’s rejected_item_id
   * in backend systems, sometimes referred to as a rejected corpus item’s
   * external_id.
   */
  rejected_corpus_item_external_id?: string;
  /**
   * The URL of the reviewed corpus item.
   */
  url: string;
  /**
   * The decision by the curator on the item’s validity for the curated corpus.
   */
  corpus_review_status: CorpusReviewStatus;
  /**
   * The list of reasons a curator rejected the item (if the item has
   * a "rejected" status).
   */
  rejection_reasons?: RejectionReason[];
  /**
   * The title of the reviewed corpus item.
   */
  title?: string;
  /**
   * The excerpt for the reviewed corpus item.
   */
  excerpt?: string;
  /**
   * The url of the main image of the reviewed corpus item.
   */
  image_url?: string;
  /**
   * The language of the reviewed corpus item.
   */
  language?: string;
  /**
   * The topic of the reviewed corpus item.
   */
  topic?: string;
  /**
   * Indicates whether the reviewed corpus item is a collection.
   */
  is_collection?: boolean;
  /**
   * Indicates whether the reviewed corpus item is a syndicated article.
   */
  is_syndicated?: boolean;
  /**
   * Indicates whether the reviewed corpus item is only relevant
   * for a short period of time (e.g. news).
   */
  is_short_lived?: boolean;
  /**
   * The UTC unix timestamp (in seconds) for when the reviewed corpus item
   * was created.
   */
  created_at?: number;
  /**
   * The curator who created the reviewed corpus item.
   */
  created_by?: string;
  /**
   * The UTC unix timestamp (in seconds) for when the reviewed corpus item
   * was last updated.
   */
  updated_at?: number;
  /**
   * The curator who most recently updated the reviewed corpus item.
   */
  updated_by?: string;
};

/**
 * A scheduled run in the new tab of a reviewed corpus item.
 */
export type ScheduledCorpusItem = {
  /**
   * Indication of whether the version of the entity is before or after
   * the modifications were made.
   */
  object_version: ObjectVersion;
  /**
   * A guid that identifies the new tab feed schedule, sometimes referred to
   * as the new tab feed schedule's external_id.
   */
  scheduled_corpus_item_external_id: string;
  /**
   * The UTC Unix timestamp (in seconds) for when the reviewed corpus item
   * is scheduled to run. Items are scheduled for a particular day, not exact
   * time, so this is a Unix timestamp with the actual date
   * and a time component of 00:00.
   */
  scheduled_at: number;
  /**
   * The URL of the approved corpus item.
   * This will help link the scheduled item back to the approved curated item.
   */
  url: string;
  /**
   * A guid that identifies the reviewed corpus item’s approved_item_id
   * in backend systems, sometimes referred to as an approved corpus item’s
   * external_id.
   *
   * This will help link the scheduled item back to the approved curated item.
   */
  approved_corpus_item_external_id: string;
  /**
   * A guid that identifies the new tab, e.g. 'EN_US'.
   */
  new_tab_id: string;
  /**
   * The name of the new tab feed.
   */
  new_tab_name?: string;
  /**
   * The time that the new tab feed is offset from UTC time.
   */
  new_tab_feed_utc_offset?: string;
  /**
   * The UTC unix timestamp (in seconds) for when the new tab feed schedule
   * was created.
   */
  created_at?: number;
  /**
   * The curator who created the new tab feed schedule.
   */
  created_by?: string;
  /**
   * The UTC unix timestamp (in seconds) for when the new tab feed schedule
   * was last updated.
   */
  updated_at?: number;
  /**
   * The curator who most recently updated the new tab feed schedule.
   */
  updated_by?: string;
};
