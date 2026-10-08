import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a file to a private Storage bucket as the signed-in user, reporting progress (0-1) as it goes - `supabase-js`'s
 * own `upload` has no progress, and a finished film can be hundreds of MB. Row level security on `storage.objects`
 * decides who may write where (supabase/team.sql, supabase/delivery.sql). Resolves on success, rejects with an Error.
 */
export async function uploadWithProgress(bucket: string, path: string, file: File, onProgress?: (fraction: number) => void): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("not_signed_in");

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  const url = `${base}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload_failed_${xhr.status}`)));
    xhr.onerror = () => reject(new Error("upload_failed"));
    xhr.send(file);
  });
}

/** A short-lived link to a private object (`download` names the saved file and makes the browser save it). */
export async function signedUrl(bucket: string, path: string, seconds: number, download?: string): Promise<string | null> {
  const { data, error } = await createClient().storage.from(bucket).createSignedUrl(path, seconds, download ? { download } : undefined);
  return error || !data?.signedUrl ? null : data.signedUrl;
}

/** Saves a private object through a two-minute signed link. Returns false when the link could not be made. */
export async function downloadPrivate(bucket: string, path: string, name: string): Promise<boolean> {
  const href = await signedUrl(bucket, path, 120, name);
  if (!href) return false;
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.rel = "noopener";
  a.click();
  return true;
}

/** A Storage-safe file name: keeps the extension, drops anything that would need escaping. */
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = (dot > 0 ? name.slice(0, dot) : name).normalize("NFKD").replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const ext = dot > 0 ? name.slice(dot + 1).replace(/[^\w]/g, "").toLowerCase() : "";
  return `${stem || "file"}${ext ? `.${ext}` : ""}`;
}
