import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useProfileStore } from "../store/useProfileStore";
import type { ProfileSettingsValues } from "../lib/profileApi";

type Props = {
  onClose: () => void;
  initialValues?: Partial<ProfileSettingsValues>;
};

const BIO_MAX = 100;
const DRAFT_KEY = "profile_settings_draft_v1";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function onEnterOrSpace(e: React.KeyboardEvent, fn: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
}

function isValidTwitterUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return host === "x.com" || host === "twitter.com";
  } catch {
    return false;
  }
}

function readDraft(): Partial<ProfileSettingsValues> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Partial<ProfileSettingsValues>;
  } catch {
    return null;
  }
}

function writeDraft(draft: Partial<ProfileSettingsValues>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

function resolveInitial(
  profile: ProfileSettingsValues | null,
  fallback?: Partial<ProfileSettingsValues>,
): ProfileSettingsValues {
  const draft = readDraft();
  const source = profile ?? draft ?? fallback ?? {};
  const bio = (source.bio ?? "").slice(0, BIO_MAX);
  return {
    avatarUrl: source.avatarUrl ?? null,
    name: source.name ?? "",
    bio,
    twitterLink: source.twitterLink ?? "",
    streamerMode: Boolean(source.streamerMode ?? false),
  };
}

function ProfileSettingsForm({
  onClose,
  resolved,
}: {
  onClose: () => void;
  resolved: ProfileSettingsValues;
}) {
  const { saveProfile } = useProfileStore();

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(resolved.avatarUrl);
  const [name, setName] = useState(resolved.name);
  const [bio, setBio] = useState(resolved.bio);
  const [twitterLink, setTwitterLink] = useState(resolved.twitterLink);
  const [streamerMode, setStreamerMode] = useState(resolved.streamerMode);
  const [isSaving, setIsSaving] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    bio?: string;
    twitterLink?: string;
  }>({});

  const modalRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      writeDraft({
        avatarUrl: avatarPreviewUrl,
        name,
        bio,
        twitterLink,
        streamerMode,
      });
    }, 150);

    return () => window.clearTimeout(t);
  }, [avatarPreviewUrl, name, bio, twitterLink, streamerMode]);

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name cannot be empty.";
    if (bio.length > BIO_MAX) next.bio = `Bio must be ${BIO_MAX} characters or fewer.`;
    if (!isValidTwitterUrl(twitterLink)) next.twitterLink = "Enter a valid X/Twitter URL.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUploadChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (avatarPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(avatarPreviewUrl);

    const url = URL.createObjectURL(file);
    setAvatarPreviewUrl(url);
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload: ProfileSettingsValues = {
      avatarUrl: avatarPreviewUrl,
      name: name.trim(),
      bio: bio.slice(0, BIO_MAX),
      twitterLink: twitterLink.trim(),
      streamerMode,
    };

    setIsSaving(true);

    const ok = await saveProfile(payload);

    setIsSaving(false);

    if (ok) {
      writeDraft(payload);
      toast.success("Profile settings saved", {
        description: "Your profile has been synced to the server.",
      });
    } else {
      writeDraft(payload);
      toast.error("Could not reach the server", {
        description: "Your changes have been saved locally as a draft.",
      });
    }

    onClose();
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!modalRef.current) return;
    if (!modalRef.current.contains(e.target as Node)) onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999]" onMouseDown={handleBackdropMouseDown}>
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" aria-hidden />

      {/* centered modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-settings-title"
          className={cx(
            "relative w-full max-w-3xl",
            "rounded-2xl bg-white dark:bg-gray-900",
            "border border-gray-100 dark:border-gray-800",
            "shadow-2xl",
            "max-h-[85vh] overflow-hidden"
          )}
        >
          <div className="relative px-6 sm:px-8 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <h2
              id="profile-settings-title"
              className="text-sm font-bold tracking-wide text-gray-800 dark:text-gray-100 pr-12"
            >
              PROFILE SETTINGS
            </h2>

            <button
              type="button"
              aria-label="Close profile settings"
              onClick={onClose}
              className="absolute right-4 top-4 sm:right-6 sm:top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="px-6 sm:px-8 py-6 overflow-y-auto max-h-[calc(85vh-72px)]">
            <div className="flex gap-6 items-center">
              <div className="h-24 w-24 rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                {avatarPreviewUrl ? (
                  <img
                    src={avatarPreviewUrl}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-left">
                    <div className="text-base font-medium leading-tight">Avatar</div>
                    <div className="text-base font-medium leading-tight">preview</div>
                  </div>
                )}
              </div>

              <label
                htmlFor="profile-avatar-upload"
                className="inline-flex cursor-pointer select-none items-center justify-center rounded-xl bg-[#2C4BFD] px-7 py-3 text-sm font-semibold text-white hover:opacity-95 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#2C4BFD] focus-within:ring-offset-2 dark:focus-within:ring-offset-gray-900"
              >
                UPLOAD
                <input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleUploadChange}
                />
              </label>
            </div>

            <div className="mt-7">
              <label htmlFor="profile-display-name" className="text-xs font-bold tracking-wide text-gray-600 dark:text-gray-300 block">
                NAME
              </label>
              <input
                id="profile-display-name"
                ref={nameRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                }}
                className={cx(
                  "mt-3 w-full rounded-2xl px-5 py-4 text-sm",
                  "bg-gray-50 border border-gray-200 text-gray-800",
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]/50 focus-visible:border-[#2C4BFD]/50",
                  errors.name && "border-red-500/60 focus-visible:ring-red-500/40"
                )}
                placeholder="Your display name"
                autoComplete="nickname"
              />
              {errors.name && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            <div className="mt-7">
              <label htmlFor="profile-bio" className="text-xs font-bold tracking-wide text-gray-600 dark:text-gray-300 block">
                BIO
              </label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  if (errors.bio) setErrors((p) => ({ ...p, bio: undefined }));
                }}
                rows={4}
                className={cx(
                  "mt-3 w-full resize-none rounded-2xl px-5 py-4 text-sm",
                  "bg-gray-50 border border-gray-200 text-gray-800",
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]/50 focus-visible:border-[#2C4BFD]/50",
                  errors.bio && "border-red-500/60 focus-visible:ring-red-500/40"
                )}
                placeholder="Short description (max 100 chars)"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">Short description (max 100 chars)</p>
                <p className={cx("text-xs", bio.length > BIO_MAX ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400")}>
                  {bio.length}/{BIO_MAX}
                </p>
              </div>
              {errors.bio && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.bio}</p>}
            </div>

            <div className="mt-7">
              <label htmlFor="profile-twitter-link" className="text-xs font-bold tracking-wide text-gray-600 dark:text-gray-300 block">
                LINKS
              </label>
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4 dark:bg-gray-800 dark:border-gray-700">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-gray-700 dark:text-gray-200" fill="currentColor">
                  <path d="M18.244 2H21l-6.52 7.46L22 22h-6.828l-5.35-6.92L3.78 22H1l7.02-8.04L2 2h6.999l4.84 6.29L18.244 2Zm-1.196 18h1.88L7.93 3.91H5.91L17.048 20Z" />
                </svg>

                <input
                  id="profile-twitter-link"
                  value={twitterLink}
                  onChange={(e) => {
                    setTwitterLink(e.target.value);
                    if (errors.twitterLink) setErrors((p) => ({ ...p, twitterLink: undefined }));
                  }}
                  className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]/40 rounded-md dark:text-gray-100 dark:placeholder:text-gray-500"
                  placeholder="https://x.com/your_handle"
                  autoComplete="url"
                />
              </div>

              {errors.twitterLink && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.twitterLink}</p>}
            </div>

            <div className="mt-7 rounded-2xl bg-gray-50 border border-gray-200 px-5 py-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-xs font-bold tracking-wide text-gray-700 dark:text-gray-200">STREAMER MODE</p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Enable to highlight your Kick link on Solee.
                  </p>
                </div>

                <div
                  role="switch"
                  tabIndex={0}
                  aria-checked={streamerMode}
                  aria-label="Streamer mode"
                  onClick={() => setStreamerMode((v) => !v)}
                  onKeyDown={(e) => onEnterOrSpace(e, () => setStreamerMode((v) => !v))}
                  className={cx(
                    "relative inline-flex h-7 w-12 items-center rounded-full cursor-pointer transition shrink-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800",
                    streamerMode ? "bg-[#2C4BFD]" : "bg-gray-300 dark:bg-gray-700"
                  )}
                >
                  <span
                    className={cx(
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white transition",
                      streamerMode ? "left-6" : "left-1"
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="mt-9 flex justify-end">
              <button
                type="button"
                onClick={() => { void handleSave(); }}
                disabled={isSaving}
                className={cx(
                  "rounded-2xl bg-[#2C4BFD] px-10 py-4 text-sm font-semibold text-white cursor-pointer hover:opacity-95",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900",
                  isSaving && "opacity-60 pointer-events-none cursor-not-allowed"
                )}
              >
                {isSaving ? "SAVING..." : "SAVE"}
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Your profile is synced with the server. Local drafts are used as fallback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSettingsModal({ onClose, initialValues }: Props) {
  const { profile, isLoading, loadProfile } = useProfileStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadProfile().then(
      () => setReady(true),
      () => setReady(true),
    );
  }, [loadProfile]);

  if (!ready || isLoading) {
    const shell = (
      <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-busy="true" aria-label="Profile settings">
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
          <div
            className={cx(
              "relative w-full max-w-3xl",
              "rounded-2xl bg-white dark:bg-gray-900",
              "border border-gray-100 dark:border-gray-800",
              "shadow-2xl",
              "flex flex-col items-center justify-center gap-4 py-24"
            )}
          >
            <p className="sr-only">Loading profile settings</p>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#2C4BFD]" aria-hidden />
          </div>
        </div>
      </div>
    );
    return createPortal(shell, document.body);
  }

  const resolved = resolveInitial(profile, initialValues);

  return createPortal(
    <ProfileSettingsForm onClose={onClose} resolved={resolved} />,
    document.body,
  );
}
