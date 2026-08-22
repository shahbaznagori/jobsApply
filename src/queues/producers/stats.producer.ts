import queueManager from "../queues";
import { IApplication } from "../../api/applications/application.interface";

class StatsProducer {
  public async addJob(data: IApplication): Promise<void> {
    try {
      await queueManager.statsQueue.add(
        "update-stats",
        data,
          {
          jobId: `stats-${data.id}`,
        }
      );
    } catch (error) {
      throw error;
    }
  }
}

export default new StatsProducer();