// ============================================
// Admin Student Directory & Permission Management
// ============================================
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader2, Users, Filter, UserCheck, UserX,
  Award, ShieldAlert, CheckCircle2, XCircle, FileText,
  ExternalLink, X, ChevronRight, Briefcase, Mail, Phone, GraduationCap
} from 'lucide-react';
import { formatDate } from '../utils/constants';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [searchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('all');
  const [placementStatus, setPlacementStatus] = useState(searchParams.get('placement_status') || 'all');
  const [permissionFilter, setPermissionFilter] = useState('all');
  const [minCgpa, setMinCgpa] = useState('');

  // Student Profile Detail Modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Permission Edit State
  const [permissionToggle, setPermissionToggle] = useState(true);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [updatingPermission, setUpdatingPermission] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [page, search, branch, placementStatus, permissionFilter, minCgpa]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getStudents({
        page,
        limit: 12,
        search,
        branch,
        placement_status: placementStatus,
        permission: permissionFilter,
        min_cgpa: minCgpa
      });
      setStudents(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentDetails = async (student) => {
    setSelectedStudentId(student.user_id || student.id);
    setLoadingDetails(true);
    try {
      const { data } = await adminAPI.getStudentDetails(student.student_id || student.user_id || student.id);
      setStudentDetails(data.data);
      setPermissionToggle(data.data.profile.placement_permission !== false);
      setRestrictionReason(data.data.profile.restriction_reason || '');
    } catch (err) {
      toast.error('Failed to load student profile details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSavePermission = async () => {
    if (!selectedStudentId) return;
    setUpdatingPermission(true);
    try {
      await adminAPI.updateStudentPermission(selectedStudentId, {
        placement_permission: permissionToggle,
        restriction_reason: permissionToggle ? null : restrictionReason
      });
      toast.success(`Permission set to ${permissionToggle ? 'Allowed' : 'Restricted'}`);
      
      // Update local lists
      setStudents(students.map(s => {
        if (s.user_id === selectedStudentId || s.student_id === selectedStudentId) {
          return { ...s, placement_permission: permissionToggle, restriction_reason: restrictionReason };
        }
        return s;
      }));
      if (studentDetails) {
        setStudentDetails({
          ...studentDetails,
          profile: {
            ...studentDetails.profile,
            placement_permission: permissionToggle,
            restriction_reason: restrictionReason
          }
        });
      }
    } catch (err) {
      toast.error('Failed to update student permission');
    } finally {
      setUpdatingPermission(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b border-[#222] pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Student Placement Directory</h1>
        <p className="text-surface-200/50 text-sm mt-1">
          Monitor student academic profiles, track hire status, and manage placement application permissions.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/40" />
            <input
              type="text"
              placeholder="Search by name, email, branch..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field text-xs pl-9 py-2"
            />
          </div>

          {/* Placement Status */}
          <div>
            <select
              value={placementStatus}
              onChange={(e) => { setPlacementStatus(e.target.value); setPage(1); }}
              className="input-field text-xs py-2"
            >
              <option value="all">Placement Status: All</option>
              <option value="placed">Placed Only</option>
              <option value="unplaced">Unplaced Only</option>
            </select>
          </div>

          {/* Permission Filter */}
          <div>
            <select
              value={permissionFilter}
              onChange={(e) => { setPermissionFilter(e.target.value); setPage(1); }}
              className="input-field text-xs py-2"
            >
              <option value="all">Permission: All</option>
              <option value="allowed">Allowed to Apply</option>
              <option value="restricted">Restricted by T&P</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branch}
              onChange={(e) => { setBranch(e.target.value); setPage(1); }}
              className="input-field text-xs py-2"
            >
              <option value="all">Branch: All</option>
              <option value="Computer Science">Computer Science / IT</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics & Comm</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electrical">Electrical</option>
              <option value="Civil">Civil</option>
            </select>
          </div>

          {/* Min CGPA */}
          <div>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="Min CGPA cutoff (e.g. 7.5)"
              value={minCgpa}
              onChange={(e) => { setMinCgpa(e.target.value); setPage(1); }}
              className="input-field text-xs py-2"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden border border-[#222]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase tracking-wider text-surface-200/50 bg-[#141414] border-b border-[#242424] font-semibold">
              <tr>
                <th className="px-4 py-3.5">Candidate</th>
                <th className="px-4 py-3.5">College & Branch</th>
                <th className="px-3 py-3.5 text-center">CGPA</th>
                <th className="px-3 py-3.5 text-center">Grad Year</th>
                <th className="px-3 py-3.5 text-center">Placement Status</th>
                <th className="px-3 py-3.5 text-center">Apps</th>
                <th className="px-3 py-3.5 text-center">Offers</th>
                <th className="px-3 py-3.5 text-center">T&P Permission</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center text-surface-200/50">
                    <Loader2 size={28} className="animate-spin mx-auto text-emerald-500" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center text-surface-200/50">
                    <Users size={32} className="mb-2 mx-auto opacity-20" />
                    No students matched the selected filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.user_id || student.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{student.full_name}</p>
                      <p className="text-xs text-surface-200/50 font-mono">{student.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="text-surface-200/90 font-medium">{student.branch || 'Engineering'}</p>
                      <p className="text-surface-200/40">{student.college || 'College of Engineering'}</p>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-emerald-400 text-xs">
                      {student.cgpa ? parseFloat(student.cgpa).toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-surface-200/70 font-mono">
                      {student.graduation_year || '2026'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {student.is_placed ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Placed
                          </span>
                          {student.placed_company && (
                            <span className="text-[10px] text-surface-200/60 mt-0.5 truncate max-w-[90px]">
                              {student.placed_company}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Unplaced
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-white text-xs">
                      {student.total_applications || 0}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-400 text-xs">
                      {student.offers || 0}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {student.placement_permission ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={11} /> Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20" title={student.restriction_reason || 'Restricted'}>
                          <XCircle size={11} /> Restricted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenStudentDetails(student)}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-[#222] text-xs text-surface-200/60">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 rounded bg-[#181818] hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 rounded bg-[#181818] hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </motion.div>

      {/* MODAL: Full Student Placement Profile & Permission Controls */}
      <AnimatePresence>
        {selectedStudentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedStudentId(null)} />
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-3xl bg-[#0d0d0d] border border-[#2b2b2b] rounded-2xl p-6 overflow-hidden z-10 shadow-2xl max-h-[92vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#222]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <GraduationCap size={20} className="text-emerald-400" />
                  Candidate Placement Dossier
                </h3>
                <button onClick={() => setSelectedStudentId(null)} className="text-surface-200/50 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {loadingDetails || !studentDetails ? (
                <div className="py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>
              ) : (
                <div className="space-y-6 overflow-y-auto pr-1">
                  {/* Top Candidate Snapshot */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-[#242424] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="text-xl font-bold text-white">{studentDetails.profile.full_name}</h4>
                      <p className="text-xs text-surface-200/60 mt-0.5">{studentDetails.profile.email} • {studentDetails.profile.phone || 'No phone'}</p>
                      <p className="text-xs text-surface-200/50 mt-1">
                        {studentDetails.profile.branch} • Class of {studentDetails.profile.graduation_year} • CGPA: <strong className="text-emerald-400 font-mono">{studentDetails.profile.cgpa || 'N/A'}</strong>
                      </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        studentDetails.profile.is_placed
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {studentDetails.profile.is_placed ? 'Placed' : 'Unplaced'}
                      </span>
                      {studentDetails.profile.placed_company && (
                        <p className="text-xs text-white font-semibold mt-1">
                          {studentDetails.profile.placed_company} ({studentDetails.profile.placed_package})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Permission Control Center */}
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={18} className="text-amber-400" />
                        <h5 className="text-sm font-bold text-white">T&P Placement Application Permission</h5>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                        permissionToggle ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {permissionToggle ? 'Currently Allowed' : 'Currently Restricted'}
                      </span>
                    </div>
                    <p className="text-xs text-surface-200/60 mb-3">
                      When restricted, the candidate cannot submit applications to any campus recruitment drives.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer">
                          <input
                            type="radio"
                            name="permStatus"
                            checked={permissionToggle === true}
                            onChange={() => setPermissionToggle(true)}
                            className="accent-emerald-500"
                          />
                          Allowed to apply
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer">
                          <input
                            type="radio"
                            name="permStatus"
                            checked={permissionToggle === false}
                            onChange={() => setPermissionToggle(false)}
                            className="accent-red-500"
                          />
                          Restricted (Block applications)
                        </label>
                      </div>

                      {!permissionToggle && (
                        <div>
                          <label className="block text-xs font-semibold text-surface-200/60 mb-1">Reason for restriction *</label>
                          <input
                            type="text"
                            placeholder="e.g. Already placed in Google Tier-1; policy violation; attendance shortage..."
                            value={restrictionReason}
                            onChange={(e) => setRestrictionReason(e.target.value)}
                            className="input-field text-xs py-1.5"
                          />
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={handleSavePermission}
                          disabled={updatingPermission}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
                        >
                          {updatingPermission ? <Loader2 size={13} className="animate-spin" /> : null}
                          Save Permission
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Resumes */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-surface-200/50 mb-2">Uploaded Resumes</h5>
                    {studentDetails.resumes?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {studentDetails.resumes.map(r => (
                          <div key={r.id} className="p-3 rounded-lg border border-[#222] bg-[#141414] flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText size={16} className="text-emerald-400 flex-shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-medium text-white truncate">{r.name}</p>
                                <p className="text-[10px] text-surface-200/40">Target: {r.target_company || 'General'}</p>
                              </div>
                            </div>
                            <a
                              href={r.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 text-[11px] rounded bg-white/5 hover:bg-white/10 text-white flex items-center gap-1"
                            >
                              View <ExternalLink size={11} />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-surface-200/40 italic">No resumes uploaded by student</p>
                    )}
                  </div>

                  {/* Application History */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-surface-200/50 mb-2">Application & Selection History</h5>
                    {studentDetails.applications?.length > 0 ? (
                      <div className="border border-[#222] rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#141414] text-surface-200/50 font-semibold border-b border-[#222]">
                            <tr>
                              <th className="py-2.5 px-3">Recruiter</th>
                              <th className="py-2.5 px-3">Role</th>
                              <th className="py-2.5 px-3">Package</th>
                              <th className="py-2.5 px-3">Applied On</th>
                              <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e1e1e]">
                            {studentDetails.applications.map(app => (
                              <tr key={app.id}>
                                <td className="py-2.5 px-3 font-semibold text-white">{app.company_name}</td>
                                <td className="py-2.5 px-3 text-surface-200/70">{app.role}</td>
                                <td className="py-2.5 px-3 font-mono text-emerald-400">{app.package || 'N/A'}</td>
                                <td className="py-2.5 px-3 text-surface-200/50">{new Date(app.applied_at).toLocaleDateString()}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    app.status === 'selected'
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : app.status === 'shortlisted'
                                      ? 'bg-blue-500/15 text-blue-400'
                                      : app.status === 'rejected'
                                      ? 'bg-red-500/15 text-red-400'
                                      : 'bg-amber-500/15 text-amber-400'
                                  }`}>
                                    {app.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-surface-200/40 italic">No applications submitted yet</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
