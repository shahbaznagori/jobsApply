import queueManager from "../queues";
import { IApplication } from "../../api/applications/application.interface";

class AuditProducer {
  public async addJob(data: IApplication): Promise<void> {
    try {
      await queueManager.auditQueue.add(
        "write-audit-log",
        data,
          {
          jobId: `audit-${data.id}`,
        }
      );
    } catch (error) {
      throw error;
    }
  }
}

export default new AuditProducer();