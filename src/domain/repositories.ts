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
  User,
} from "@/domain/records";
import type { TimeInterval } from "@/domain/scheduling/recommend-time-block";

// Data access contracts. The domain and the UI depend on these interfaces;
// in-memory and PostgreSQL implementations live outside src/domain/.
// Every call takes the owner's userId so account ownership is checked on every read and write.

export interface Repository<T extends OwnedRecord> {
  list(userId: Id): Promise<T[]>;
  get(userId: Id, id: Id): Promise<T | undefined>;
  save(userId: Id, record: T): Promise<T>;
  remove(userId: Id, id: Id): Promise<void>;
}

export interface UserRepository {
  get(userId: Id): Promise<User | undefined>;
  save(user: User): Promise<User>;
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
