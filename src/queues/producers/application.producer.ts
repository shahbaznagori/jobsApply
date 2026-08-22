import notificationProducer from "./notification.producer";
import statsProducer from "./stats.producer";
import auditProducer from "./audit.producer";
import { IApplication } from "../../api/applications/application.interface";

class ApplicationProducer {
  public async dispatchApplicationJobs(
    application: IApplication
  ): Promise<void> {
    try {
      await Promise.all([
        notificationProducer.addJob(application),
        statsProducer.addJob(application),
        auditProducer.addJob(application),
      ]);
    } catch (error) {
      throw error;
    }
  }
}

export default new ApplicationProducer();