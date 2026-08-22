import queueManager from "../queues";
import { IApplication } from "../../api/applications/application.interface";

class NotificationProducer {
  public async addJob(data: IApplication): Promise<void> {
    try {
      await queueManager.notificationQueue.add(
        "send-notification",
        data,
         {
          jobId: `notification-${data.id}`,
        }
      );
    } catch (error) {
      throw error;
    }
  }
}

export default new NotificationProducer();