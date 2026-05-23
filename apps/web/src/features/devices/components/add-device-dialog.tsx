"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDevice, parseDeviceErrors } from "../hooks/use-devices";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().min(1, "Address is required"),
});

type FormValues = z.infer<typeof schema>;

interface AddDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDeviceDialog({ open, onOpenChange }: AddDeviceDialogProps) {
  const { mutateAsync, isPending } = useCreateDevice();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: standardSchemaResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const url = /^https?:\/\//i.test(values.url) ? values.url : `http://${values.url}`;
    try {
      await mutateAsync({ name: values.name, url });
      reset();
      onOpenChange(false);
    } catch (err) {
      const fieldErrors = parseDeviceErrors(err);
      if (fieldErrors.name) setError("name", { message: fieldErrors.name });
      if (fieldErrors.url) setError("url", { message: fieldErrors.url });
      if (!fieldErrors.name && !fieldErrors.url) {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    setSubmitError(null);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add WLED Device</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center pb-1">
          <img
            src="/wled.png"
            alt="WLED"
            width={120}
            height={45}
            style={{ imageRendering: "pixelated" }}
          />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Device name</Label>
            <Input
              id="name"
              placeholder="Workshop shelf"
              autoComplete="off"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url">IP Address / Hostname</Label>
            <Input
              id="url"
              placeholder="192.168.1.42"
              autoComplete="off"
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must resolve to a reachable WLED instance.
            </p>
          </div>

          {submitError && (
            <p className="text-xs text-destructive">{submitError}</p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {isPending ? "Connecting…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
