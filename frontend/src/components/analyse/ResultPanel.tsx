/**
 * ResultPanel.tsx
 *
 * Renders the final analysis output and handles nullable nested fields safely.
 */

import type { AnalysisResult, Verdict } from "../../types/analysis";
import Badge from "../ui/Badge";

type ResultPanelProps = { result: AnalysisResult };

function verdictVariant(verdict: Verdict | null) {
  if (verdict === "real") return "success" as const;
  if (verdict === "fake") return "danger" as const;
  return "warning" as const;
}

function formatMetric(value: number | boolean | string | null | undefined) {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "number")
    return Number.isInteger(value) ? String(value) : value.toFixed(3);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}

function formatConfidence(value: number | null | undefined) {
  if (value === null || value === undefined) return "N/A";
  return `${(value * 100).toFixed(1)}%`;
}

function ResultPanel({ result }: ResultPanelProps) {
  const verdict = result.verdict ?? "inconclusive";

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">
            Analysis Result
          </h3>
          <p className="text-xs text-slate-400">Task ID: {result.task_id}</p>
          <p className="text-xs text-slate-500">
            Media Type: {result.media_type}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={verdictVariant(result.verdict)}>
            {verdict.toUpperCase()}
          </Badge>
          <Badge variant="info">
            Confidence: {formatConfidence(result.confidence)}
          </Badge>
          {result.processing_ms != null ? (
            <Badge variant="neutral">Latency: {result.processing_ms} ms</Badge>
          ) : null}
        </div>
      </div>

      {result.error_detail ? (
        <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-3 text-sm text-rose-100">
          <p className="font-medium">Analysis error</p>
          <p className="mt-1 text-rose-100/90">{result.error_detail}</p>
          {result.error_code ? (
            <p className="mt-1 text-xs text-rose-200/80">
              Code: {result.error_code}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200">
              rPPG Stream
            </h4>
            {result.rppg_result ? (
              <Badge variant="success">Available</Badge>
            ) : (
              <Badge variant="neutral">Analysis pending</Badge>
            )}
          </div>

          {result.rppg_result ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">BPM estimate</dt>
                <dd className="text-slate-100">
                  {formatMetric(result.rppg_result.bpm_estimate)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Signal quality</dt>
                <dd className="text-slate-100">
                  {formatMetric(result.rppg_result.signal_quality)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Spatial coherence</dt>
                <dd className="text-slate-100">
                  {formatMetric(result.rppg_result.spatial_coherence)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Biological signal</dt>
                <dd className="text-slate-100">
                  {formatMetric(result.rppg_result.is_biological)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Confidence</dt>
                <dd className="text-slate-100">
                  {formatConfidence(result.rppg_result.confidence)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Failure reason</dt>
                <dd className="max-w-44 text-right text-slate-100">
                  {formatMetric(result.rppg_result.failure_reason)}
                </dd>
              </div>
              {result.rppg_result.ppg_map_url ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">PPG map</dt>
                  <dd className="max-w-44 truncate text-right text-cyan-300">
                    <a
                      href={result.rppg_result.ppg_map_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-sm text-slate-400">
              No rPPG metrics were provided for this media type.
            </p>
          )}
        </article>

        <article className="rounded-xl border border-white/10 bg-slate-950/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-200">
              FaceMesh Geometry Stream
            </h4>
            {result.geometry_result ? (
              <Badge variant="success">Available</Badge>
            ) : (
              <Badge variant="neutral">Analysis pending</Badge>
            )}
          </div>

          {result.geometry_result ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">EAR mean</dt>
                <dd className="text-slate-100">
                  {formatMetric(result.geometry_result.ear_mean)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Blink rate / min</dt>
                <dd className="text-slate-100">
                  {formatMetric(result.geometry_result.blink_rate_per_min)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Landmark jitter</dt>
                <dd className="text-slate-100">
                  {formatMetric(result.geometry_result.landmark_jitter)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Lip-nose coupling</dt>
                <dd className="text-slate-100">
                  {formatMetric(result.geometry_result.lip_nose_coupling)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Confidence</dt>
                <dd className="text-slate-100">
                  {formatConfidence(result.geometry_result.confidence)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Failure reason</dt>
                <dd className="max-w-44 text-right text-slate-100">
                  {formatMetric(result.geometry_result.failure_reason)}
                </dd>
              </div>
              {result.geometry_result.landmark_map_url ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Landmark map</dt>
                  <dd className="max-w-44 truncate text-right text-cyan-300">
                    <a
                      href={result.geometry_result.landmark_map_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="text-sm text-slate-400">
              No FaceMesh geometry metrics were provided for this media type.
            </p>
          )}
        </article>
      </div>

      {result.heatmap_url || result.report_url ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.heatmap_url ? (
            <a
              href={result.heatmap_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-cyan-300 transition hover:bg-slate-900"
            >
              Open heatmap
            </a>
          ) : null}

          {result.report_url ? (
            <a
              href={result.report_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-cyan-300 transition hover:bg-slate-900"
            >
              Open report
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default ResultPanel;
