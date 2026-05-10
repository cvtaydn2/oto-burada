"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { getPaymentDetailsAction, retrieveCheckoutResultAction } from "@/app/api/payments/actions";
import { PaymentCardContent } from "@/features/payments/components/payment-card-content";
import { PaymentProcessing } from "@/features/payments/components/payment-processing";
import { type PaymentResultStatus } from "@/features/payments/lib/payment-constants";
import { captureClientException } from "@/lib/telemetry-client";

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const isPartialSuccess = initialStatus === "partial_success";
  const messageParam = searchParams.get("message") || "";

  const [loading, setLoading] = useState(!isPartialSuccess);
  const [status, setStatus] = useState<PaymentResultStatus>(
    () => (isPartialSuccess ? "partial_success" : "pending") as PaymentResultStatus
  );
  const [paymentData, setPaymentData] = useState<{
    id: string;
    amount: number;
    status: string;
    plan_name: string | null;
    fulfilled_at: string | null;
  } | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestInFlightRef = useRef(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (status === "partial_success") {
      return;
    }

    let cancelled = false;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;

    async function verifyPayment() {
      if (!token) {
        if (!cancelled) {
          setStatus("invalid");
          setLoading(false);
        }
        return;
      }

      let attempts = 0;
      const maxAttempts = 5;

      const poll = async () => {
        if (cancelled) return;
        if (requestInFlightRef.current) return;

        requestInFlightRef.current = true;
        try {
          await retrieveCheckoutResultAction(token);
          const data = await getPaymentDetailsAction(token);

          if (cancelled) return;

          if (data) {
            setPaymentData(data);

            if (data.status === "success") {
              if (data.fulfilled_at) {
                setStatus("success");
                setLoading(false);
                router.refresh();
                return;
              }
              setStatus("pending");
            } else if (data.status === "failure" || data.status === "cancelled") {
              setStatus("failure");
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          if (cancelled) return;
          captureClientException(error, "payment_result_verification_query", { token });
          setStatus("verification_error");
          setLoading(false);
          return;
        } finally {
          requestInFlightRef.current = false;
        }

        if (attempts < maxAttempts) {
          attempts++;
          const delay = Math.min(1500 * Math.pow(1.5, attempts - 1), 10000);
          pollTimeout = setTimeout(() => {
            void poll();
          }, delay);
          return;
        }

        setStatus("unverified");
        setLoading(false);
      };

      void poll();
    }

    void verifyPayment();

    return () => {
      cancelled = true;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [token, router, retryNonce, status]);

  const retryVerification = () => {
    if (requestInFlightRef.current) {
      return;
    }
    setPaymentData(null);
    setStatus("pending");
    setLoading(true);
    setRetryNonce((current) => current + 1);
  };

  if (loading) {
    return <PaymentProcessing />;
  }

  return (
    <PaymentCardContent
      status={status}
      messageParam={messageParam}
      paymentData={paymentData}
      retryVerification={retryVerification}
      loading={loading}
    />
  );
}

export function PaymentResultClientPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
