const UndefinedOption = ''

const EventTypes = {
  OPEN_MIC: 'open_mic',
  SHOW: 'show',
  DANCE_SOCIAL: 'dance_social',
  TRIVIA: 'trivia'
}

const EventTypeComboOptions = {
    SHOW: "show",
    OPEN_MIC: "open_mic",
    OPEN_MIC_AND_SHOW: "open_mic_and_show",
    TRIVIA: "trivia",
    DANCE: "dance"
}

const EventTypeComboOptionsToArray = {
  show: [EventTypeComboOptions.SHOW],
  open_mic: [EventTypeComboOptions.OPEN_MIC],
  open_mic_and_show: [EventTypeComboOptions.SHOW, EventTypeComboOptions.OPEN_MIC],
  trivia: [EventTypeComboOptions.TRIVIA],
  dance: [EventTypeComboOptions.DANCE]
}

function eventTypeComboOptionToArray(option) {
  return EventTypeComboOptionsToArray[option]
}

function has(arr, val) {
  return arr.some(x => x === val)
}

function arrayToEventTypeComboOption(arr) {
  if (!arr || !arr.length) throw new Error('Invalid event types array')

  if (has(arr, EventTypes.OPEN_MIC) && has(arr, EventTypes.SHOW) && arr.length === 2) {
    EventTypeComboOptions.OPEN_MIC_AND_SHOW
  } else if(arr.length === 1) {
    return arr[0]
  }

  throw new Error('Invalid event types array')
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

const SetPositionTypes = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
  LAST: -1
}

const ListingTypes = {
  SINGLE: 'single',
  RECURRING: 'recurring'
}

const CategoryTypes = {
  COMEDY: 'comedy',
  MUSIC: 'music',
  SPOKEN_WORD: 'spoken_word',
  STORYTELLING: 'storytelling',
  DANCE: 'dance',
  VARIETY: 'variety'
}

const ComedyTypes = {
  STAND_UP: 'stand_up',
  SKETCH: 'sketch',
  IMPROV: 'improv'
}

const MusicTypes = {
  RHYTHM_AND_BLUES: 'rhythm_and_blues',
  HIP_HOP: 'hip_hop',
  POP: 'pop',
  BLUES: 'blues',
  ALTERNATIVE: 'alternative',
  ROCK: 'rock',
  JAZZ: 'jazz',
  LATIN: 'latin',
  OPERA: 'opera',
  CLASSICAL: 'classical',
  ELECTRONIC: 'electronic',
  DANCE: 'dance',
  COUNTRY: 'country',
  SINGER_SONGWRITER: 'singer_songwriter',
  WORLD: 'world',
  OTHER: 'other'
}

const DanceTypes = {
  CONCERT: 'concert',
  JAZZ: 'jazz',
  SWING: 'swing',
  LATIN: 'latin',
  BALLROOM: 'ballroom',
  STREET: 'street',
  OTHER: 'other'
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

const RecurrenceDisplayFilterOptions = {
    ALL_PAST: "all_past",
    LAST_30_DAYS: "last_30_days",
    NEXT_30_DAYS: "next_30_days",
    ALL_FUTURE: "all_future",
    ALL: "all"
}

export {
  EventTypes, MetaPropertyTypes, EventTypeToProperties,
  DayOfWeek, RecurrenceFrequency, ListingTypes, CategoryTypes,
  PerformerSignupOptions, PreRegistrationOptions, PerformerLimitOptions,
  StageTimeOptions, TierPerkOptions, MinutesTypeOptions, RelativeTimeOptions,
  CostOptions, PurchaseTypeOptions, UndefinedOption, RecurrenceDisplayFilterOptions,
  SetPositionTypes, EventTypeComboOptions, ComedyTypes, MusicTypes, DanceTypes,
  arrayToEventTypeComboOption, eventTypeComboOptionToArray
}
