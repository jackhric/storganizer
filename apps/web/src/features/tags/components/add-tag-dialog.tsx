"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { randomTagColor } from "@/lib/tags";
import { useCreateTag } from "../hooks/use-tags";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddTagDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(randomTagColor());
  const [error, setError] = useState<string | null>(null);
  const createTag = useCreateTag();

  useEffect(() => {
    if (open) {
      setName("");
      setColor(randomTagColor());
      setError(null);
    }
  }, [open]);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required");
      return;
    }
    try {
      await createTag.mutateAsync({ name: trimmed, color });
      onOpenChange(false);
    } catch {
      setError("A tag with this name already exists.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add tag</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tag-name">Name</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. fasteners"
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tag-color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="tag-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
              />
              <Input
                value={color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v);
                }}
                className="h-8 font-mono text-xs"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={createTag.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createTag.isPending}>
            {createTag.isPending ? "Adding…" : "Add tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
