'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function UploadZone({ onUploadComplete }: { onUploadComplete: () => void }) {
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setStatus('uploading');
        setMessage('Processing...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.details || errData.error || 'Upload failed');
            }

            const data = await res.json();
            setStatus('success');
            setMessage(`${data.count} Recs.`);
            onUploadComplete();

            setTimeout(() => {
                setStatus('idle');
                setMessage('');
            }, 3000);

        } catch (e: any) {
            setStatus('error');
            setMessage(e.message || 'Error.');
        }
    }, [onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 h-40 flex flex-col items-center justify-center group overflow-hidden relative",
                isDragActive ? "border-blue-500 bg-blue-500/10" : "border-slate-700 hover:border-blue-500 hover:bg-slate-800",
                status === 'error' && "border-rose-500 bg-rose-500/10",
                status === 'success' && "border-emerald-500 bg-emerald-500/10"
            )}
        >
            <input {...getInputProps()} />

            {/* Background grid pattern for flair */}
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                {status === 'idle' && (
                    <>
                        <div className="p-3 bg-slate-800 rounded-full group-hover:scale-110 transition-transform duration-300 text-slate-400 group-hover:text-blue-400">
                            <UploadCloud size={28} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">DRAG & DROP DATA</p>
                            <p className="text-[10px] text-slate-500 font-mono">SUPPORTS .XLSX / .XLS</p>
                        </div>
                    </>
                )}

                {status === 'uploading' && (
                    <>
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-blue-400 font-mono text-xs font-bold animate-pulse">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="p-2 bg-emerald-500/20 rounded-full">
                            <CheckCircle className="text-emerald-500" size={32} />
                        </div>
                        <p className="text-emerald-500 font-mono text-xs font-bold">{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="p-2 bg-rose-500/20 rounded-full">
                            <AlertCircle className="text-rose-500" size={32} />
                        </div>
                        <p className="text-rose-500 font-mono text-xs font-bold px-2 break-all max-w-[200px] text-center">{message}</p>
                    </>
                )}
            </div>
        </div>
    );
}
