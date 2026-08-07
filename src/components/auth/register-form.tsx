"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/common/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyServerFieldErrors, isNormalizedApiError } from "@/lib/form-errors";
import {
  registerSchema,
  type RegisterFormValues,
  type RegisterInput,
} from "@/lib/schemas/auth";
import { useRegisterMutation } from "@/store/api/authApi";

const FIELDS = [
  "fullName",
  "email",
  "password",
  "phone",
  "policyNumber",
] as const;

export function RegisterForm() {
  const router = useRouter();
  const [registerCustomer, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      policyNumber: "",
    },
  });

  const onSubmit = async (values: RegisterInput) => {
    try {
      await registerCustomer(values).unwrap();
      // SPEC does not define a response body for register, so nothing here
      // assumes a session was created — sign in explicitly.
      toast.success("Account created. Sign in to continue.");
      router.replace("/login");
    } catch (error) {
      if (!isNormalizedApiError(error)) {
        toast.error("Could not create your account. Please try again.");
        return;
      }
      if (!applyServerFieldErrors(error, setError, FIELDS)) {
        toast.error(error.message);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Chidi Nwosu"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          {...register("fullName")}
        />
      </Field>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
        hint="At least 8 characters, with a letter and a number."
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "password-error" : "password-hint"
          }
          {...register("password")}
        />
      </Field>

      <Field label="Phone" htmlFor="phone" optional error={errors.phone?.message}>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+234 800 000 0000"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          {...register("phone")}
        />
      </Field>

      <Field
        label="Policy number"
        htmlFor="policyNumber"
        optional
        error={errors.policyNumber?.message}
        hint="If you already hold a policy with us."
      >
        <Input
          id="policyNumber"
          placeholder="IGI-POL-0001"
          aria-invalid={Boolean(errors.policyNumber)}
          aria-describedby={
            errors.policyNumber ? "policyNumber-error" : "policyNumber-hint"
          }
          {...register("policyNumber")}
        />
      </Field>

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? (
          <>
            <SpinnerIcon className="animate-spin" />
            Creating account
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
