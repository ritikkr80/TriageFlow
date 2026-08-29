"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Clock, CheckCircle2, User, Search, RefreshCw, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";
import { TriageSessionItem } from "@/types/triage";
import { getEsiBadge, formatTimeAgo } from "@/lib/utils";
import { ClinicianReviewDrawer } from "./ClinicianReviewDrawer";

export const ClinicianQueue: React.FC = () => {
  const [sessions, setSessions] = useState<TriageSessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterEsi, setFilterEsi] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [selectedSession, setSelectedSession] = useState<TriageSessionItem | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Failed to fetch triage queue");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err: any) {
      setError(err.message || "Failed to load triage queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const filteredSessions = sessions.filter((s) => {
    if (filterStatus !== "ALL" && s.status !== filterStatus) return false;
    if (filterEsi !== "ALL" && s.assessment?.esiLevel !== parseInt(filterEsi, 10)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.patient.name.toLowerCase().includes(q);
      const matchComplaint = s.chiefComplaint.toLowerCase().includes(q);
      const matchId = s.id.toLowerCase().includes(q);
      if (!matchName && !matchComplaint && !matchId) return false;
    }
    return true;
  });

  const pendingCount = sessions.filter((s) => s.status === "PENDING_REVIEW").length;
  const criticalCount = sessions.filter(
    (s) => s.status === "PENDING_REVIEW" && (s.assessment?.esiLevel === 1 || s.assessment?.esiLevel === 2)
  ).length;

  return (
    <div className="space-y-6">
      {/* Review Drawer Modal */}
      {selectedSession && (
        <ClinicianReviewDrawer
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSuccess={() => fetchSessions()}
        />
      )}

      {/* Top Census Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Active Queue</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{sessions.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Human Review</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">High-Acuity (ESI 1-2)</span>
          <p className="text-2xl font-black text-red-600 mt-1">{criticalCount}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Auto Refresh</span>
            <p className="text-xs text-slate-600 mt-1">Live sync every 15s</p>
          </div>
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters and Search Ribbon */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, complaint, ID..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {["ALL", "PENDING_REVIEW", "TRIAGED", "OVERRIDDEN"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === st ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? "All Status" : st.replace("_", " ")}
              </button>
            ))}
          </div>

          <select
            value={filterEsi}
            onChange={(e) => setFilterEsi(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">All Acuities</option>
            <option value="1">ESI 1 - Resuscitation</option>
            <option value="2">ESI 2 - Emergent</option>
            <option value="3">ESI 3 - Urgent</option>
            <option value="4">ESI 4 - Less Urgent</option>
            <option value="5">ESI 5 - Non-Urgent</option>
          </select>
        </div>
      </div>

      {/* Patient Queue Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading live triage queue...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No patients found matching the active filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">Acuity</th>
                  <th className="py-3 px-4">Patient Demographics</th>
                  <th className="py-3 px-4">Chief Complaint & Vitals</th>
                  <th className="py-3 px-4">Red Flags & Safety</th>
                  <th className="py-3 px-4">Arrival / Status</th>
                  <th className="py-3 px-4 text-right">Clinician Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                {filteredSessions.map((item) => {
                  const esi = getEsiBadge(item.assessment?.esiLevel || 3);
                  const isPending = item.status === "PENDING_REVIEW";
                  const isHighAcuity = item.assessment?.esiLevel === 1 || item.assessment?.esiLevel === 2;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isHighAcuity && isPending ? "bg-red-50/30" : ""
                      }`}
                    >
                      {/* Acuity Level Pill */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs ${esi.badge} shadow-sm`}>
                          ESI {item.assessment?.esiLevel}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-semibold mt-1">
                          {esi.urgency}
                        </span>
                      </td>

                      {/* Patient Name & Details */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{item.patient.name}</div>
                        <div className="text-xs text-slate-500">
                          {item.patient.age}yo &bull; {item.patient.sex} &bull; {item.arrivalMode}
                        </div>
                        {item.patient.medicalHistory.length > 0 && (
                          <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                            Hx: {item.patient.medicalHistory.join(", ")}
                          </div>
                        )}
                      </td>

                      {/* Chief Complaint & Vitals */}
                      <td className="py-4 px-4 max-w-sm">
                        <div className="font-semibold text-slate-800 line-clamp-2">
                          &ldquo;{item.chiefComplaint}&rdquo;
                        </div>
                        {item.vitals && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono mt-1">
                            {item.vitals.heartRate && <span>HR: {item.vitals.heartRate}</span>}
                            {item.vitals.systolicBp && <span>BP: {item.vitals.systolicBp}/{item.vitals.diastolicBp}</span>}
                            {item.vitals.oxygenSaturation && <span>SpO2: {item.vitals.oxygenSaturation}%</span>}
                            {item.vitals.painScore !== undefined && (
                              <span className="text-red-600 font-bold">Pain: {item.vitals.painScore}/10</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Red Flags */}
                      <td className="py-4 px-4">
                        {item.redFlags.length > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-md">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{item.redFlags.length} Red Flags</span>
                            </span>
                            <p className="text-[10px] text-red-800 line-clamp-1">
                              {item.redFlags[0].description}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>No immediate flags</span>
                          </span>
                        )}
                      </td>

                      {/* Arrival & Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatTimeAgo(item.createdAt)}</span>
                        </div>
                        <div className="mt-1">
                          {item.status === "PENDING_REVIEW" && (
                            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                              Needs Review
                            </span>
                          )}
                          {item.status === "TRIAGED" && (
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                              Confirmed (RN)
                            </span>
                          )}
                          {item.status === "OVERRIDDEN" && (
                            <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-bold">
                              Overridden
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedSession(item)}
                          type="button"
                          className="px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <span>Review Case</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
