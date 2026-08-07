"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyServerFieldErrors, isNormalizedApiError } from "@/lib/form-errors";
import { homeForRole } from "@/lib/routes";
import {
  loginSchema,
  type LoginFormValues,
  type LoginInput,
} from "@/lib/schemas/auth";
import { useLoginMutation } from "@/store/api/authApi";

const FIELDS = ["email", "password"] as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      const session = await login(values).unwrap();
      toast.success(`Welcome back, ${session.user.fullName}`);
      // `next` is set by proxy.ts / the reauth redirect; fall back to the
      // role's home.
      router.replace(
        searchParams.get("next") ?? homeForRole(session.user.role)
      );
    } catch (error) {
      if (!isNormalizedApiError(error)) {
        toast.error("Could not sign in. Please try again.");
        return;
      }
      if (!applyServerFieldErrors(error, setError, FIELDS)) {
        toast.error(error.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="officer@igi.test"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
      </Field>

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? (
          <>
            <SpinnerIcon className="animate-spin" />
            Signing in
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Register as a customer
        </Link>
      </p>
    </form>
  );
}
