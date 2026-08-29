"use client";

import React, { useState, useEffect } from "react";
import { Shield, RefreshCw, Filter, Clock, User, Eye, Search } from "lucide-react";
import { AuditLogItem } from "@/types/triage";
import { formatTimeAgo } from "@/lib/utils";

export const AdminAuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterAction !== "ALL" && l.action !== filterAction) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Detail JSON Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Audit Record Detail: {selectedLog.action}</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                ? Close
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Actor:</strong> {selectedLog.actorRole} ({selectedLog.actorName})</p>
              <p><strong>Entity:</strong> {selectedLog.entityType} #{selectedLog.entityId}</p>
              <p><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}</p>
            </div>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80">
              {JSON.stringify(selectedLog.details, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Control Ribbon */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>Immutable Clinical Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every patient intake, red flag activation, and clinician decision is cryptographically logged.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">All Event Types</option>
            <option value="TRIAGE_INTAKE_SUBMITTED">Intake Submitted</option>
            <option value="CLINICIAN_TRIAGE_CONFIRMED">Clinician Confirmed</option>
            <option value="CLINICIAN_TRIAGE_OVERRIDE">Clinician Override</option>
            <option value="DETERMINISTIC_RED_FLAG_TRIGGERED">Red Flag Triggered</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Summary</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.action.includes("OVERRIDE")
                            ? "bg-purple-100 text-purple-800"
                            : log.action.includes("RED_FLAG")
                            ? "bg-red-100 text-red-800"
                            : log.action.includes("CONFIRMED")
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {log.actorRole} ({log.actorName})
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {log.entityType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
