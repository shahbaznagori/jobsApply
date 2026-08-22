import db from "../../common/config/db";
import {
  IApplication,
  ICreateApplication,
} from "./application.interface";

class ApplicationModel {
  constructor() {
    this.createTable();
  }

  private createTable(): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL,
        candidate_id TEXT NOT NULL,
        recruiter_id TEXT NOT NULL,
        cover_letter TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(candidate_id, job_id)

      )
    `);
  }

  public create(
    application: ICreateApplication
  ): IApplication {
    const statement = db.prepare(`
      INSERT INTO applications (
        job_id,
        candidate_id,
        recruiter_id,
        cover_letter
      )
      VALUES (?, ?, ?, ?)
    `);

    const result = statement.run(
      application.jobId,
      application.candidateId,
      application.recruiterId,
      application.coverLetter
    );

    return {
      id: Number(result.lastInsertRowid),
      ...application,
      createdAt: new Date().toISOString(),
    };
  }

  public findAll(): IApplication[] {
    const statement = db.prepare(`
      SELECT
        id,
        job_id AS jobId,
        candidate_id AS candidateId,
        recruiter_id AS recruiterId,
        cover_letter AS coverLetter,
        created_at AS createdAt
      FROM applications
      ORDER BY id DESC
    `);

    return statement.all() as IApplication[];
  }
}

export default new ApplicationModel();