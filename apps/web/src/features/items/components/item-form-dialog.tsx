"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import Image from "next/image";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { pb } from "@/lib/api/client";
import { useCreateItem, useUpdateItem } from "../hooks/use-items";
import type { ExternalLink, ItemsTyped } from "@/types/items";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  store_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemsTyped;
}

export function ItemFormDialog({ open, onOpenChange, item }: Props) {
  const isEdit = !!item;
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<ExternalLink[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: standardSchemaResolver(schema) });

  useEffect(() => {
    if (open) {
      if (item) {
        reset({
          name: item.name,
          store_url: item.store_url ?? "",
          notes: item.notes ?? "",
        });
        setTags(Array.isArray(item.tags) ? item.tags : []);
        setLinks(Array.isArray(item.external_links) ? item.external_links : []);
        setImagePreview(
          item.image ? pb.files.getURL(item, item.image, { thumb: "400x400" }) : null
        );
      } else {
        reset({ name: "", store_url: "", notes: "" });
        setTags([]);
        setLinks([]);
        setImagePreview(null);
      }
      setImageFile(null);
      setTagInput("");
      setSubmitError(null);
    }
  }, [open, item, reset]);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function addLink() {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  }

  function updateLink(i: number, field: keyof ExternalLink, value: string) {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const validLinks = links.filter((l) => l.label.trim() && l.url.trim());
    const payload = new FormData();
    payload.append("name", values.name);
    if (values.store_url) payload.append("store_url", values.store_url);
    if (values.notes) payload.append("notes", values.notes);
    payload.append("tags", JSON.stringify(tags));
    payload.append("external_links", JSON.stringify(validLinks));
    if (imageFile) payload.append("image", imageFile);

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: item.id, data: payload as never });
      } else {
        await createMutation.mutateAsync(payload as never);
      }
      onOpenChange(false);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      setImageFile(null);
      setImagePreview(null);
    }
    setSubmitError(null);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="M3 hex bolts" autoComplete="off" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <Label>Image</Label>
            <div className="flex items-center gap-3">
              {imagePreview && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? "Change image" : "Upload image"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          {/* Store URL */}
          <div className="space-y-1.5">
            <Label htmlFor="store_url">Store link</Label>
            <Input
              id="store_url"
              placeholder="https://amazon.com/..."
              autoComplete="off"
              {...register("store_url")}
            />
            {errors.store_url && (
              <p className="text-xs text-destructive">{errors.store_url.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any extra details…"
              rows={3}
              className="resize-none"
              {...register("notes")}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="fastener, metric…"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 rounded-sm hover:text-destructive"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* External links */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>External links</Label>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addLink}>
                <PlusIcon className="h-3 w-3" />
                Add link
              </Button>
            </div>
            {links.length > 0 && (
              <div className="space-y-2">
                {links.map((link, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={link.label}
                      onChange={(e) => updateLink(i, "label", e.target.value)}
                      placeholder="Label"
                      className="w-28 shrink-0"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => updateLink(i, "url", e.target.value)}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeLink(i)}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitError && <p className="text-xs text-destructive">{submitError}</p>}

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
