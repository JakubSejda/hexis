import {
  mysqlTable,
  varchar,
  int,
  smallint,
  tinyint,
  decimal,
  text,
  timestamp,
  date,
  boolean,
  json,
  mysqlEnum,
  primaryKey,
  index,
  unique,
} from 'drizzle-orm/mysql-core'

// ═══════════════════════════════════════════════════════════════════
// USERS + ACCOUNTS (auth — plné využití až v M1)
// ═══════════════════════════════════════════════════════════════════

export const users = mysqlTable('users', {
  id: varchar('id', { length: 26 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 100 }),
  level: tinyint('level').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = mysqlTable(
  'accounts',
  {
    userId: varchar('user_id', { length: 26 }).notNull(),
    type: varchar('type', { length: 32 }).notNull(),
    provider: varchar('provider', { length: 32 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: int('expires_at'),
    tokenType: varchar('token_type', { length: 32 }),
    scope: varchar('scope', { length: 255 }),
    idToken: text('id_token'),
    sessionState: varchar('session_state', { length: 255 }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
    byUser: index('idx_accounts_user').on(t.userId),
  })
)

// ═══════════════════════════════════════════════════════════════════
// EXERCISE CATALOG
// ═══════════════════════════════════════════════════════════════════

export const muscleGroups = mysqlTable('muscle_groups', {
  id: smallint('id').primaryKey().autoincrement(),
  slug: varchar('slug', { length: 32 }).notNull().unique(),
  name: varchar('name', { length: 64 }).notNull(),
})

export const exercises = mysqlTable(
  'exercises',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }),
    name: varchar('name', { length: 128 }).notNull(),
    type: mysqlEnum('type', ['barbell', 'db', 'cable', 'machine', 'bodyweight', 'smith']).notNull(),
    videoUrl: varchar('video_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserName: index('idx_exercises_user_name').on(t.userId, t.name),
  })
)

export const exerciseMuscleGroups = mysqlTable(
  'exercise_muscle_groups',
  {
    exerciseId: int('exercise_id').notNull(),
    muscleGroupId: smallint('muscle_group_id').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.exerciseId, t.muscleGroupId] }),
  })
)

// ═══════════════════════════════════════════════════════════════════
// PLANS
// ═══════════════════════════════════════════════════════════════════

export const plans = mysqlTable('plans', {
  id: int('id').primaryKey().autoincrement(),
  userId: varchar('user_id', { length: 26 }).notNull(),
  name: varchar('name', { length: 32 }).notNull(),
  slug: varchar('slug', { length: 16 }).notNull(),
  order: tinyint('order').notNull(),
})

export const planExercises = mysqlTable(
  'plan_exercises',
  {
    id: int('id').primaryKey().autoincrement(),
    planId: int('plan_id').notNull(),
    exerciseId: int('exercise_id').notNull(),
    order: tinyint('order').notNull(),
    targetSets: tinyint('target_sets').notNull(),
    repMin: tinyint('rep_min').notNull(),
    repMax: tinyint('rep_max').notNull(),
    restSec: smallint('rest_sec').notNull(),
  },
  (t) => ({
    byPlan: index('idx_plan_exercises_plan').on(t.planId, t.order),
  })
)

// ═══════════════════════════════════════════════════════════════════
// SESSIONS + SETS
// ═══════════════════════════════════════════════════════════════════

export const sessions = mysqlTable(
  'sessions',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    planId: int('plan_id'),
    startedAt: timestamp('started_at').notNull(),
    finishedAt: timestamp('finished_at'),
    note: text('note'),
  },
  (t) => ({
    byUserStarted: index('idx_sessions_user_started').on(t.userId, t.startedAt),
    byUserFinished: index('idx_sessions_user_finished').on(t.userId, t.finishedAt),
  })
)

export const sessionSets = mysqlTable(
  'session_sets',
  {
    id: int('id').primaryKey().autoincrement(),
    sessionId: int('session_id').notNull(),
    exerciseId: int('exercise_id').notNull(),
    setIndex: tinyint('set_index').notNull(),
    weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
    reps: tinyint('reps'),
    rpe: tinyint('rpe'),
    completedAt: timestamp('completed_at').defaultNow(),
  },
  (t) => ({
    bySession: index('idx_session_sets_session').on(t.sessionId),
    byExercise: index('idx_session_sets_exercise_completed').on(t.exerciseId, t.completedAt),
  })
)

// ═══════════════════════════════════════════════════════════════════
// MEASUREMENTS
// ═══════════════════════════════════════════════════════════════════

export const measurements = mysqlTable(
  'measurements',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    weekStart: date('week_start').notNull(),
    weightKg: decimal('weight_kg', { precision: 5, scale: 2 }),
    waistCm: decimal('waist_cm', { precision: 4, scale: 1 }),
    chestCm: decimal('chest_cm', { precision: 4, scale: 1 }),
    thighCm: decimal('thigh_cm', { precision: 4, scale: 1 }),
    bicepsCm: decimal('biceps_cm', { precision: 4, scale: 1 }),
    targetKcal: smallint('target_kcal'),
    note: text('note'),
  },
  (t) => ({
    uniq: unique('uniq_user_week').on(t.userId, t.weekStart),
  })
)

// ═══════════════════════════════════════════════════════════════════
// NUTRITION
// ═══════════════════════════════════════════════════════════════════

export const nutritionDays = mysqlTable(
  'nutrition_days',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    date: date('date').notNull(),
    kcalActual: smallint('kcal_actual'),
    proteinG: smallint('protein_g'),
    note: text('note'),
  },
  (t) => ({
    uniq: unique('uniq_user_date').on(t.userId, t.date),
  })
)

// ═══════════════════════════════════════════════════════════════════
// BODY PHOTOS
// ═══════════════════════════════════════════════════════════════════

export const bodyPhotos = mysqlTable(
  'body_photos',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    takenAt: date('taken_at').notNull(),
    weekStart: date('week_start'),
    pose: mysqlEnum('pose', ['front', 'side', 'back', 'other']).notNull(),
    storageKey: varchar('storage_key', { length: 255 }).notNull(),
    widthPx: smallint('width_px'),
    heightPx: smallint('height_px'),
    byteSize: int('byte_size'),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserDate: index('idx_body_photos_user_date').on(t.userId, t.takenAt),
  })
)

// ═══════════════════════════════════════════════════════════════════
// XP EVENTS
// ═══════════════════════════════════════════════════════════════════

export const xpEvents = mysqlTable(
  'xp_events',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    eventType: mysqlEnum('event_type', [
      'session_complete',
      'set_logged',
      'measurement_added',
      'photo_uploaded',
      'nutrition_logged',
      'pr_achieved',
      'streak_day',
    ]).notNull(),
    xpDelta: smallint('xp_delta').notNull(),
    sessionId: int('session_id'),
    meta: json('meta'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserCreated: index('idx_xp_events_user_created').on(t.userId, t.createdAt),
  })
)

// ═══════════════════════════════════════════════════════════════════
// PLATE INVENTORY (per-user equipment config)
// ═══════════════════════════════════════════════════════════════════

export const plateInventories = mysqlTable('plate_inventories', {
  userId: varchar('user_id', { length: 26 }).primaryKey(),
  barKg: decimal('bar_kg', { precision: 4, scale: 1 }).default('20').notNull(),
  plates: json('plates').$type<{ weightKg: number; pairs: number }[]>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})
