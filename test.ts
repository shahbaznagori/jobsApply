const requestsss = async () => {
  const requests = Array.from({ length: 20 }, (_, i) =>
    fetch("http://localhost:5000/weapplyjobs/api/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobId: `job-${i + 41}`,
        candidateId: `candidate-${i + 41}`,
        recruiterId: "recruiter-1",
        coverLetter: `Test application ${i + 41}`,
      }),
    })
  );

  const responses = await Promise.all(requests);

  console.log(`Completed ${responses.length} requests`);

  for (const response of responses) {
    console.log("STATUS:", response.status);
    console.log("CONTENT TYPE:", response.headers.get("content-type"));

    const body = await response.text();

    console.log("RESPONSE:", body);
  }
};

requestsss();