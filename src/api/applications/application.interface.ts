export interface ICreateApplication {
  jobId: string;
  candidateId: string;
  recruiterId: string;
  coverLetter: string;
}

export interface IApplication {
  id: number;
  jobId: string;
  candidateId: string;
  recruiterId: string;
  coverLetter: string;
  createdAt: string;
}