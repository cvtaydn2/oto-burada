import { performance } from "perf_hooks";

// A mock version of the logic to demonstrate the performance difference

async function mockAdminFromPaymentsSelectSingle() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { plan_id: "plan-1", user_id: "user-1" } });
    }, 10); // simulate 10ms network latency
  });
}

async function mockAdminFromPricingPlansSelectSingle() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: { credits: 100 } });
    }, 10); // simulate 10ms network latency
  });
}

async function mockAdminFromPaymentsSelectIn() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: Array.from({ length: 10 }).map((_, i) => ({ id: `payment-${i}`, plan_id: `plan-${i}`, user_id: `user-${i}` })) });
    }, 10);
  });
}

async function mockAdminFromPricingPlansSelectIn() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: Array.from({ length: 10 }).map((_, i) => ({ id: `plan-${i}`, credits: 100 })) });
    }, 10);
  });
}

async function runBaselineBenchmark() {
  console.log("Running baseline benchmark (N+1 queries)...");

  // 10 jobs as returned by limit: 10
  const jobs = Array.from({ length: 10 }).map((_, i) => ({
    id: `job-${i}`,
    job_type: "credit_add",
    payment_id: `payment-${i}`,
    payment_data: { user_id: `user-${i}` }
  }));

  const start = performance.now();

  for (const job of jobs) {
    if (job.job_type === "credit_add") {
      const paymentRes: any = await mockAdminFromPaymentsSelectSingle();
      const payment = paymentRes.data;

      let credits = 0;
      if (payment?.plan_id) {
        const planRes: any = await mockAdminFromPricingPlansSelectSingle();
        const plan = planRes.data;
        credits = plan?.credits ?? 0;
      }
    }
  }

  const end = performance.now();
  console.log(`Baseline Execution Time: ${(end - start).toFixed(2)} ms`);
}

async function runOptimizedBenchmark() {
  console.log("Running optimized benchmark (Batched queries)...");

  // 10 jobs as returned by limit: 10
  const jobs = Array.from({ length: 10 }).map((_, i) => ({
    id: `job-${i}`,
    job_type: "credit_add",
    payment_id: `payment-${i}`,
    payment_data: { user_id: `user-${i}` }
  }));

  const start = performance.now();

  const creditAddJobs = jobs.filter((job) => job.job_type === "credit_add");
  const paymentIds = Array.from(new Set(creditAddJobs.map((job) => job.payment_id).filter(Boolean)));

  const paymentsMap = new Map<string, { plan_id: string; user_id: string }>();
  const plansMap = new Map<string, { credits: number }>();

  if (paymentIds.length > 0) {
    const paymentRes: any = await mockAdminFromPaymentsSelectIn();
    const payments = paymentRes.data || [];

    payments.forEach((p: any) => {
      paymentsMap.set(p.id, p);
    });

    const planIds = Array.from(new Set(payments.map((p: any) => p.plan_id).filter(Boolean)));
    if (planIds.length > 0) {
      const planRes: any = await mockAdminFromPricingPlansSelectIn();
      const plans = planRes.data || [];

      plans.forEach((p: any) => {
        plansMap.set(p.id, p);
      });
    }
  }

  for (const job of jobs) {
    if (job.job_type === "credit_add") {
      const payment = paymentsMap.get(job.payment_id);

      let credits = 0;
      if (payment?.plan_id) {
        const plan = plansMap.get(payment.plan_id);
        credits = plan?.credits ?? 0;
      }
    }
  }

  const end = performance.now();
  console.log(`Optimized Execution Time: ${(end - start).toFixed(2)} ms`);
}

async function main() {
  await runBaselineBenchmark();
  await runOptimizedBenchmark();
}

main().catch(console.error);
