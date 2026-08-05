import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { motion } from 'framer-motion';
import { Search, Loader2, Users } from 'lucide-react';
import { formatDate } from '../utils/constants';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getStudents({ page, limit: 10, search });
      setStudents(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-200">Students</h1>
          <p className="text-surface-200/50 mt-1">Manage and view all registered students.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-200/40" />
          <input
            type="text"
            placeholder="Search students..."
            className="input-field pl-10 w-full"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-surface-200/50 bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Name & Email</th>
                <th className="px-6 py-4 font-semibold">College & Branch</th>
                <th className="px-6 py-4 font-semibold text-center">Applications</th>
                <th className="px-6 py-4 font-semibold text-center">Offers</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-surface-200/50">
                    <Loader2 size={24} className="animate-spin mx-auto" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-surface-200/50 flex flex-col items-center">
                    <Users size={32} className="mb-2 opacity-20" />
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-surface-200">{student.full_name}</p>
                      <p className="text-xs text-surface-200/50 mt-1">{student.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-surface-200/80">{student.college || 'N/A'}</p>
                      <p className="text-xs text-surface-200/50 mt-1">{student.branch || 'N/A'} • {student.graduation_year || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-surface-200 font-medium">
                        {student.total_applications || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-success/10 text-success font-medium">
                        {student.offers || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-surface-200/60">
                      {formatDate(student.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between text-sm">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <span className="text-surface-200/50">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
