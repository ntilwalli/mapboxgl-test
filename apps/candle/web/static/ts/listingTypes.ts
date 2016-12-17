const EventTypes = {
  OPEN_MIC: 'open_mic',
  SHOW: 'show'
}

const MetaPropertyTypes = {
  PERFORMER_SIGN_UP: 'performer_sign_up',
  PERFORMER_CHECK_IN: 'performer_check_in',
  PERFORMER_COST: 'performer_cost',
  STAGE_TIME: 'stage_time',
  PERFORMER_LIMIT: 'performer_limit', 
  LISTED_HOSTS: 'listed_hosts',
  NOTES: 'notes', 
  CONTACT_INFO: 'contact_info',
  AUDIENCE_COST: 'audience_cost',
  LISTED_PERFORMERS: 'listed_performers'
}

const EventTypeToProperties = {
  open_mic: [
    MetaPropertyTypes.PERFORMER_SIGN_UP, 
    MetaPropertyTypes.PERFORMER_CHECK_IN,
    MetaPropertyTypes.PERFORMER_COST,
    MetaPropertyTypes.STAGE_TIME,
    MetaPropertyTypes.PERFORMER_LIMIT,
    MetaPropertyTypes.LISTED_HOSTS,
    MetaPropertyTypes.NOTES,
    MetaPropertyTypes.CONTACT_INFO
  ],
  show: [
    MetaPropertyTypes.LISTED_HOSTS,
    MetaPropertyTypes.LISTED_PERFORMERS,
    MetaPropertyTypes.AUDIENCE_COST,
    MetaPropertyTypes.CONTACT_INFO
  ]
}

const DayOfWeek = {
  SUNDAY: 'sunday',
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday'
}

const RecurrenceFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
}

const ListingTypes = {
  SINGLE: 'single',
  RECURRING: 'recurring'
}

const CategoryTypes = {
  COMEDY: 'comedy',
  MUSIC: 'music',
  POETRY: 'poetry',
  STORYTELLING: 'storytelling'
}

const PerformerSignupOptions = {
  IN_PERSON: 'in_person',
  PRE_REGISTRATION: 'pre_registration',
  IN_PERSON_AND_PRE_REGISTRATION: 'in_person_and_pre_registration'
}

const PreRegistrationOptions = {
  APP: 'app',
  EMAIL: 'email',
  WEBSITE: 'website',
}

const PerformerLimitOptions = {
  NO_LIMIT: 'no_limit',
  LIMIT: 'limit',
  LIMIT_BY_SIGN_UP_TYPE: 'limit_by_sign_up_type'
}

const StageTimeOptions = {
  SEE_NOTE: 'see_note',
  MINUTES: 'minutes',
  SONGS: 'songs',
  MINUTES_OR_SONGS: 'minutes_or_songs'
}

const TierPerkOptions = {
  NO_PERK: 'no_perk',
  ADDITIONAL_MINUTES: 'additional_minutes',
  ADDITIONAL_SONGS: 'additional_songs',
  ADDITIONAL_MINUTES_AND_PRIORITY_ORDER: 'additional_minutes_and_priority_order',
  MINUTES_AND_PRIORITY_ORDER: 'minutes_and_priority_order',
  ADDITIONAL_SONGS_AND_PRIORITY_ORDER: 'additional_songs_and_priority_order',
  SONGS_AND_PRIORITY_ORDER: 'songs_and_priority_order',
  MINUTES: 'minutes',
  SONGS: 'songs',
  PRIORITY_ORDER: 'priority_order',
  ADDITIONAL_BUCKET_ENTRY: 'additional_bucket_entry',
  DRINK_TICKET: "drink_ticket"
}

const MinutesTypeOptions = {
  MAX: 'max',
  RANGE: 'range'
}

const RelativeTimeOptions = {
  UPON_POSTING: 'upon_posting',
  DAYS_BEFORE_EVENT_START: 'days_before_event_start',
  MINUTES_BEFORE_EVENT_START: 'minutes_before_event_start',
  PREVIOUS_WEEKDAY_AT_TIME: 'previous_weekday_at_time',
  EVENT_START: 'event_start',
  MINUTES_AFTER_EVENT_START: 'minutes_after_event_start',
  MINUTES_BEFORE_EVENT_END: 'minutes_before_event_end',
  EVENT_END: 'event_end'
}

const CostOptions = {
  FREE: 'free',
  COVER: 'cover',
  MINIMUM_PURCHASE: 'minimum_purchase',
  COVER_AND_MINIMUM_PURCHASE: 'cover_and_minimum_purchase',
  COVER_OR_MINIMUM_PURCHASE: 'cover_or_minimum_purchase',
  COST_PER_MINUTE: 'cost_per_minute',
  PAID: 'paid',
  SEE_NOTE: 'see_note'
}

const PurchaseTypeOptions = {
  DRINK: 'drink',
  ITEM: 'item',
  DRINK_OR_ITEM: 'drink_or_item',
  DOLLARS: 'dollars'
}

export {
  EventTypes, MetaPropertyTypes, EventTypeToProperties,
  DayOfWeek, RecurrenceFrequency, ListingTypes, CategoryTypes,
  PerformerSignupOptions, PreRegistrationOptions, PerformerLimitOptions,
  StageTimeOptions, TierPerkOptions, MinutesTypeOptions, RelativeTimeOptions,
  CostOptions, PurchaseTypeOptions
}
