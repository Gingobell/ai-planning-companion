import type {
  FixedCommitment,
  Goal,
  Id,
  Message,
  OpenQuestion,
  OwnedRecord,
  Preference,
  ProgressReport,
  Reminder,
  Task,
  TemporaryContext,
  TimeBlock,
  TimeInterval,
  User,
} from "@/domain/records";

// Data access contracts. The domain and the UI depend on these interfaces;
// in-memory and PostgreSQL implementations live outside src/domain/.
// Every call takes the owner's userId so account ownership is checked on every read and write.

// save stores the record only if its version matches the stored one (0 for a new record),
// then increments it. A mismatch returns the newer stored record instead of overwriting it.
// not-found: an update whose record no longer exists for this user, such as one deleted
// meanwhile or an id owned by another user, whose record must not be returned.
export type SaveResult<T> = { kind: "saved"; record: T } | { kind: "conflict"; current: T } | { kind: "not-found" };

export interface Repository<T extends OwnedRecord> {
  list(userId: Id): Promise<T[]>;
  get(userId: Id, id: Id): Promise<T | undefined>;
  save(userId: Id, record: T): Promise<SaveResult<T>>;
  remove(userId: Id, id: Id): Promise<void>;
}

export interface UserRepository {
  get(userId: Id): Promise<User | undefined>;
  save(user: User): Promise<SaveResult<User>>;
}

export interface TaskRepository extends Repository<Task> {
  listByGoal(userId: Id, goalId: Id): Promise<Task[]>;
}

export interface TimeBlockRepository extends Repository<TimeBlock> {
  listOverlapping(userId: Id, range: TimeInterval): Promise<TimeBlock[]>;
}

export interface FixedCommitmentRepository extends Repository<FixedCommitment> {
  listOverlapping(userId: Id, range: TimeInterval): Promise<FixedCommitment[]>;
}

export interface ReminderRepository extends Repository<Reminder> {
  listDue(userId: Id, at: string): Promise<Reminder[]>;
}

export interface MessageRepository extends Repository<Message> {
  listByChatDate(userId: Id, chatDate: string): Promise<Message[]>;
}

// Server-only access for the reminder job, which needs due reminders across all users.
// Kept out of Repositories so chat, pages and assistant actions cannot read other users' data.
export interface DueReminderSource {
  listDueForAllUsers(at: string): Promise<Reminder[]>;
}

export interface Repositories {
  users: UserRepository;
  goals: Repository<Goal>;
  tasks: TaskRepository;
  timeBlocks: TimeBlockRepository;
  fixedCommitments: FixedCommitmentRepository;
  preferences: Repository<Preference>;
  temporaryContexts: Repository<TemporaryContext>;
  reminders: ReminderRepository;
  messages: MessageRepository;
  openQuestions: Repository<OpenQuestion>;
  progressReports: Repository<ProgressReport>;
}
