import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  UploadCloud,
  X,
  Pause,
  Play,
  XCircle,
  Check,
} from "lucide-react";
import type { VehicleDocument } from "./VehicleInformationPage";

type FileState = "empty" | "uploading" | "ready";

function statusBadgeClasses(status: VehicleDocument["status"]) {
  switch (status) {
    case "on-file":
      return "bg-[#DCF5E4] text-[#1E9E56]";
    case "missing":
      return "bg-[#FDF1DC] text-[#E8A93E]";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function DocumentUpdatePage({
  document: doc,
  vehicleName,
  onBack,
  onSubmitted,
}: {
  document: VehicleDocument;
  vehicleName: string;
  onBack: () => void;
  onSubmitted: (fileName: string, previewUrl?: string) => void;
}) {
  const [fileState, setFileState] = useState<FileState>("empty");
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isImage, setIsImage] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // Whether we're still showing the read-only "existing document on file"
  // view (from the API) rather than the upload flow. Driven by whether the
  // document actually has a file attached, not by an invented status.
  const [viewingExisting, setViewingExisting] = useState(Boolean(doc.fileName));

  const inputRef = useRef<HTMLInputElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startUpload = (file: File) => {
    setViewingExisting(false);
    setFileName(file.name);
    setIsImage(file.type.startsWith("image/"));
    setPreviewUrl(
      file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    );
    setProgress(0);
    setPaused(false);
    setFileState("uploading");

    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.floor(Math.random() * 10) + 6;
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setFileState("ready");
          return 100;
        }
        return next;
      });
    }, 220);
  };

  const togglePause = () => {
    if (paused) {
      setPaused(false);
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          const next = p + Math.floor(Math.random() * 10) + 6;
          if (next >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setFileState("ready");
            return 100;
          }
          return next;
        });
      }, 220);
    } else {
      setPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const cancelUpload = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFileState("empty");
    setProgress(0);
    setPaused(false);
    setFileName("");
    setPreviewUrl("");
    setViewingExisting(Boolean(doc.fileName));
  };

  const secondsRemaining = Math.max(1, Math.ceil((100 - progress) / 10));

  const submit = () => {
    setShowSuccess(true);
  };

  const finishDone = () => {
    setShowSuccess(false);
    onSubmitted(fileName, previewUrl || undefined);
    onBack();
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-white font-outfit">
      <div className="flex-1 min-h-0 px-6 pt-4 pb-10 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={onBack}
              className="absolute left-0 flex items-center justify-center rounded-full shadow-md h-11 w-11 bg-gray-50"
            >
              <ChevronLeft size={22} className="text-[#1F2937]" />
            </button>
            <h1 className="text-xl font-bold text-[#1F2937]">
              Update Document
            </h1>
          </div>

          {/* document summary card */}
          <div className="p-4 mt-6 border border-gray-100 shadow-sm rounded-2xl">
            <h2 className="text-xl font-bold text-[#2b2b2b]">{doc.label}</h2>
            <p className="mt-1 text-[15px] text-[#9AA5B8]">{vehicleName}</p>
            <div className="mt-2.5 flex items-center gap-2.5">
              <span
                className={`rounded-full px-3 py-1 text-[13px] font-semibold ${statusBadgeClasses(
                  doc.status,
                )}`}
              >
                {doc.badgeText}
              </span>
              <span className="text-[15px] text-[#9AA5B8]">
                {doc.expiresLabel}
              </span>
            </div>
          </div>

          {/* existing document already on file, from the API */}
          {viewingExisting && (
            <>
              <div className="mt-6 overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                {doc.previewUrl ? (
                  <img
                    src={doc.previewUrl}
                    alt={doc.fileName}
                    className="object-cover w-full max-h-72"
                  />
                ) : null}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="truncate text-[15px] text-[#1F2937]">
                    {doc.fileName || "Document"}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-[#1E9E56]">
                    On file
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-4 w-full rounded-2xl border border-gray-200 py-3 text-[15px] font-semibold text-[#6E43A3]"
              >
                Replace document
              </button>
            </>
          )}

          {/* upload flow */}
          {!viewingExisting && fileState === "empty" && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center w-full h-64 gap-3 px-6 mt-6 text-center bg-white border-2 border-gray-300 border-dashed rounded-2xl"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F2F5]">
                <UploadCloud size={26} className="text-[#4B5768]" />
              </span>
              <span className="text-lg font-semibold text-[#1F2937]">
                Upload {doc.label}
              </span>
              <span className="text-[15px] text-[#9AA5B8]">
                Take a photo or upload from files
              </span>
            </button>
          )}

          {!viewingExisting && fileState !== "empty" && (
            <div className="mt-6 overflow-hidden bg-white border-2 border-gray-300 border-dashed rounded-2xl">
              <div className="relative">
                {isImage && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={fileName}
                    className="object-cover w-full max-h-72"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-[#F1F2F5] text-[#9AA5B8]">
                    {fileName}
                  </div>
                )}
                {fileState === "ready" && (
                  <button
                    type="button"
                    onClick={cancelUpload}
                    aria-label="Remove file"
                    className="absolute flex items-center justify-center text-white rounded-full right-3 top-3 h-7 w-7 bg-black/60"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-[#1F2937]">
                    {fileName}
                  </p>
                  {fileState === "uploading" && (
                    <p className="text-[13px] text-[#9AA5B8]">
                      {paused
                        ? "Paused"
                        : `${secondsRemaining} seconds remaining`}
                    </p>
                  )}
                </div>

                {fileState === "uploading" && (
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13px] font-semibold text-[#3b7ec2]">
                      Uploading... {Math.min(progress, 99)}%
                    </span>
                    <button
                      type="button"
                      onClick={togglePause}
                      aria-label={paused ? "Resume upload" : "Pause upload"}
                      className="flex items-center justify-center w-8 h-8 text-gray-600 bg-gray-100 rounded-full"
                    >
                      {paused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={cancelUpload}
                      aria-label="Cancel upload"
                      className="flex items-center justify-center w-8 h-8 text-red-500 rounded-full"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                )}

                {fileState === "ready" && (
                  <span className="shrink-0 text-[13px] font-semibold text-[#1E9E56]">
                    Ready
                  </span>
                )}
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) startUpload(file);
            }}
          />
        </div>
      </div>

      {!viewingExisting && fileState === "ready" && (
        <div className="px-6 pb-8">
          <div className="w-full max-w-xl mx-auto">
            <button
              onClick={submit}
              className="h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
            >
              Submit for review
            </button>
          </div>
        </div>
      )}

      {/* Success modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm px-6 py-8 text-center bg-white shadow-2xl rounded-3xl">
            <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-emerald-50">
              <div className="flex items-center justify-center rounded-full h-14 w-14 bg-emerald-500">
                <Check size={28} className="text-white" strokeWidth={3} />
              </div>
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#2b2b2b]">
              Document submitted successfully
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Your document has been submitted successfully. We'll review it and
              notify you once there's an update.
            </p>

            <button
              onClick={finishDone}
              className="mt-6 h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
