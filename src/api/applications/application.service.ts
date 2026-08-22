import applicationModel from "./application.model";
import {
  IApplication,
  ICreateApplication,
} from "./application.interface";
import applicationProducer from "../../queues/producers/application.producer";

class ApplicationService {
  public async createApplication(
    application: ICreateApplication
  ): Promise<IApplication> {
    try {
     const createdApplication =await applicationModel.create(application);
     
      await applicationProducer.dispatchApplicationJobs(
        createdApplication
      );
    return createdApplication;
  

} catch (error) {
  throw error;
}
  }


  public getAllApplications(): IApplication[] {
    try {
      return applicationModel.findAll();
    } catch (error) {
      throw error;
    }
  }

}

export default new ApplicationService();